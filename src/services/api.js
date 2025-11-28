
// src/services/api.js
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.freekickapp.com',
    timeout: 30000, // Increased timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('❌ API Response Error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response) {
            const { status, data } = error.response;
            switch (status) {
                case 401:
                    console.error('🔐 Unauthorized - clearing tokens');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    break;
                // ... other cases
            }
        }
        return Promise.reject(error);
    }
);

export default api;
