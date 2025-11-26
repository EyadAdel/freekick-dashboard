// services/bookingService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const bookingService = {
    // Get all bookings
    getAll: async (filters) => {
        const response = await axios.get(`${API_BASE_URL}/bookings`, {
            params: filters
        });
        return response.data;
    },

    // Get single booking
    getById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/bookings/${id}`);
        return response.data;
    },

    // Create booking
    create: async (bookingData) => {
        const response = await axios.post(`${API_BASE_URL}/bookings`, bookingData);
        return response.data;
    },

    // Update booking
    update: async (id, bookingData) => {
        const response = await axios.put(`${API_BASE_URL}/bookings/${id}`, bookingData);
        return response.data;
    },

    // Delete booking
    delete: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/bookings/${id}`);
        return response.data;
    }
};