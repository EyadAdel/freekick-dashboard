// features/bookings/bookingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from '../../services/bookings/bookingService.js';

export const getBookings = createAsyncThunk(
    'bookings/getAll',
    async (filters) => {
        const response = await bookingService.getAll(filters);
        // Extract data from API response wrapper
        // API returns: { status: true, data: [...], code: 200 }
        return response.data || response;
    }
);

export const getBookingById = createAsyncThunk(
    'bookings/getById',
    async (id) => {
        const response = await bookingService.getById(id);
        // Extract data from API response wrapper
        return response.data || response;
    }
);

export const cancelBooking = createAsyncThunk(
    'bookings/cancel',
    async (id, { rejectWithValue }) => {
        try {
            const response = await bookingService.cancelBooking(id);
            return { id, data: response.data || response };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                'Failed to cancel booking'
            );
        }
    }
);

const bookingSlice = createSlice({
    name: 'bookings',
    initialState: {
        items: [],
        selectedBooking: null,
        status: 'idle',
        error: null,
        cancelStatus: 'idle',
        cancelError: null,
    },
    reducers: {
        clearSelectedBooking: (state) => {
            state.selectedBooking = null;
        },
        setSelectedBooking: (state, action) => {
            state.selectedBooking = action.payload;
        },
        clearCancelStatus: (state) => {
            state.cancelStatus = 'idle';
            state.cancelError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Get all bookings
            .addCase(getBookings.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(getBookings.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(getBookings.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            // Get booking by ID
            .addCase(getBookingById.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(getBookingById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.selectedBooking = action.payload;
            })
            .addCase(getBookingById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            // Cancel booking
            .addCase(cancelBooking.pending, (state) => {
                state.cancelStatus = 'loading';
                state.cancelError = null;
            })
            .addCase(cancelBooking.fulfilled, (state, action) => {
                state.cancelStatus = 'succeeded';

                // Update the booking in items array
                const index = state.items.findIndex(
                    booking => booking.id === action.payload.id
                );
                if (index !== -1) {
                    state.items[index] = {
                        ...state.items[index],
                        status: 'cancelled'
                    };
                }

                // Update selected booking if it's the cancelled one
                if (state.selectedBooking?.id === action.payload.id) {
                    state.selectedBooking = {
                        ...state.selectedBooking,
                        status: 'cancelled'
                    };
                }
            })
            .addCase(cancelBooking.rejected, (state, action) => {
                state.cancelStatus = 'failed';
                state.cancelError = action.payload;
            });
    },
});

export const {
    clearSelectedBooking,
    setSelectedBooking,
    clearCancelStatus
} = bookingSlice.actions;

export default bookingSlice.reducer;