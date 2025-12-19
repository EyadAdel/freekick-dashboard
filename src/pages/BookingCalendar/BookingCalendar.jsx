import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarBookings } from '../../hooks/useBookings.js';
import CustomDropdown from '../../components/common/CustomDropdown.jsx';
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

// ============================================================================
// UTILITY CLASSES
// ============================================================================

class DateFormatter {
    static toAPI(date) {
        // Convert local date to UTC date string
        const utcDate = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        ));
        return utcDate.toISOString().split('T')[0];
    }

    static toDisplay(date, locale = 'en-US') {
        return date.toLocaleDateString(locale, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        });
    }

    static toInput(date) {
        // Get UTC date components
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static toAMPM(dateTime) {
        const date = new Date(dateTime);
        const timeString = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC'
        });
        return this.forceLTR(timeString);
    }

    // Change from private to public static method
    static forceLTR(text) {
        // Unicode directional isolation characters
        return `\u2066${text}\u2069`;
    }

    static formatTimeRange(startTime, endTime) {
        const start = this.toAMPM(startTime);
        const end = this.toAMPM(endTime);
        return `${start} - ${end}`;
    }

    // Helper to get UTC date at start of day
    static getUTCDateStart(localDate) {
        return new Date(Date.UTC(
            localDate.getFullYear(),
            localDate.getMonth(),
            localDate.getDate(),
            0, 0, 0, 0
        ));
    }

    // Helper to parse input date as UTC
    static parseUTCDate(dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }
}
class TimeSlotGenerator {
    static DEFAULT_START = 1;
    static DEFAULT_END = 24;

    static generate(bookings = []) {
        const { start, end } = this.#calculateRange(bookings);
        return this.#createSlots(start, end);
    }

    static #calculateRange(bookings) {
        if (!bookings.length) {
            return { start: this.DEFAULT_START, end: this.DEFAULT_END };
        }

        let earliest = 24;
        let latest = 0;

        bookings.forEach(booking => {
            const startHour = new Date(booking.start_time).getUTCHours();  // Use getUTCHours
            const endHour = new Date(booking.end_time).getUTCHours();      // Use getUTCHours

            earliest = Math.min(earliest, Math.max(this.DEFAULT_START, startHour));
            // Changed: Allow latest to go up to 24 (midnight) instead of capping at 23
            latest = Math.max(latest, endHour === 0 ? 24 : endHour + 1);
        });

        return {
            start: Math.min(earliest, this.DEFAULT_START),
            end: Math.max(latest, this.DEFAULT_END)
        };
    }


    static #createSlots(start, end) {
        const slots = [];
        for (let hour = start; hour <= end; hour++) {
            // Handle hour 24 as 12 AM (midnight)
            const displayHour = hour === 24 ? 12 : (hour % 12 || 12);
            const period = (hour >= 12 && hour < 24) ? 'PM' : 'AM';
            const timeString = `${displayHour}:00 ${period}`;

            slots.push({
                hour24: hour,
                hour12: displayHour,
                period,
                display: DateFormatter.forceLTR(timeString),
                key: `slot-${hour}`
            });
        }
        return slots;
    }
}
class BookingGrouper {
    static byPitch(bookings, t) {
        const groups = {};

        bookings.forEach(booking => {
            const key = this.#generateKey(booking, t);
            if (!groups[key]) {
                groups[key] = {
                    bookings: [],
                    pitchImage: booking.pitch?.pitch_image || booking.pitch?.image || null,
                    pitchName: booking.pitch?.translations?.name || t('calendar.grid.unknownPitch', 'Unknown Pitch'),
                    venueName: booking.venue?.translations?.name || t('calendar.grid.venueFormat', { id: booking.venue?.id }, `Venue ${booking.venue?.id}`)
                };
            }
            groups[key].bookings.push(booking);
        });

        return groups;
    }

    static #generateKey(booking, t) {
        const pitchName = booking.pitch?.translations?.name || t('calendar.grid.unknownPitch', 'Unknown Pitch');
        const venueId = booking.venue?.id;
        const venueName = booking.venue?.translations?.name || t('calendar.grid.venueFormat', { id: venueId }, `Venue ${venueId}`);

        return `${venueName}||${pitchName}`;
    }
}

const PitchImage = ({ imageUrl, pitchName }) => {
    const { t } = useTranslation('calendar');
    const [hasError, setHasError] = useState(false);

    // Reset error state when imageUrl changes
    useEffect(() => {
        setHasError(false);
    }, [imageUrl]);

    if (hasError || !imageUrl) {
        return (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                    {pitchName?.charAt(0) || 'P'}
                </span>
            </div>
        );
    }

    return (
        <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white shadow-sm">
            <img
                src={imageUrl}
                alt={pitchName || t('calendar.pitchImage.alt', 'Pitch')}
                className="w-full h-full object-cover"
                onError={() => setHasError(true)}
            />
        </div>
    );
};
class BookingPositionCalculator {
    constructor(timeSlots) {
        this.timeSlots = timeSlots;
        this.firstHour = timeSlots[0]?.hour24 || 9;
        this.totalSlots = timeSlots.length;
    }

    getTopPosition(dateTime) {
        const date = new Date(dateTime);
        const hours = date.getUTCHours();  // Use getUTCHours
        const minutes = date.getUTCMinutes();  // Use getUTCMinutes

        const slotIndex = hours - this.firstHour;
        const positionWithinSlot = minutes / 60;
        const totalPosition = slotIndex + positionWithinSlot;

        return (totalPosition / this.totalSlots) * 100;
    }

    getHeight(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMinutes = (end - start) / (1000 * 60);
        const durationInSlots = durationMinutes / 60;

        return (durationInSlots / this.totalSlots) * 100;
    }
}
class StatusColorMapper {
    static get(status, isActive) {
        if (!isActive) return 'bg-red-50 border-red-300 text-red-700';

        const colorMap = {
            pending: 'bg-amber-50 border-amber-200 text-amber-800',
            cancelled: 'bg-gray-50 border-gray-300 text-gray-700',
            completed: 'bg-emerald-50 border-emerald-300 text-emerald-700'
        };

        return colorMap[status] || 'bg-primary-50 border-primary-300 text-primary-700';
    }
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useDatePicker = (initialDate) => {
    const [selectedDate, setSelectedDate] = useState(DateFormatter.getUTCDateStart(initialDate));
    const [tempDate, setTempDate] = useState(DateFormatter.getUTCDateStart(initialDate));
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);
    const inputRef = useRef(null);

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setUTCDate(newDate.getUTCDate() + days);
        setSelectedDate(newDate);
        setTempDate(newDate);
        setShowPicker(false);
    };

    const setToday = () => {
        const now = new Date();
        const todayUTC = DateFormatter.getUTCDateStart(now);
        setSelectedDate(todayUTC);
        setTempDate(todayUTC);
        setShowPicker(false);
    };

    const handleDateChange = (event) => {
        const newDate = DateFormatter.parseUTCDate(event.target.value);
        setTempDate(newDate);
        setSelectedDate(newDate);
    };

    const handleDateBlur = () => {
        setTimeout(() => setShowPicker(false), 0);
    };

    // Sync temp date when selected date changes
    useEffect(() => {
        setTempDate(selectedDate);
    }, [selectedDate]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showPicker &&
                pickerRef.current &&
                !pickerRef.current.contains(event.target)) {
                setShowPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPicker]);

    return {
        selectedDate,
        tempDate,
        showPicker,
        setShowPicker,
        pickerRef,
        inputRef,
        changeDate,
        setToday,
        handleDateChange,
        handleDateBlur,
        // Expose the state setter if needed elsewhere
        updateDate: setSelectedDate
    };
};

const useVenueFilter = (bookings, selectedDate, t) => {
    const [selectedVenue, setSelectedVenue] = useState('all');

    // Reset venue selection when date changes
    useEffect(() => {
        setSelectedVenue('all');
    }, [selectedDate]);

    const venueOptions = useMemo(() => {
        if (!bookings?.length) return [{ value: 'all', label: t('calendar.header.allVenues', 'All Venues') }];

        const options = [{ value: 'all', label: t('calendar.header.allVenues', 'All Venues') }];
        const venueMap = new Map();

        bookings.forEach(booking => {
            if (booking.venue?.id && !venueMap.has(booking.venue.id)) {
                venueMap.set(booking.venue.id, {
                    value: booking.venue.id,
                    label: booking.venue.translations?.name ||
                        t('calendar.grid.venueFormat', { id: booking.venue.id }, `Venue ${booking.venue.id}`)
                });
            }
        });

        const sortedVenues = Array.from(venueMap.values()).sort((a, b) =>
            a.label.localeCompare(b.label)
        );
        options.push(...sortedVenues);

        return options;
    }, [bookings, t]);

    return { selectedVenue, setSelectedVenue, venueOptions };
};

// ============================================================================
// COMPONENTS
// ============================================================================

const LoadingOverlay = () => {
    const { t } = useTranslation('calendar');

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span className="text-sm text-gray-600">
                    {t('calendar.loading.loadingBookings', 'Loading bookings...')}
                </span>
            </div>
        </div>
    );
};

const ErrorState = ({ error, onRetry }) => {
    const { t } = useTranslation('calendar');

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">
                        {t('calendar.errorState.errorLoading', { error }, `Error loading bookings: ${error}`)}
                    </p>
                    <button
                        onClick={onRetry}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        {t('calendar.errorState.retry', 'Retry')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EmptyState = () => {
    const { t } = useTranslation('calendar');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('calendar.emptyState.title', 'No bookings found')}
            </h3>
            <p className="text-gray-500">
                {t('calendar.emptyState.description', 'There are no bookings for the selected date.')}
            </p>
        </div>
    );
};
const DirectionalArrow = ({ direction, onClick, disabled, className, size = "md" }) => {
    const { t,i18n } = useTranslation();

    // In RTL: left arrow means "next", right arrow means "previous"
    // In LTR: left arrow means "previous", right arrow means "next"
    const isRTL = i18n.language === 'ar';

    let arrowDirection = direction;
    if (isRTL) {
        // Reverse the arrows for RTL
        arrowDirection = direction === 'left' ? 'right' : 'left';
    }

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5 xl:w-6 xl:h-6",
        lg: "w-6 h-6 xl:w-8 xl:h-8"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded-lg transition-all disabled:opacity-50 ${className || ''}`}
            aria-label={
                direction === 'left'
                    ? (isRTL
                        ? t('calendar.datePicker.nextDay', 'Next day')
                        : t('calendar.datePicker.previousDay', 'Previous day'))
                    : (isRTL
                        ? t('calendar.datePicker.previousDay', 'Previous day')
                        : t('calendar.datePicker.nextDay', 'Next day'))
            }
        >
            {arrowDirection === 'left' ? (
                <ChevronLeft className={`${sizeClasses[size]} font-bold text-primary-700`} />
            ) : (
                <ChevronRight className={`${sizeClasses[size]} font-bold text-primary-700`} />
            )}
        </button>
    );
};
const DatePickerPopup = ({
                             show,
                             tempDate,
                             onDateChange,
                             onDateBlur,
                             onYesterday,
                             onTomorrow,
                             onClose
                         }) => {
    const { t } = useTranslation('calendar');

    if (!show) return null;

    return (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-[280px]">
            <div className="mb-3 flex justify-between items-center">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={onYesterday}
                        className="px-2 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {t('calendar.datePicker.yesterday', 'Yesterday')}
                    </button>
                    <button
                        onClick={onTomorrow}
                        className="px-2 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {t('calendar.datePicker.tomorrow', 'Tomorrow')}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                >
                    {t('calendar.datePicker.close', '✕')}
                </button>
            </div>
            <input
                type="date"
                value={DateFormatter.toInput(tempDate)}
                onChange={onDateChange}
                onBlur={onDateBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
        </div>
    );
};

const CalendarHeader = React.memo(({
                                       bookingCount,
                                       datePicker,
                                       venueFilter,
                                       isLoading,
                                       calendarCount = 0,
                                       walkinsCount = 0
                                   }) => {
    const { t, i18n } = useTranslation('calendar');

    return (
        <div className="bg-white grid grid-cols-2 gap-5 xl:grid-cols-3 justify-between items-center rounded-xl border border-gray-100 p-4 xl:px-6 mb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="hidden w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl lg:flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="xl:text-xl font-bold text-secondary-600 flex items-center gap-2">
                            <span className="xl:text-4xl text-xl">{bookingCount}</span>
                            {t('calendar.header.totalBookings', 'Total Bookings')}
                        </p>
                        <div className="text-xs text-gray-500 flex gap-2">
                            <span>{t('calendar.header.regular', { count: calendarCount }, `Regular: ${calendarCount}`)}</span>
                            <span>•</span>
                            <span>{t('calendar.header.walkIns', { count: walkinsCount }, `Walk-ins: ${walkinsCount}`)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex w-full order-3 col-span-2 xl:col-span-1 xl:order-2 items-center justify-center">
                <div className="flex w-full items-center justify-center gap-3">
                    <div className="flex items-center gap-1 rounded-xl p-1 relative" ref={datePicker.pickerRef}>
                        <DirectionalArrow
                            direction="left"
                            onClick={() => datePicker.changeDate(-1)}
                            disabled={isLoading}
                            size="lg"
                        />

                        <button
                            onClick={() => datePicker.setShowPicker(!datePicker.showPicker)}
                            className="text-lg font-semibold text-gray-900 min-w-[200px] text-center px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                            disabled={isLoading}
                        >
                            {DateFormatter.toDisplay(datePicker.selectedDate, i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                        </button>

                        <DatePickerPopup
                            show={datePicker.showPicker}
                            tempDate={datePicker.tempDate}
                            onDateChange={datePicker.handleDateChange}
                            onDateBlur={datePicker.handleDateBlur}
                            onYesterday={() => datePicker.changeDate(-1)}
                            onTomorrow={() => datePicker.changeDate(1)}
                            onClose={() => datePicker.setShowPicker(false)}
                        />

                        <button
                            onClick={datePicker.setToday}
                            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {t('calendar.header.today', 'Today')}
                        </button>

                        <DirectionalArrow
                            direction="right"
                            onClick={() => datePicker.changeDate(1)}
                            disabled={isLoading}
                            size="lg"
                        />
                    </div>                </div>
            </div>

            <div className="order-2 xl:order-3 flex justify-end">
                <CustomDropdown
                    options={venueFilter.venueOptions}
                    value={venueFilter.selectedVenue}
                    onChange={venueFilter.setSelectedVenue}
                    placeholder={t('calendar.header.selectVenue', 'Select Venue')}
                    disabled={isLoading}
                    buttonClassName="text-secondary-600 bg-gradient-to-br from-[#84FAA4] via-primary-500 to-[#2ACEF2]"
                />
            </div>
        </div>
    );
});

const BookingItem = React.memo(({ booking, calculator }) => {
    const { t } = useTranslation('calendar');
    const navigate = useNavigate();

    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const top = calculator.getTopPosition(startTime);
    const height = calculator.getHeight(startTime, endTime);

    const timeRange = DateFormatter.formatTimeRange(startTime, endTime);

    // Determine if it's a walk-in
    const isWalkIn = booking.is_walk_in || booking.booking_type === 'walk_in';

    // Determine which navigation path to use
    const navigateToDetails = () => {
        if (isWalkIn) {
            navigate('/bookings/walk-in-details', { state: { walkIn: booking } });
        } else {
            navigate('/bookings/book-details', { state: { booking: booking } });
        }
    };

    return (
        <div
            className={`absolute w-full bg-primary-50 rounded-xl border-[1px] p-2 px-3 ${StatusColorMapper.get(booking.status, booking.is_active)} cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${isWalkIn ? 'border-dashed border-blue-400 bg-blue-50' : ''}`}
            style={{
                top: `${top}%`,
                height: `${height}%`,
                minHeight: '70px'
            }}
            onClick={navigateToDetails}
        >
            <div className="text-sm flex justify-between font-bold mb-1.5 truncate">
                <span className="flex items-center gap-1">
                    {booking.user?.name || booking?.customer_name || t('calendar.bookingCard.unknownHost', 'Unknown Host')}
                    {isWalkIn && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {t('calendar.bookingCard.walkIn', 'Walk-in')}
                        </span>
                    )}
                </span>
                {booking.max_players && (
                    <div className="text-xs font-medium opacity-80 whitespace-nowrap">
                        {t('calendar.bookingCard.players', { count: booking.max_players }, `👥 ${booking.max_players} players`)}
                    </div>
                )}
            </div>
            <div className="text-xs flex justify-between items-center">
                <span
                    className="font-medium opacity-90 font-mono"
                    style={{
                        direction: 'ltr',
                        unicodeBidi: 'isolate'
                    }}
                >
                    {timeRange}
                </span>
                {booking.play_kind?.translations?.name && (
                    <div className="text-xs font-medium opacity-75 whitespace-nowrap">
                        {t('calendar.bookingCard.playKind', { kind: booking.play_kind.translations.name }, `⚽ ${booking.play_kind.translations.name}`)}
                    </div>
                )}
            </div>
        </div>
    );
});
const CalendarGrid = React.memo(({ groupedBookings, timeSlots }) => {
    const { t } = useTranslation('calendar');

    const venueCount = Object.keys(groupedBookings).length;
    const timeColumnWidth = '90px';
    const venueColumnWidth = venueCount <= 3
        ? `calc((100% - ${timeColumnWidth}) / ${venueCount})`
        : '250px';

    const calculator = new BookingPositionCalculator(timeSlots);
    const scrollContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        scrollContainerRef.current.style.cursor = 'grabbing';
        scrollContainerRef.current.style.userSelect = 'none';
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
            scrollContainerRef.current.style.userSelect = 'auto';
        }
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.style.cursor = 'grab';
                scrollContainerRef.current.style.userSelect = 'auto';
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div
                ref={scrollContainerRef}
                className="overflow-x-auto cursor-grab"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <div className="grid" style={{
                    gridTemplateColumns: `${timeColumnWidth} repeat(${venueCount}, ${venueColumnWidth})`,
                    minWidth: venueCount <= 2 ? '600px' : `calc(140px + ${venueCount} * 250px)`
                }}>
                    {/* Time Header */}
                    <div className="bg-gradient-to-br from-gray-100 text-secondary-600 border-r border-b border-gray-200 sticky left-0 z-20">
                        <div className="h-16 flex items-center justify-center">
                            <span className="text-sm text-center font-semibold text-gray-700">
                                {t('calendar.grid.time', 'Time')}
                            </span>
                        </div>
                    </div>

                    {Object.entries(groupedBookings).map(([pitchKey, groupData]) => {
                        const [venueName, pitchName] = pitchKey.split('||');

                        return (
                            <div key={pitchKey} className="border-r border-gray-200">
                                <div className="h-20 flex items-center justify-center px-3 border-b bg-primary-50">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <PitchImage
                                                imageUrl={groupData.pitchImage}
                                                pitchName={pitchName}
                                            />
                                        </div>
                                        <div className="flex flex-col items-center w-full px-1">
                                            <span className="text-xs font-semibold text-gray-900 truncate w-full">
                                                {venueName}
                                            </span>
                                            <span className="text-xs text-gray-600 truncate w-full mt-0.5">
                                                {pitchName}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Time Column */}
                    <div className="border-r border-b border-gray-200 bg-gradient-to-br from-gray-100 text-secondary-600 sticky left-0 z-10">
                        {timeSlots.map((time) => (
                            <div key={time.key} className="h-[70px] border-b border-gray-200 flex items-center justify-center pr-3 pt-2">
                                <span
                                    className="text-xs text-center font-medium text-secondary-600 py-1 rounded-md font-mono"
                                    style={{
                                        direction: 'ltr',
                                        unicodeBidi: 'isolate'
                                    }}
                                >
             {DateFormatter.forceLTR(time.display)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Booking Columns */}
                    {Object.entries(groupedBookings).map(([pitchKey, groupData]) => (
                        <div key={pitchKey} className="border-r border-gray-200 last:border-r-0 relative bg-gradient-to-br from-gray-50/30 to-white">
                            {timeSlots.map((time, index) => (
                                <div
                                    key={`${pitchKey}-${time.key}-${index}`}
                                    className={`h-[70px] border-b ${index % 2 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
                                />
                            ))}

                            {groupData.bookings.map((booking) => (
                                <BookingItem
                                    key={`${pitchKey}-${booking.id}`}
                                    booking={booking}
                                    calculator={calculator}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BookingCalendar = () => {
    const dispatch = useDispatch();
    const { t, i18n } = useTranslation(['calendar', 'common']);

    // Use a ref to track previous language
    const prevLanguageRef = useRef(i18n.language);

    const datePicker = useDatePicker(new Date());

    // Update date picker display when language changes
    useEffect(() => {
        if (prevLanguageRef.current !== i18n.language) {
            prevLanguageRef.current = i18n.language;
        }
    }, [i18n.language]);

    const apiFilters = useMemo(() => {
        const utcDate = DateFormatter.getUTCDateStart(datePicker.selectedDate);
        const dateString = DateFormatter.toAPI(utcDate);
        const filters = {
            start_time__date: dateString,
            no_pagination: true
        };
        return filters;
    }, [datePicker.selectedDate]);

    // Use the updated hook that combines both APIs
    const { bookings, isLoading, error, refetch } = useCalendarBookings(apiFilters);
    const bookingResults = bookings?.results || [];

    const venueFilter = useVenueFilter(bookingResults, datePicker.selectedDate, t);

    const filteredBookings = useMemo(() => {
        if (venueFilter.selectedVenue === 'all') return bookingResults;
        return bookingResults.filter(b => b.venue?.id === venueFilter.selectedVenue);
    }, [bookingResults, venueFilter.selectedVenue]);

    const timeSlots = useMemo(() =>
            TimeSlotGenerator.generate(filteredBookings),
        [filteredBookings]
    );

    const groupedBookings = useMemo(() =>
            BookingGrouper.byPitch(filteredBookings, t),
        [filteredBookings, t]
    );

    useEffect(() => {
        dispatch(setPageTitle(t('calendar.pageTitle', 'Calendar')));
    }, [dispatch, t]);

    if (error) {
        return <ErrorState error={error} onRetry={refetch} />;
    }

    return (
        <div className="min-h-screen shadow-sm bg-white rounded-lg lg:px-6 px-2 relative">
            {isLoading && <LoadingOverlay />}

            <div className={`xl:max-w-8xl xl:p-5 mx-auto ${isLoading ? 'opacity-50' : ''}`}>
                <CalendarHeader
                    bookingCount={filteredBookings.length}
                    datePicker={datePicker}
                    venueFilter={venueFilter}
                    isLoading={isLoading}
                    calendarCount={bookings?.calendar_count || 0}
                    walkinsCount={bookings?.walkins_count || 0}
                />

                {!isLoading && filteredBookings.length === 0 && <EmptyState />}

                {filteredBookings.length > 0 && Object.keys(groupedBookings).length > 0 && (
                    <CalendarGrid
                        groupedBookings={groupedBookings}
                        timeSlots={timeSlots}
                    />
                )}
            </div>
        </div>
    );
};
export default BookingCalendar;