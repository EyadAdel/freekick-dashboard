import api from '../api.js';
export const pitchesService = {
    // view all pitches
    getAllPitchess: async () => {
        const response = await api.get('/venue/pitch/pitches/');
        return response.data;
    },
}