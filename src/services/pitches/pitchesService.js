import api from '../api.js';
import { toast } from 'react-toastify';

export const pitchesService = {
    // view all pitches
    getAllPitchess: async () => {
        try {
            const response = await api.get('/venue/pitch/pitches/');
            toast.success("Pitches loaded successfully!");

            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load pitches";
            toast.error(message);

            throw error;
        }
    },
};