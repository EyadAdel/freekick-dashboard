import api from '../api.js';
import { toast } from 'react-toastify';

export const pitchesService = {
    // View all pitches
    getAllPitchess: async () => {
        try {
            const response = await api.get('/venue/pitch/pitches/');
            // toast.success("Pitches loaded successfully!");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load pitches";
            toast.error(message);
            throw error;
        }
    },

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

    // Update existing pitch (New Function)
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