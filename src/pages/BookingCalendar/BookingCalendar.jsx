import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarBookings } from '../../hooks/useBookings.js';
import CustomDropdown from '../../components/common/CustomDropdown.jsx';
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import {venuesService} from "../../services/venues/venuesService.js";

// ============================================================================
// UTILITY CLASSES
// ============================================================================

class DateFormatter {
    static toAPI(date) {
        return date.toISOString().split('T')[0];
    }

    static toDisplay(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    static toInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static toAMPM(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
}

class TimeSlotGenerator {
    static DEFAULT_START = 8;
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
            const startHour = new Date(booking.start_time).getHours();
            const endHour = new Date(booking.end_time).getHours();

            earliest = Math.min(earliest, Math.max(this.DEFAULT_START, startHour));
            latest = Math.max(latest, Math.min(23, endHour + 1));
        });

        return {
            start: Math.min(earliest, this.DEFAULT_START),
            end: Math.max(latest, this.DEFAULT_END)
        };
    }

    static #createSlots(start, end) {
        const slots = [];
        for (let hour = start; hour <= end; hour++) {
            const displayHour = hour % 12 || 12;
            const period = hour >= 12 ? 'PM' : 'AM';
            slots.push({
                hour24: hour,
                hour12: displayHour,
                period,
                display: `${displayHour}:00 ${period}`
            });
        }
        return slots;
    }
}

class BookingGrouper {
    static byPitch(bookings) {
        const groups = {};

        bookings.forEach(booking => {
            const key = this.#generateKey(booking);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(booking);
        });

        return groups;
    }

    static #generateKey(booking) {
        const pitchName = booking.pitch?.translations?.name || 'Unknown Pitch';
        const venueId = booking.pitch?.venue || 'Unknown';
        return `Venue ${venueId} - ${pitchName}`;
    }
}

class BookingPositionCalculator {
    constructor(timeSlots) {
        this.timeSlots = timeSlots;
        this.firstHour = timeSlots[0]?.hour24 || 9;
        this.totalSlots = timeSlots.length;
    }

    getTopPosition(dateTime) {
        const date = new Date(dateTime);
        const hours = date.getHours();
        const minutes = date.getMinutes();

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
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [tempDate, setTempDate] = useState(initialDate);
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);
    const inputRef = useRef(null);

    const changeDate = (days) => {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
        setShowPicker(false);
    };

    const setToday = () => {
        setSelectedDate(new Date());
        setShowPicker(false);
    };

    const handleDateChange = (event) => {
        setTempDate(new Date(event.target.value));
    };

    const handleDateBlur = () => {
        setSelectedDate(tempDate);
        setTimeout(() => setShowPicker(false), 0);
    };

    // Sync temp date when picker opens
    useEffect(() => {
        if (showPicker) {
            setTempDate(selectedDate);
        }
    }, [showPicker, selectedDate]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current &&
                !pickerRef.current.contains(event.target) &&
                inputRef.current !== event.target) {
                if (tempDate && DateFormatter.toInput(tempDate) !== DateFormatter.toInput(selectedDate)) {
                    setSelectedDate(tempDate);
                }
                setShowPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [tempDate, selectedDate]);

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
        handleDateBlur
    };
};

const useVenueFilter = (bookings) => {
    const [selectedVenue, setSelectedVenue] = useState('all');

    const venues = useMemo(() => {
        if (!bookings?.length) return ['all'];
        const venueIds = new Set(bookings.map(b => b.pitch?.venue).filter(Boolean));
        return ['all', ...Array.from(venueIds)];
    }, [bookings]);

    const venueOptions = useMemo(() => {
        return venues.map(venue => ({
            value: venue,
            label: venue === 'all' ? 'All Venues' : `Venue ${venue}`
        }));
    }, [venues]);

    return { selectedVenue, setSelectedVenue, venueOptions };
};

// ============================================================================
// COMPONENTS
// ============================================================================

const LoadingOverlay = () => (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg">
        <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="text-sm text-gray-600">Loading booking...</span>
        </div>
    </div>
);

const ErrorState = ({ error, onRetry }) => (
    <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">Error loading bookings: {error}</p>
                <button
                    onClick={onRetry}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-500">There are no bookings for the selected date.</p>
    </div>
);

const DatePickerPopup = ({
                             show,
                             tempDate,
                             onDateChange,
                             onDateBlur,
                             onYesterday,
                             onTomorrow,
                             onClose
                         }) => {
    if (!show) return null;

    return (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-[280px]">
            <div className="mb-3 flex justify-end items-center">
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={onYesterday}
                        className="px-2 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Yesterday
                    </button>
                    <button
                        onClick={onTomorrow}
                        className="px-2 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Tomorrow
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    ✕
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

const CalendarHeader = ({
                            bookingCount,
                            datePicker,
                            venueFilter,
                            isLoading
                        }) => (
    <div className="bg-white grid grid-cols-2 gap-5 xl:grid-cols-3 justify-between items-center rounded-xl border border-gray-100 p-4 xl:px-6 mb-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="hidden w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl lg:flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className="xl:text-xl font-bold text-secondary-600 flex items-center gap-2">
                        <span className="xl:text-4xl text-xl">{bookingCount}</span>
                        Total Bookings
                    </p>
                </div>
            </div>
        </div>

        <div className="flex w-full order-3 col-span-2 xl:col-span-1 xl:order-2 items-center justify-center">
            <div className="flex w-full items-center justify-center gap-3">
                <div className="flex items-center gap-1 rounded-xl p-1 relative" ref={datePicker.pickerRef}>
                    <button
                        onClick={() => datePicker.changeDate(-1)}
                        className="p-2 rounded-lg transition-all disabled:opacity-50"
                        disabled={isLoading}
                    >
                        <ChevronLeft className="w-5 h-5 xl:w-8 xl:h-8 font-bold text-primary-700" />
                    </button>

                    <button
                        onClick={() => datePicker.setShowPicker(!datePicker.showPicker)}
                        className="text-lg font-semibold text-gray-900 min-w-[200px] text-center px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                        disabled={isLoading}
                    >
                        {DateFormatter.toDisplay(datePicker.selectedDate)}
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
                        Today
                    </button>

                    <button
                        onClick={() => datePicker.changeDate(1)}
                        className="p-2 rounded-lg transition-all disabled:opacity-50"
                        disabled={isLoading}
                    >
                        <ChevronRight className="w-5 h-5 xl:w-8 xl:h-8 font-bold text-primary-700" />
                    </button>
                </div>
            </div>
        </div>

        <div className="order-2 xl:order-3 flex justify-end">
            <CustomDropdown
                options={venueFilter.venueOptions}
                value={venueFilter.selectedVenue}
                onChange={venueFilter.setSelectedVenue}
                placeholder="Select Venue"
                disabled={isLoading}
                buttonClassName="text-secondary-600 bg-gradient-to-br from-[#84FAA4] via-primary-500 to-[#2ACEF2]"
            />
        </div>
    </div>
);

const BookingItem = ({ booking, calculator }) => {
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const top = calculator.getTopPosition(startTime);
    const height = calculator.getHeight(startTime, endTime);

    return (
        <div
            className={`absolute w-full bg-primary-50 rounded-xl border-[1px] p-2 px-3 ${StatusColorMapper.get(booking.status, booking.is_active)} cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}
            style={{
                top: `${top}%`,
                height: `${height}%`,
                minHeight: '70px'
            }}
            onClick={() => console.log('Booking clicked:', booking)}
        >
            <div className="text-sm flex justify-between font-bold mb-1.5 truncate">
                {booking.user_info?.name || 'Unknown Host'}
                {booking.max_players && (
                    <div className="text-xs font-medium opacity-80">
                        👥 {booking.max_players} players
                    </div>
                )}
            </div>
            <div className="text-xs flex justify-between font-medium opacity-90 mb-1">
                {DateFormatter.toAMPM(startTime)} - {DateFormatter.toAMPM(endTime)}
                {booking.play_kind?.translations?.name && (
                    <div className="text-xs mt-1 font-medium opacity-75">
                        ⚽ {booking.play_kind.translations.name}
                    </div>
                )}
            </div>
        </div>
    );
};

const CalendarGrid = ({ groupedBookings, timeSlots }) => {
    const venueCount = Object.keys(groupedBookings).length;
    const timeColumnWidth = '90px';
    const venueColumnWidth = venueCount <= 2
        ? `calc((100% - ${timeColumnWidth}) / ${venueCount})`
        : '500px';

    const calculator = new BookingPositionCalculator(timeSlots);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <div className="grid" style={{
                    gridTemplateColumns: `${timeColumnWidth} repeat(${venueCount}, ${venueColumnWidth})`,
                    minWidth: venueCount <= 2 ? '600px' : `calc(140px + ${venueCount} * 250px)`
                }}>
                    {/* Time Header */}
                    <div className="bg-gradient-to-br from-gray-100 text-secondary-600 border-r border-b border-gray-200 sticky left-0 z-20">
                        <div className="h-16 flex items-center justify-center">
                            <span className="text-sm text-center font-semibold text-gray-700">
                                Time
                            </span>
                        </div>
                    </div>

                    {/* Venues Headers */}
                    {Object.keys(groupedBookings).map((pitchKey) => (
                        <div key={pitchKey} className="border-r border-gray-200">
                            <div className="h-16 flex items-center justify-center px-4 border-b bg-primary-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                        <span className="text-sm font-bold text-white">
                                            {pitchKey.charAt(pitchKey.length - 1)}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 truncate">
                                        {pitchKey}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Time Column */}
                    <div className="border-r border-b border-gray-200 bg-gradient-to-br from-gray-100 text-secondary-600 sticky left-0 z-10">
                        {timeSlots.map((time) => (
                            <div key={time.display} className="h-[70px] border-b border-gray-200 flex items-center justify-center pr-3 pt-2">
                                <span className="text-xs text-center font-medium text-secondary-600 py-1 rounded-md">
                                    {time.display}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Booking Columns */}
                    {Object.entries(groupedBookings).map(([pitchKey, pitchBookings]) => (
                        <div key={pitchKey} className="border-r border-gray-200 last:border-r-0 relative bg-gradient-to-br from-gray-50/30 to-white">
                            {timeSlots.map((time, index) => (
                                <div
                                    key={time.display}
                                    className={`h-[70px] border-b ${index % 2 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
                                />
                            ))}

                            {pitchBookings.map((booking) => (
                                <BookingItem
                                    key={booking.id}
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
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BookingCalendar = () => {
    const dispatch = useDispatch();
    const datePicker = useDatePicker(new Date());

    const apiFilters = useMemo(() => {
        const filters = {
            start_time__date: DateFormatter.toAPI(datePicker.selectedDate),
        };
        return filters;
    }, [datePicker.selectedDate]);

    // Use the new useCalendarBookings hook instead of useBookings
    const { bookings, isLoading, error, refetch } = useCalendarBookings(apiFilters);
    const bookingResults = bookings?.results || [];
    const [currentPage, setCurrentPage] = useState(1);
    const [venuesData, setVenuesData] = useState([]);
    const venueFilter = useVenueFilter(venuesData);

    const filteredBookings = useMemo(() => {
        if (venueFilter.selectedVenue === 'all') return bookingResults;
        return bookingResults.filter(b => b.pitch?.venue === venueFilter.selectedVenue);
    }, [bookingResults, venueFilter.selectedVenue]);

    const timeSlots = useMemo(() =>
            TimeSlotGenerator.generate(filteredBookings),
        [filteredBookings]
    );

    const groupedBookings = useMemo(() =>
            BookingGrouper.byPitch(filteredBookings),
        [filteredBookings]
    );


    const fetchVenuesData = async () => {
        try {

            // Fetch main data
            const response = await venuesService.getAllVenues({ page: currentPage });
            if (response && response.results) {
                setVenuesData(response.results);
            }
        } catch (error) {
            console.error("Failed to fetch venues:", error);
        }
    };
    useEffect(() => {
        dispatch(setPageTitle('Calendar'));
    }, [dispatch]);
    useEffect(() => {
        fetchVenuesData()
    }, []);
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