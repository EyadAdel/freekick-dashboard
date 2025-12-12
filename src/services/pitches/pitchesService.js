import api from '../api.js';
import { toast } from 'react-toastify';

export const pitchesService = {
    // View all pitches
    getAllPitchess: async (params = {}) => {
        try {
            const response = await api.get('/venue/pitch/pitches/', { params });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load pitches";
            console.error(message);
            throw error;
        }
    },

    // View one pitch (Get by ID)
    getPitchById: async (id) => {
        try {
            const response = await api.get(`/venue/pitch/pitches/${id}/?all_languages`);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load pitch details";
            toast.error(message);
            throw error;
        }
    },

    // --- NEW API ADDED HERE ---
    // Check pitch availability (Expects 'date' as YYYY-MM-DD)
    getPitchAvailableTime: async (id, date) => {
        try {
            const response = await api.get(`/venue/pitch/pitches/${id}/available_time/`, {
                params: { date } // Pass date as a query parameter
            });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to check availability";
            toast.error(message);
            throw error;
        }
    },
    // --------------------------

    // Add new pitch
    addPitch: async (pitchData) => {
        try {
            const response = await api.post('/venue/pitch/pitches/', pitchData);
            toast.success("Pitch created successfully!");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to create pitch";
            toast.error(message);
            throw error;
        }
    },

    // Update existing pitch
    updatePitch: async (id, pitchData) => {
        try {
            const response = await api.patch(`/venue/pitch/pitches/${id}/`, pitchData);
            toast.success("Pitch updated successfully!");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to update pitch";
            toast.error(message);
            throw error;
        }
    },

    // Delete pitch
    deletePitch: async (id) => {
        try {
            const response = await api.delete(`/venue/pitch/pitches/${id}/`);
            toast.success("Pitch deleted successfully!");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to delete pitch";
            toast.error(message);
            throw error;
        }
    },
};