// src/services/profileService.js
import api from './api';

/**
 * Profile Service
 * Handles all profile-related API calls
 */

class ProfileService {
    /**
     * Get current user profile
     * @returns {Promise} User profile data
     */
    async getProfile() {
        try {
            const response = await api.get('/user/staff/my_staff/',);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('❌ Error fetching profile:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch profile'
            };
        }
    }

    /**
     * Update user profile
     * @param {Object} profileData - Profile data to update
     * @returns {Promise} Updated profile data
     */
    async updateProfile(profileData) {
        try {
            const response = await api.patch('/user/staff/my_staff/', profileData);
            return {
                success: true,
                data: response.data,
                message: 'Profile updated successfully'
            };
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update profile'
            };
        }
    }

    /**
     * Upload profile picture
     * @param {File} file - Image file to upload
     * @returns {Promise} Upload response
     */
    async uploadProfilePicture(file) {
        try {
            const formData = new FormData();
            formData.append('profile_picture', file);

            const response = await api.post('/auth/users/upload-picture/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return {
                success: true,
                data: response.data,
                message: 'Profile picture uploaded successfully'
            };
        } catch (error) {
            console.error('❌ Error uploading profile picture:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to upload profile picture'
            };
        }
    }

    /**
     * Get user preferences
     * @returns {Promise} User preferences
     */
    async getPreferences() {
        try {
            const response = await api.get('/auth/users/my_notification_settings/');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('❌ Error fetching preferences:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch preferences'
            };
        }
    }

    /**
     * Update user preferences
     * @param {Object} preferences - Preferences to update
     * @returns {Promise} Updated preferences
     */
    async updatePreferences(preferences) {
        try {
            const response = await api.patch('/auth/users/my_notification_settings/', preferences);
            return {
                success: true,
                data: response.data,
                message: 'Preferences updated successfully'
            };
        } catch (error) {
            console.error('❌ Error updating preferences:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update preferences'
            };
        }
    }

    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} Password change response
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await api.post('/auth/users/set_password/', {
                current_password: currentPassword,
                new_password: newPassword
            });

            return {
                success: true,
                data: response.data,
                message: 'Password changed successfully'
            };
        } catch (error) {
            console.error('❌ Error changing password:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to change password'
            };
        }
    }

    /**
     * Enable/Disable two-factor authentication
     * @param {boolean} enabled - Enable or disable 2FA
     * @returns {Promise} 2FA status response
     */
    async toggleTwoFactor(enabled) {
        try {
            const response = await api.post('/auth/users/toggle-2fa/', {
                enabled: enabled
            });

            return {
                success: true,
                data: response.data,
                message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`
            };
        } catch (error) {
            console.error('❌ Error toggling two-factor authentication:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to toggle two-factor authentication'
            };
        }
    }

    /**
     * Get two-factor authentication status
     * @returns {Promise} 2FA status
     */
    async getTwoFactorStatus() {
        try {
            const response = await api.get('/auth/users/2fa-status/');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('❌ Error fetching 2FA status:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch 2FA status'
            };
        }
    }

    /**
     * Delete user account
     * @param {string} password - User password for confirmation
     * @returns {Promise} Account deletion response
     */
    async deleteAccount(password) {
        try {
            const response = await api.delete('/auth/users/me/', {
                data: { password }
            });

            return {
                success: true,
                data: response.data,
                message: 'Account deleted successfully'
            };
        } catch (error) {
            console.error('❌ Error deleting account:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete account'
            };
        }
    }

    /**
     * Verify email address
     * @param {string} token - Verification token
     * @returns {Promise} Verification response
     */
    async verifyEmail(token) {
        try {
            const response = await api.post('/auth/users/verify-email/', {
                token: token
            });

            return {
                success: true,
                data: response.data,
                message: 'Email verified successfully'
            };
        } catch (error) {
            console.error('❌ Error verifying email:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to verify email'
            };
        }
    }

    /**
     * Resend verification email
     * @returns {Promise} Resend response
     */
    async resendVerificationEmail() {
        try {
            const response = await api.post('/auth/users/resend-verification/');
            return {
                success: true,
                data: response.data,
                message: 'Verification email sent successfully'
            };
        } catch (error) {
            console.error('❌ Error resending verification email:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to resend verification email'
            };
        }
    }
}

// Export singleton instance
export default new ProfileService();