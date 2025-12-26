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

export const fetchTopEmirates = createAsyncThunk(
    'analytics/fetchTopEmirates',
    async (kind = 'this_week', { rejectWithValue }) => {
        try {
            return await analyticsService.getTopEmirates(kind);
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

export const fetchBookingChartAnalytics = createAsyncThunk(
    'analytics/fetchBookingChartAnalytics',
    async (period = 'this_week', { rejectWithValue }) => {
        try {
            return await analyticsService.getBookingChartAnalytics(period);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking chart data');
        }
    }
);

export const fetchTopTeams = createAsyncThunk(
    'analytics/fetchTopTeams',
    async (params = {}, { rejectWithValue }) => {
        try {
            return await analyticsService.getTopTeams(params);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Add notification thunks
export const fetchNotifications = createAsyncThunk(
    'analytics/fetchNotifications',
    async (params = {}, { rejectWithValue }) => {
        try {
            return await analyticsService.getNotifications(params);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchNotificationById = createAsyncThunk(
    'analytics/fetchNotificationById',
    async (id, { rejectWithValue }) => {
        try {
            return await analyticsService.getNotificationById(id);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const markNotificationAsRead = createAsyncThunk(
    'analytics/markNotificationAsRead',
    async (id, { rejectWithValue }) => {
        try {
            return await analyticsService.markNotificationAsRead(id);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);
export const fetchPopularVenues = createAsyncThunk(
    'analytics/fetchPopularVenues',
    async (params = {}, { rejectWithValue }) => {
        try {
            return await analyticsService.getPopularVenues(params);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);
const initialState = {
    cardAnalytics: null,
    revenueTrend: null,
    topEmirates: null,
    weeklyBookings: null,
    bookingChartData: null,
    topTeams: null,
    notifications: [],
    notificationsCount: 0,
    currentNotification: null,
    currentEmiratesPeriod: 'this_week',
    currentBookingPeriod: 'this_week',
    currentTeamsPeriod: 'this_week',
    loading: {
        cardAnalytics: false,
        revenueTrend: false,
        topEmirates: false,
        weeklyBookings: false,
        bookingChart: false,
        topTeams: false,
        notifications: false,
        popularVenues: false,  // ADD THIS LINE
        notificationDetail: false,
        all: false,
    },
    error: {
        cardAnalytics: null,
        revenueTrend: null,
        topEmirates: null,
        weeklyBookings: null,
        bookingChart: null,
        topTeams: null,
        notifications: null,
        notificationDetail: null,
        popularVenues: null,  // ADD THIS LINE
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
                Object.keys(state.error).forEach(key => {
                    state.error[key] = null;
                });
            }
        },
        resetAnalyticsData: (state) => {
            state.cardAnalytics = null;
            state.revenueTrend = null;
            state.topEmirates = null;
            state.weeklyBookings = null;
            state.topTeams = null;
            state.popularVenues = null;  // ADD THIS LINE
            state.notifications = [];
            state.notificationsCount = 0;
            Object.keys(state.error).forEach(key => {
                state.error[key] = null;
            });
        },
        setEmiratesPeriod: (state, action) => {
            state.currentEmiratesPeriod = action.payload;
        },
        setBookingPeriod: (state, action) => {
            state.currentBookingPeriod = action.payload;
        },
        setTeamsPeriod: (state, action) => {
            state.currentTeamsPeriod = action.payload;
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.notificationsCount = 0;
        },
        setVenuesCity: (state, action) => {  // ADD THIS REDUCER
            state.currentVenuesCity = action.payload;
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

        // Top Emirates
        builder
            .addCase(fetchTopEmirates.pending, (state) => {
                state.loading.topEmirates = true;
                state.error.topEmirates = null;
            })
            .addCase(fetchTopEmirates.fulfilled, (state, action) => {
                state.loading.topEmirates = false;
                state.topEmirates = action.payload;
            })
            .addCase(fetchTopEmirates.rejected, (state, action) => {
                state.loading.topEmirates = false;
                state.error.topEmirates = action.payload;
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

        // Booking Chart Analytics
        builder
            .addCase(fetchBookingChartAnalytics.pending, (state) => {
                state.loading.bookingChart = true;
                state.error.bookingChart = null;
            })
            .addCase(fetchBookingChartAnalytics.fulfilled, (state, action) => {
                state.loading.bookingChart = false;
                state.bookingChartData = action.payload;
            })
            .addCase(fetchBookingChartAnalytics.rejected, (state, action) => {
                state.loading.bookingChart = false;
                state.error.bookingChart = action.payload;
            });

        // Top Teams
        builder
            .addCase(fetchTopTeams.pending, (state) => {
                state.loading.topTeams = true;
                state.error.topTeams = null;
            })
            .addCase(fetchTopTeams.fulfilled, (state, action) => {
                state.loading.topTeams = false;
                state.topTeams = action.payload;
            })
            .addCase(fetchTopTeams.rejected, (state, action) => {
                state.loading.topTeams = false;
                state.error.topTeams = action.payload;
            });

        // Notifications
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading.notifications = true;
                state.error.notifications = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading.notifications = false;
                state.notifications = action.payload.results || [];
                state.notificationsCount = action.payload.count || 0;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading.notifications = false;
                state.error.notifications = action.payload;
            });

        // Notification Detail
        builder
            .addCase(fetchNotificationById.pending, (state) => {
                state.loading.notificationDetail = true;
                state.error.notificationDetail = null;
            })
            .addCase(fetchNotificationById.fulfilled, (state, action) => {
                state.loading.notificationDetail = false;
                state.currentNotification = action.payload;
            })
            .addCase(fetchNotificationById.rejected, (state, action) => {
                state.loading.notificationDetail = false;
                state.error.notificationDetail = action.payload;
            });

        // Mark as Read
        builder
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                // Update the notification in the list
                const index = state.notifications.findIndex(n => n.id === action.payload.id);
                if (index !== -1) {
                    state.notifications[index] = action.payload;
                }
                // Update current notification if it's the same
                if (state.currentNotification?.id === action.payload.id) {
                    state.currentNotification = action.payload;
                }
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
                state.topEmirates = action.payload.topEmirates;
                state.weeklyBookings = action.payload.weeklyBookings;
                state.bookingChartData = action.payload.bookingChartData;
                state.topTeams = action.payload.topTeams;
                state.notifications = action.payload.notifications?.results || [];
                state.notificationsCount = action.payload.notifications?.count || 0;
            })
            .addCase(fetchAllAnalytics.rejected, (state, action) => {
                state.loading.all = false;
                state.error.all = action.payload;
            });
        builder
            .addCase(fetchPopularVenues.pending, (state) => {
                state.loading.popularVenues = true;
                state.error.popularVenues = null;
            })
            .addCase(fetchPopularVenues.fulfilled, (state, action) => {
                state.loading.popularVenues = false;
                state.popularVenues = action.payload;
            })
            .addCase(fetchPopularVenues.rejected, (state, action) => {
                state.loading.popularVenues = false;
                state.error.popularVenues = action.payload;
            });
    },
});

export const {
    clearAnalyticsError,
    resetAnalyticsData,
    setBookingPeriod,
    setEmiratesPeriod,
    setTeamsPeriod,
    clearNotifications,
    setVenuesCity,  // ADD THIS LINE
} = analyticsSlice.actions;

export default analyticsSlice.reducer;