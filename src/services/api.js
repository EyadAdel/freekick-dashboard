// src/services/api.js
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - runs before every request
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');

        // Add token to headers if it exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request for debugging (remove in production)
        console.log('API Request:', config.method.toUpperCase(), config.url);

        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - runs after every response
api.interceptors.response.use(
    (response) => {
        // Log response for debugging (remove in production)
        console.log('API Response:', response.status, response.config.url);

        return response;
    },
    (error) => {
        // Handle different error scenarios
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    // Unauthorized - redirect to login
                    console.error('Unauthorized. Redirecting to login...');
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                    break;

                case 403:
                    console.error('Forbidden. You don\'t have permission.');
                    break;

                case 404:
                    console.error('Resource not found.');
                    break;

                case 500:
                    console.error('Server error. Please try again later.');
                    break;

                default:
                    console.error('API Error:', data.message || 'Something went wrong');
            }
        } else if (error.request) {
            // Request was made but no response received
            console.error('Network Error. Please check your connection.');
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;