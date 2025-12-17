import api from "./api.js";

export const notificationService = {
    // Fetch users for multi-select
    async fetchUsers(params={}) {
        try {
            const response = await api.get('/auth/users/', { params });

            // Return the entire response data for pagination
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Send notification
    async sendNotification(notificationData) {
        try {
            const response = await  api.post('/notifications/user-notifications/',notificationData );
            return response.data;

        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    },
};
