import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getBookings } from '../features/bookings/bookingSlice.js';

export const useBookings = (filters = {}) => {
    const dispatch = useDispatch();
    const { items, status, error } = useSelector((state) => state.bookings);

    useEffect(() => {
        dispatch(getBookings(filters));
    }, [dispatch, JSON.stringify(filters)]);

    return {
        bookings: items,
        isLoading: status === 'loading',
        error,
    };
};