import api from './api';

const analyticsService = {
    // Get card analytics data
    getCardAnalytics: async () => {
        try {
            const response = await api.get('/booking/analytics/card-analytics/');
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Get revenue trend data
    getRevenueTrend: async (period = 'this_week') => {
        try {
            const response = await api.get('/booking/analytics/revenue-trend/', {
                params: { kind: period }
            });
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Get top emirates by bookings
    getTopEmirates: async (period = 'this_week') => {
        try {
            const response = await api.get('/booking/analytics/top-emirates/', {
                params: { period }
            });
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Get weekly booking analytics
    getWeeklyBookingAnalytics: async (params = {}) => {
        try {
            const response = await api.get('/booking/analytics/weekly-booking-analytics/', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getBookingChartAnalytics: async (period = 'this_week') => {
        try {
            const response = await api.get('/booking/analytics/weekly-booking-analytics/', {
                params: { kind: period }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get top teams
    getTopTeams: async (params = {}) => {
        try {
            const response = await api.get('/teams/teams', {
                params: {
                    page_size: 5,
                    ordering: '-number_of_booking',
                    ...params
                }
            });
            return response.data || [];
        } catch (error) {
            throw error;
        }
    },

    // Get notifications
    getNotifications: async (params = {}) => {
        try {
            const response = await api.get('/notifications/user-notifications/', {
                params: {
                    page_limit: params.page_limit || 5,
                    ordering: params.ordering || '-created_at',
                    ...params
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get notification by ID
    getNotificationById: async (id) => {
        try {
            const response = await api.get(`/notifications/user-notifications/${id}/`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Mark notification as read (you may need to adjust based on your API)
    markNotificationAsRead: async (id) => {
        try {
            const response = await api.patch(`/notifications/user-notifications/${id}/`, {
                is_active: true // Adjust based on your API requirements
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getPopularVenues: async (params = {}) => {
        try {
            const response = await api.get('/venue/venue/venues/', {
                params: {
                    city: params.city,
                    page_limit: params.page_limit || 5,
                    ordering: params.ordering || '-number_of_booking',
                    is_active: true,
                    ...params
                }
            });


                 return  response.data
        } catch (error) {
            throw error;
        }
    },
    // Get all analytics including notifications
    getAllAnalytics: async () => {
        try {
            const [
                cardAnalytics,
                revenueTrend,
                topEmirates,
                weeklyBookings,
                bookingChartData,
                topTeams,
                notificationsResponse,   // Clear name
                venuesResponse          // Clear name
            ] = await Promise.all([
                analyticsService.getCardAnalytics(),
                analyticsService.getRevenueTrend(),
                analyticsService.getTopEmirates('this_week'),
                analyticsService.getWeeklyBookingAnalytics(),
                analyticsService.getBookingChartAnalytics('this_week'),
                analyticsService.getTopTeams(),
                analyticsService.getNotifications({ page_limit: 5 }),
                analyticsService.getPopularVenues({ city: 'Abu Dhabi' }),
            ]);

            return {
                cardAnalytics,
                revenueTrend,
                topEmirates,
                weeklyBookings,
                bookingChartData,
                topTeams,
                notifications: notificationsResponse,    // Explicit assignment
                popularVenues: venuesResponse,          // Explicit assignment
            };
        } catch (error) {
            throw error;
        }
    },
};

export default analyticsService;