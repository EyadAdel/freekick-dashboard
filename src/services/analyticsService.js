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
    getRevenueTrend: async (params = {}) => {
        try {
            const response = await api.get('/booking/analytics/revenue-trend/', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get top partners/suppliers data (I assume "Smipates" is a typo for "Partners")
    getTopPartners: async (limit = 10) => {
        try {
            const response = await api.get('/booking/analytics/top-emirates/', {
                params: { limit }
            });
            return response.data;
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

    // Optional: Get all analytics data at once
    getAllAnalytics: async () => {
        try {
            const [cardAnalytics, revenueTrend, topPartners, weeklyBookings] = await Promise.all([
                analyticsService.getCardAnalytics(),
                analyticsService.getRevenueTrend(),
                analyticsService.getTopPartners(),
                analyticsService.getWeeklyBookingAnalytics(),
            ]);

            return {
                cardAnalytics,
                revenueTrend,
                topPartners,
                weeklyBookings,
            };
        } catch (error) {
            throw error;
        }
    },
};

export default analyticsService;