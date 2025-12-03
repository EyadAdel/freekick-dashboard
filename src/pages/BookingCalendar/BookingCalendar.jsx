import React, {useState, useMemo, useEffect} from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import CustomDropdown from '../../components/common/CustomDropdown.jsx';
import {useDispatch} from "react-redux";
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";

const BookingCalendar = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedVenue, setSelectedVenue] = useState('all');
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Calendar'));
    }, [dispatch]);

    const formatDateForAPI = (date) => {
        return date.toISOString().split('T')[0];
    };

    const apiFilters = useMemo(() => {
        const filters = {
            start_time__date: formatDateForAPI(selectedDate),
        };

        if (selectedVenue !== 'all') {
            filters.venue = selectedVenue;
        }

        return filters;
    }, [selectedDate, selectedVenue]);

    const { bookings, isLoading, error, refetch } = useBookings(apiFilters);

    const bookingResults = bookings?.results || [];

    const timeSlots = useMemo(() => {
        if (!bookingResults || bookingResults.length === 0) {
            const slots = [];
            for (let hour = 8; hour <= 24; hour++) {
                const displayHour = hour % 12 || 12;
                const period = hour >= 12 ? 'PM' : 'AM';
                slots.push({
                    hour24: hour,
                    hour12: displayHour,
                    period: period,
                    display: `${displayHour}:00 ${period}`
                });
            }
            return slots;
        }

        let earliestHour = 24;
        let latestHour = 0;

        bookingResults.forEach(booking => {
            const startTime = new Date(booking.start_time);
            const endTime = new Date(booking.end_time);

            const startHour = startTime.getHours();
            const endHour = endTime.getHours();

            if (startHour < earliestHour) earliestHour = Math.max(8, startHour);
            if (endHour > latestHour) latestHour = Math.min(23, endHour + 1);
        });

        earliestHour = Math.min(earliestHour, 8);
        latestHour = Math.max(latestHour, 24);

        const slots = [];
        for (let hour = earliestHour; hour <= latestHour; hour++) {
            const displayHour = hour % 12 || 12;
            const period = hour >= 12 ? 'PM' : 'AM';
            slots.push({
                hour24: hour,
                hour12: displayHour,
                period: period,
                display: `${displayHour}:00 ${period}`
            });
        }
        return slots;
    }, [bookingResults]);

    const formatTimeToAMPM = (dateTime) => {
        const date = new Date(dateTime);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const venues = useMemo(() => {
        if (!bookingResults || bookingResults.length === 0) return ['all'];
        const venueIds = new Set(bookingResults.map(b => b.pitch?.venue).filter(Boolean));
        return ['all', ...Array.from(venueIds)];
    }, [bookingResults]);

    // Convert venues to dropdown options format
    const venueOptions = useMemo(() => {
        return venues.map(venue => ({
            value: venue,
            label: venue === 'all' ? 'All Venues' : `Venue ${venue}`
        }));
    }, [venues]);

    const groupedBookings = useMemo(() => {
        if (!bookingResults || bookingResults.length === 0) return {};

        const groups = {};
        bookingResults.forEach(booking => {
            const pitchName = booking.pitch?.translations?.name || 'Unknown Pitch';
            const venueId = booking.pitch?.venue || 'Unknown';
            const key = `Venue ${venueId} - ${pitchName}`;

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(booking);
        });
        return groups;
    }, [bookingResults]);

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTimePosition = (dateTime) => {
        const date = new Date(dateTime);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const firstHour = timeSlots[0]?.hour24 || 9;
        const slotIndex = hours - firstHour;
        const positionWithinSlot = minutes / 60;
        const totalPosition = slotIndex + positionWithinSlot;
        return (totalPosition / timeSlots.length) * 100;
    };

    const getBookingHeight = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMinutes = (end - start) / (1000 * 60);
        const durationInSlots = durationMinutes / 60;
        return (durationInSlots / timeSlots.length) * 100;
    };

    const getStatusColor = (status, isActive) => {
        if (!isActive) return 'bg-red-50 border-red-300 text-red-700';
        if (status === 'pending') return 'bg-amber-50 border-amber-200 text-amber-800';
        if (status === 'cancelled') return 'bg-gray-50 border-gray-300 text-gray-700';
        if (status === 'completed') return 'bg-emerald-50 border-emerald-300 text-emerald-700';
        return 'bg-primary-50 border-primary-300 text-primary-700';
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700">Error loading bookings: {error}</p>
                        <button
                            onClick={refetch}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen shadow-sm bg-white rounded-lg lg:px-6 px-2 relative">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <span className="text-sm text-gray-600">Loading booking...</span>
                    </div>
                </div>
            )}

            <div className={`xl:max-w-8xl xl:p-5 mx-auto ${isLoading ? 'opacity-50' : ''}`}>
                <div className="bg-white grid grid-cols-2 gap-5 xl:grid-cols-3 justify-between items-center rounded-xl  border border-gray-100 p-4 xl:px-6 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className=" hidden w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl lg:flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="xl:text-xl font-bold text-secondary-600 flex items-center gap-2">
                                    <span className="xl:text-5xl text-xl ">{bookingResults.length}</span>
                                    Total Bookings
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full order-3 col-span-2 xl:col-span-1 xl:order-2 items-center justify-center">
                        <div className="flex w-full items-center justify-center  gap-3">
                            <div className="flex items-center gap-1  rounded-xl p-1">
                                <button
                                    onClick={() => changeDate(-1)}
                                    className="p-2  rounded-lg transition-all  disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    <ChevronLeft className="w-5 h-5 xl:w-8 xl:h-8  font-bold text-primary-700" />
                                </button>
                                <span className="text-lg font-semibold text-gray-900 min-w-[200px]">
                                {formatDate(selectedDate)}
                            </span>
                                <button
                                    onClick={() => setSelectedDate(new Date())}
                                    className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => changeDate(1)}
                                    className="p-2  rounded-lg transition-all  disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    <ChevronRight className="w-5 h-5 xl:w-8 xl:h-8  font-bold text-primary-700" />
                                </button>
                            </div>

                        </div>
                    </div>
                    <div className={'order-2 xl:order-3  flex justify-end'}>
                    <CustomDropdown
                        options={venueOptions}
                        value={selectedVenue}
                        onChange={setSelectedVenue}
                        placeholder="Select Venue"
                        disabled={isLoading}
                        buttonClassName="text-secondary-600 bg-gradient-to-br from-[#84FAA4] via-primary-500 to-[#2ACEF2]"
                    />
                    </div>
                </div>

                {!isLoading && bookingResults.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                        <p className="text-gray-500">There are no bookings for the selected date.</p>
                    </div>
                )}

                {bookingResults.length > 0 && Object.keys(groupedBookings).length > 0 && (() => {
                    const venueCount = Object.keys(groupedBookings).length;
                    const timeColumnWidth = '90px';
                    const venueColumnWidth = venueCount <= 2 ? `calc((100% - ${timeColumnWidth}) / ${venueCount})` : '500px';

                    return (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <div className="grid" style={{
                                    gridTemplateColumns: `${timeColumnWidth} repeat(${venueCount}, ${venueColumnWidth})`,
                                    minWidth: venueCount <= 2 ? '600px' : `calc(140px + ${venueCount} * 250px)`
                                }}>
                                    {/* Header Row */}
                                    <div className="bg-gradient-to-br from-gray-100  text-secondart-600 border-r border-b border-gray-200 sticky left-0 z-20">
                                        <div className="h-16 flex items-center justify-center">
                                            <span className="text-sm text-center font-semibold text-gray-700">
                                                {/*{timeSlots[0]?.display}  {timeSlots[timeSlots.length - 1]?.display}*/}
                                                Time
                                            </span>
                                        </div>
                                    </div>

                                    {/* Venue Headers */}
                                    {Object.keys(groupedBookings).map((pitchKey) => (
                                        <div key={pitchKey} className="border-r border-gray-200">
                                            <div className="h-16 flex items-center justify-center px-4 border-b  bg-primary-50 ">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-white">
                                                            {pitchKey.charAt(pitchKey.length - 1)}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900 truncate">{pitchKey}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Time Column (Sticky) */}
                                    <div className="border-r   border-b border-gray-200 bg-gradient-to-br from-gray-100  text-secondart-600   sticky left-0 z-10">
                                        {timeSlots.map((time) => (
                                            <div key={time.display} className="h-[70px] border-b border-gray-200 flex items-center justify-center pr-3 pt-2">
                                                <span className="text-xs text-center font-medium text-secondary-600   py-1 rounded-md ">
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

                                            {/* Booking Items */}
                                            {pitchBookings.map((booking) => {
                                                const startTime = new Date(booking.start_time);
                                                const endTime = new Date(booking.end_time);
                                                const top = getTimePosition(startTime);
                                                const height = getBookingHeight(startTime, endTime);

                                                return (
                                                    <div
                                                        key={booking.id}
                                                        className={`absolute w-full  bg-primary-50  rounded-xl border-[1px] p-2 px-3 ${getStatusColor(booking.status, booking.is_active)} cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}
                                                        style={{
                                                            top: `${top}%`,
                                                            height: `${height}%`,
                                                            minHeight: '70px'
                                                        }}
                                                        onClick={() => {
                                                            console.log('Booking clicked:', booking);
                                                        }}
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
                                                            {formatTimeToAMPM(startTime)} - {formatTimeToAMPM(endTime)}
                                                            {booking.play_kind?.translations?.name && (
                                                                <div className="text-xs mt-1 font-medium opacity-75">
                                                                    ⚽ {booking.play_kind.translations.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default BookingCalendar;