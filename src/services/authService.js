// src/services/authService.js
import api from './api.js';

export const authService = {
    login: async (phone, password) => {

        try {
            const response = await api.post('/auth/jwt/create/', {
                phone: phone,
                password: password
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/users/me/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        // Since there's no backend API for logout, we just return a resolved promise
        // The actual token clearing happens in the Redux action
        return Promise.resolve({ success: true });
    },

    refreshToken: async (refreshToken) => {
        const response = await api.post('/auth/jwt/refresh/', {
            refresh: refreshToken
        });
        return response.data;
    }
};