// src/services/authService.js
import api from './api.js';

export const authService = {
    login: async (phone, password, fcmToken = null) => {
        try {
            const payload = {
                phone,
                password
            };

            // Add FCM token if available
            if (fcmToken) {
                payload.fcm_token = fcmToken;
                payload.device_type = 'web';
            }

            console.log('Login API payload:', payload); // Debug log

            const response = await api.post('/auth/jwt/create/', payload);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.details?.[0]?.message
                || error.response?.data?.detail
                || 'Login failed. Please try again.';

            throw new Error(errorMessage);
        }
    },

    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/users/me/');
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.details?.[0]?.message
                || error.response?.data?.detail
                || 'Failed to fetch user data.';

            throw new Error(errorMessage);
        }
    },

    // NEW: Get Users List
    getUsers: async (params={}) => {
        try {
            const response = await api.get('/auth/users/', { params });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.details?.[0]?.message
                || error.response?.data?.detail
                || 'Failed to fetch users.';

            throw new Error(errorMessage);
        }
    },

    logout: async () => {
        return Promise.resolve({ success: true });
    },

    refreshToken: async (refreshToken) => {
        try {
            const response = await api.post('/auth/jwt/refresh/', {
                refresh: refreshToken
            });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.details?.[0]?.message
                || error.response?.data?.detail
                || 'Token refresh failed.';

            throw new Error(errorMessage);
        }
    },

    checkOtp: async (phone, otp) => {
        try {
            const response = await api.post('/auth/users/check-otp/', {
                phone,
                otp
            });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.details?.[0]?.message
                || error.response?.data?.detail
                || 'Failed to verify OTP. Please try again.';

            throw new Error(errorMessage);
        }
    },

    // NEW: Reset password with OTP
    resetPasswordConfirm: async (phone, otp, newPassword) => {
        try {
            const response = await api.post('/auth/users/reset_password_confirm/', {
                phone,
                otp,
                new_password: newPassword
            });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.details?.[0]?.message
                || error.response?.data?.detail
                || 'Failed to reset password. Please try again.';

            throw new Error(errorMessage);
        }
    },

    // NEW: Request new OTP (for resend functionality)
    checkOtpResetPassword: async (phone) => {
        try {
            const response = await api.post('/auth/users/reset_password/', {
                phone
            });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.details?.[0]?.message
                || error.response?.data?.detail
                || 'Failed to send OTP. Please try again.';

            throw new Error(errorMessage);
        }
    }
};