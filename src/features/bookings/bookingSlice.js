// features/bookings/bookingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from '../../services/bookings/bookingService.js';

// Async thunks - these CALL the services
export const fetchBookings = createAsyncThunk(
    'bookings/fetchAll',
    async (filters, { rejectWithValue }) => {
        try {
            const data = await bookingService.getAll(filters);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const createBooking = createAsyncThunk(
    'bookings/create',
    async (bookingData, { rejectWithValue }) => {
        try {
            const data = await bookingService.create(bookingData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Slice - manages the state
const bookingsSlice = createSlice({
    name: 'bookings',
    initialState: {
        items: [],
        selectedBooking: null,
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
        filters: {
            status: 'all',
            dateRange: null
        }
    },
    reducers: {
        // Synchronous actions
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        selectBooking: (state, action) => {
            state.selectedBooking = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Handle async actions
        builder
            .addCase(fetchBookings.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchBookings.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchBookings.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(createBooking.fulfilled, (state, action) => {
                state.items.push(action.payload);
            });
    }
});

export const { setFilters, selectBooking, clearError } = bookingsSlice.actions;

// Selectors
export const selectAllBookings = (state) => state.bookings.items;
export const selectBookingStatus = (state) => state.bookings.status;
export const selectActiveBookings = (state) =>
    state.bookings.items.filter(b => b.status === 'active');

export default bookingsSlice.reducer;