import api from '../api.js';
import { toast } from 'react-toastify';

const BASE_URL = '/venue/venue/venues/';
const REQUEST_BASE_URL = '/venue/request-update/venue-update-requests/';

export const venuesService = {
    /**
     * GET /venue/venue/venues/
     * View all venues (supports pagination params if passed)
     */
    getAllVenues: async (params = {}) => {
        try {
            const response = await api.get(`${BASE_URL}`, { params });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load venues";
            // Optional: only show toast on error if it's critical, otherwise console log
            console.error(message);
            throw error;
        }
    },

    /**
     * POST /venue/venue/venues/
     * Create a new venue
     */
    createVenue: async (data) => {
        try {
            // If sending files (images), ensure 'data' is a FormData object
            const response = await api.post(`${BASE_URL}`, data);
            toast.success("Venue created successfully");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to create venue";
            toast.error(message);
            throw error;
        }
    },

    /**
     * GET /venue/venue/venues/{id}/
     * Retrieve a specific venue by ID
     */
    getVenueById: async (id,allLanguages) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/${allLanguages?"?all_languages":""}`);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load venue details";
            toast.error(message);
            throw error;
        }
    },

    /**
     * PATCH /venue/venue/venues/{id}/
     * Update a venue (Partial update)
     */
    updateVenue: async (id, data) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/`, data);
            toast.success("Venue updated successfully");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to update venue";
            toast.error(message);
            throw error;
        }
    },
    venueUpdateRequest: async (id, data) => {
        try {
            const response = await api.post(`${REQUEST_BASE_URL}`, data);
            toast.success("Venue Edit Request Created successfully");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to create venue edit request ";
            toast.error(message);
            throw error;
        }
    },

    /**
     * DELETE /venue/venue/venues/{id}/
     * Delete a venue
     */
    deleteVenue: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success("Venue deleted successfully");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to delete venue";
            toast.error(message);
            throw error;
        }
    }
};