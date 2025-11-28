import api from '../api.js';
import { toast } from 'react-toastify';


export const venuesService = {
    // view all venues
    getAllVenues: async () => {
        try {
            const response = await api.get('/venue/venue/venues/');
            toast.success("Pitches loaded successfully!");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load venues";
            toast.error(message);
            throw error;
        }
    },

    // delete pitch
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