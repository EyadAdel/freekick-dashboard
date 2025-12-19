// hooks/useBookings.js
import { useState, useEffect } from 'react';
import { bookingService } from '../services/bookings/bookingService';

/**
 * Custom hook to fetch and manage bookings
 *
 * @param {Object} filters - Filter parameters for the API
 * @param {Object} options - Additional options
 * @returns {Object} - { bookings, isLoading, error, refetch }
 */
export const useBookings = (filters = {}, options = {}) => {
    const [bookings, setBookings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const {
        autoFetch = true,
        onSuccess,
        onError
    } = options;

    const fetchBookings = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined && value !== '' && value !== 'all') {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await bookingService.getAll(cleanFilters);

            // Extract data from API response wrapper
            const data = response.data || response;
            setBookings(data);

            if (onSuccess) {
                onSuccess(data);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch bookings';
            setError(errorMessage);

            if (onError) {
                onError(errorMessage);
            }

            console.error('Error fetching bookings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (autoFetch) {
            fetchBookings();
        }
    }, [JSON.stringify(filters)]);

    return {
        bookings,
        isLoading,
        error,
        refetch: fetchBookings
    };
};

/**
 * Custom hook specifically for calendar view bookings
 * Uses the /booking/book/calender/ endpoint
 *
 * @param {Object} filters - Filter parameters for the API
 * @param {Object} options - Additional options
 * @returns {Object} - { bookings, isLoading, error, refetch }
 */
// Updated useCalendarBookings hook - correct version
export const useCalendarBookings = (filters = {}, options = {}) => {
    const [combinedBookings, setCombinedBookings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const {
        autoFetch = true,
        onSuccess,
        onError
    } = options;

    // Function to normalize booking data
    const normalizeBooking = (booking, isWalkIn = false) => {
        return {
            ...booking,
            is_walk_in: isWalkIn,
            // Ensure consistent field names
            start_time: booking.start_time || booking.start_time__date || booking.date,
            end_time: booking.end_time || booking.end_time__date,
            user: booking.user || booking.customer,
            unique_id: `${isWalkIn ? 'walkin' : 'booking'}_${booking.id}`
        };
    };

    const fetchCombinedBookings = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Clean filters for both APIs
            const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined && value !== '' && value !== 'all') {
                    acc[key] = value;
                }
                return acc;
            }, {});

            console.log('Fetching with filters:', cleanFilters);

            // Fetch both APIs in parallel with the SAME filters
            const [calendarResponse, walkInsResponse] = await Promise.all([
                bookingService.getCalendarBookings(cleanFilters),
                bookingService.getWalkIns({
                    ...cleanFilters,
                    no_pagination: true  // Ensure we get all walk-ins for the date
                })
            ]);

            // Extract data from responses
            const calendarData = calendarResponse.data || calendarResponse || [];
            const walkInsData = walkInsResponse.data || walkInsResponse || [];

            console.log('Calendar data received:', calendarData);
            console.log('Walk-ins data received:', walkInsData);

            // Normalize and combine the data
            const normalizedCalendar = Array.isArray(calendarData)
                ? calendarData.map(booking => normalizeBooking(booking, false))
                : (calendarData.results || []).map(booking => normalizeBooking(booking, false));

            const normalizedWalkIns = Array.isArray(walkInsData)
                ? walkInsData.map(walkIn => normalizeBooking(walkIn, true))
                : (walkInsData.results || []).map(walkIn => normalizeBooking(walkIn, true));

            console.log('Normalized calendar:', normalizedCalendar.length);
            console.log('Normalized walk-ins:', normalizedWalkIns.length);

            // Combine all bookings
            const allBookings = [...normalizedCalendar, ...normalizedWalkIns];

            // Calculate counts
            const response = {
                results: allBookings,
                count: allBookings.length,
                calendar_count: normalizedCalendar.length,
                walkins_count: normalizedWalkIns.length
            };

            setCombinedBookings(response);

            if (onSuccess) {
                onSuccess(response);
            }
        } catch (err) {
            console.error('Error fetching combined bookings:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch bookings';
            setError(errorMessage);

            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (autoFetch) {
            fetchCombinedBookings();
        }
    }, [JSON.stringify(filters)]);

    return {
        bookings: combinedBookings,
        isLoading,
        error,
        refetch: fetchCombinedBookings
    };
};
/**
 * Hook to fetch a single booking by ID
 */
export const useBooking = (id, options = {}) => {
    const [booking, setBooking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { autoFetch = true } = options;

    const fetchBooking = async () => {
        if (!id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await bookingService.getById(id);

            // Extract the actual booking data from the API response wrapper
            // API returns: { status: true, data: { id: 37, ... }, code: 200 }
            const bookingData = response.data || response;

            console.log('useBooking - API Response:', response);
            console.log('useBooking - Extracted Data:', bookingData);

            setBooking(bookingData);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch booking';
            setError(errorMessage);
            console.error('Error fetching booking:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (autoFetch && id) {
            fetchBooking();
        }
    }, [id, autoFetch]);

    return {
        booking,
        isLoading,
        error,
        refetch: fetchBooking
    };
};