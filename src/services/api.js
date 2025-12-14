// src/services/api.js
import axios from 'axios';
import { getEncryptedApiKey } from '../utils/encryption';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.freekickapp.com',
    timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add encrypted API key header
        try {
            const encryptedKey = getEncryptedApiKey();
            if (encryptedKey) {
                config.headers['X-API-KEY'] = encryptedKey;
            }
        } catch (error) {
            console.error('Failed to encrypt API key:', error);
        }

        // Add API version header
        config.headers['x-api-version'] = 'v2';

        // Add authorization token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle Content-Type dynamically
        if (config.data instanceof FormData) {
            // Let the browser set Content-Type for FormData (with boundary)
            delete config.headers['Content-Type'];
        } else if (!config.headers['Content-Type']) {
            // Default to JSON for other requests
            config.headers['Content-Type'] = 'application/json';
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
            const { status } = error.response;
            switch (status) {
                case 401:
                    console.error('🔐 Unauthorized - clearing tokens');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    break;
                case 403:
                    console.error('🚫 Forbidden - insufficient permissions');
                    break;
                case 404:
                    console.error('🔍 Not Found');
                    break;
                case 500:
                    console.error('💥 Server Error');
                    break;
                default:
                    console.error(`❌ Error ${status}`);
            }
        } else if (error.request) {
            console.error('📡 No response from server');
        } else {
            console.error('⚙️ Request setup error');
        }

        return Promise.reject(error);
    }
);

export default api;