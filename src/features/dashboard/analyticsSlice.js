import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyticsService from '../../services/analyticsService';

// Async thunks
export const fetchCardAnalytics = createAsyncThunk(
    'analytics/fetchCardAnalytics',
    async (_, { rejectWithValue }) => {
        try {
            return await analyticsService.getCardAnalytics();
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchRevenueTrend = createAsyncThunk(
    'analytics/fetchRevenueTrend',
    async (params, { rejectWithValue }) => {
        try {
            return await analyticsService.getRevenueTrend(params);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchTopPartners = createAsyncThunk(
    'analytics/fetchTopPartners',
    async (limit = 10, { rejectWithValue }) => {
        try {
            return await analyticsService.getTopPartners(limit);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchWeeklyBookingAnalytics = createAsyncThunk(
    'analytics/fetchWeeklyBookingAnalytics',
    async (params, { rejectWithValue }) => {
        try {
            return await analyticsService.getWeeklyBookingAnalytics(params);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchAllAnalytics = createAsyncThunk(
    'analytics/fetchAllAnalytics',
    async (_, { rejectWithValue }) => {
        try {
            return await analyticsService.getAllAnalytics();
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    cardAnalytics: null,
    revenueTrend: null,
    topPartners: null,
    weeklyBookings: null,
    loading: {
        cardAnalytics: false,
        revenueTrend: false,
        topPartners: false,
        weeklyBookings: false,
        all: false,
    },
    error: {
        cardAnalytics: null,
        revenueTrend: null,
        topPartners: null,
        weeklyBookings: null,
        all: null,
    },
};

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        clearAnalyticsError: (state, action) => {
            const { errorType } = action.payload;
            if (errorType && state.error[errorType]) {
                state.error[errorType] = null;
            } else {
                // Clear all errors
                Object.keys(state.error).forEach(key => {
                    state.error[key] = null;
                });
            }
        },
        resetAnalyticsData: (state) => {
            state.cardAnalytics = null;
            state.revenueTrend = null;
            state.topPartners = null;
            state.weeklyBookings = null;
            Object.keys(state.error).forEach(key => {
                state.error[key] = null;
            });
        },
    },
    extraReducers: (builder) => {
        // Card Analytics
        builder
            .addCase(fetchCardAnalytics.pending, (state) => {
                state.loading.cardAnalytics = true;
                state.error.cardAnalytics = null;
            })
            .addCase(fetchCardAnalytics.fulfilled, (state, action) => {
                state.loading.cardAnalytics = false;
                state.cardAnalytics = action.payload;
            })
            .addCase(fetchCardAnalytics.rejected, (state, action) => {
                state.loading.cardAnalytics = false;
                state.error.cardAnalytics = action.payload;
            });

        // Revenue Trend
        builder
            .addCase(fetchRevenueTrend.pending, (state) => {
                state.loading.revenueTrend = true;
                state.error.revenueTrend = null;
            })
            .addCase(fetchRevenueTrend.fulfilled, (state, action) => {
                state.loading.revenueTrend = false;
                state.revenueTrend = action.payload;
            })
            .addCase(fetchRevenueTrend.rejected, (state, action) => {
                state.loading.revenueTrend = false;
                state.error.revenueTrend = action.payload;
            });

        // Top Partners
        builder
            .addCase(fetchTopPartners.pending, (state) => {
                state.loading.topPartners = true;
                state.error.topPartners = null;
            })
            .addCase(fetchTopPartners.fulfilled, (state, action) => {
                state.loading.topPartners = false;
                state.topPartners = action.payload;
            })
            .addCase(fetchTopPartners.rejected, (state, action) => {
                state.loading.topPartners = false;
                state.error.topPartners = action.payload;
            });

        // Weekly Booking Analytics
        builder
            .addCase(fetchWeeklyBookingAnalytics.pending, (state) => {
                state.loading.weeklyBookings = true;
                state.error.weeklyBookings = null;
            })
            .addCase(fetchWeeklyBookingAnalytics.fulfilled, (state, action) => {
                state.loading.weeklyBookings = false;
                state.weeklyBookings = action.payload;
            })
            .addCase(fetchWeeklyBookingAnalytics.rejected, (state, action) => {
                state.loading.weeklyBookings = false;
                state.error.weeklyBookings = action.payload;
            });

        // All Analytics
        builder
            .addCase(fetchAllAnalytics.pending, (state) => {
                state.loading.all = true;
                state.error.all = null;
            })
            .addCase(fetchAllAnalytics.fulfilled, (state, action) => {
                state.loading.all = false;
                state.cardAnalytics = action.payload.cardAnalytics;
                state.revenueTrend = action.payload.revenueTrend;
                state.topPartners = action.payload.topPartners;
                state.weeklyBookings = action.payload.weeklyBookings;
            })
            .addCase(fetchAllAnalytics.rejected, (state, action) => {
                state.loading.all = false;
                state.error.all = action.payload;
            });
    },
});

export const { clearAnalyticsError, resetAnalyticsData } = analyticsSlice.actions;
export default analyticsSlice.reducer;