import api from "./api.js";

export const notificationService = {
    // Fetch users for multi-select
    async fetchUsers() {
        try {
            const response = await  api.get('/auth/users/', );

            return response.data.data.results;
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
