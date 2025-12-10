// services/bookingService.js
import api from '../api.js';

export const bookingService = {
    // Analytics endpoints
    getCardAnalytics: async () => {
        const response = await api.get('/booking/analytics/card-analytics/');
        return response.data;
    },

    getRevenueTrend: async () => {
        const response = await api.get('/booking/analytics/revenue-trend/');
        return response.data;
    },

    getTopEmirates: async () => {
        const response = await api.get('/booking/analytics/top-emirates/');
        return response.data;
    },

    getWeeklyBookingAnalytics: async () => {
        const response = await api.get('/booking/analytics/weekly-booking-analytics/');
        return response.data;
    },

    // Calendar view endpoint
    getCalendarBookings: async (filters) => {
        const response = await api.get('/booking/book/calender/', {
            params: filters
        });
        return response.data;
    },

    getAll: async (filters) => {
        const response = await api.get('/booking/book/', {
            params: filters
        });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/booking/book/${id}/`);
        return response.data;
    },

    create: async (bookingData) => {
        const response = await api.post('/booking/book/', bookingData);
        return response.data;
    },

    update: async (id, bookingData) => {
        const response = await api.put(`/booking/book/${id}/`, bookingData);
        return response.data;
    },

    partialUpdate: async (id, bookingData) => {
        const response = await api.patch(`/booking/book/${id}/`, bookingData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/booking/book/${id}/`);
        return response.data;
    },

    // Booking calculation and operations
    calculatePriceWithExistingBooking: async (id) => {
        const response = await api.post(`/booking/book/${id}/calculate_price_one_user_with_existing_booking/`);
        return response.data;
    },

    cancelBooking: async (id) => {
        const response = await api.post(`/booking/book/${id}/cancel_booking/`,{id:id});
        return response.data;
    },

    calculateBookingTotalPrice: async (bookingData) => {
        const response = await api.post('/booking/book/calculate_booking_total_price/', bookingData);
        return response.data;
    },

    calculatePriceForOneUser: async (userData) => {
        const response = await api.post('/booking/book/calculate_price_for_one_user/', userData);
        return response.data;
    },

    checkBookingAvailability: async (availabilityData) => {
        const response = await api.post('/booking/book/check_booking_is_available/', availabilityData);
        return response.data;
    },

    // Join booking operations
    joinBooking: async (bookingData) => {
        const response = await api.post('/booking/join-booking/', bookingData);
        return response.data;
    },

    getJoinBookings: async () => {
        const response = await api.get('/booking/join-booking/');
        return response.data;
    },

    getJoinBookingById: async (id) => {
        const response = await api.get(`/booking/join-booking/${id}/`);
        return response.data;
    },

    cancelJoinBooking: async (bookId) => {
        const response = await api.post(`/booking/join-booking/cancel/${bookId}/`);
        return response.data;
    },

    // Walk-ins
    getWalkIns: async () => {
        const response = await api.get('/booking/walk-ins/');
        return response.data;
    },

    createWalkIn: async (walkInData) => {
        const response = await api.post('/booking/walk-ins/', walkInData);
        return response.data;
    },

    getWalkInById: async (id) => {
        const response = await api.get(`/booking/walk-ins/${id}/`);
        return response.data;
    },

    updateWalkIn: async (id, walkInData) => {
        const response = await api.put(`/booking/walk-ins/${id}/`, walkInData);
        return response.data;
    },

    partialUpdateWalkIn: async (id, walkInData) => {
        const response = await api.patch(`/booking/walk-ins/${id}/`, walkInData);
        return response.data;
    },

    deleteWalkIn: async (id) => {
        const response = await api.delete(`/booking/walk-ins/${id}/`);
        return response.data;
    },

    // Addons
    getAddons: async () => {
        const response = await api.get('/booking/addons/');
        return response.data;
    },

    createAddon: async (addonData) => {
        const response = await api.post('/booking/addons/', addonData);
        return response.data;
    },

    getAddonById: async (id) => {
        const response = await api.get(`/booking/addons/${id}/`);
        return response.data;
    },

    updateAddon: async (id, addonData) => {
        const response = await api.put(`/booking/addons/${id}/`, addonData);
        return response.data;
    },

    partialUpdateAddon: async (id, addonData) => {
        const response = await api.patch(`/booking/addons/${id}/`, addonData);
        return response.data;
    },

    deleteAddon: async (id) => {
        const response = await api.delete(`/booking/addons/${id}/`);
        return response.data;
    }
};