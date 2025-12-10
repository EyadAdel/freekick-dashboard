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
export const useCalendarBookings = (filters = {}, options = {}) => {
    const [bookings, setBookings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const {
        autoFetch = true,
        onSuccess,
        onError
    } = options;

    const fetchCalendarBookings = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined && value !== '' && value !== 'all') {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await bookingService.getCalendarBookings(cleanFilters);

            // Extract data from API response wrapper
            const data = response.data || response;
            setBookings(data);

            if (onSuccess) {
                onSuccess(data);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch calendar bookings';
            setError(errorMessage);

            if (onError) {
                onError(errorMessage);
            }

            console.error('Error fetching calendar bookings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (autoFetch) {
            fetchCalendarBookings();
        }
    }, [JSON.stringify(filters)]);

    return {
        bookings,
        isLoading,
        error,
        refetch: fetchCalendarBookings
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