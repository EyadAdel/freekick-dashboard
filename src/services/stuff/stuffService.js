import api from '../api.js';
import { toast } from 'react-toastify';

export const stuffTypeListService = {
    /**
     * Fetches the staff list based on the dynamic 'kind' type.
     * Path: /user/staff/{kind}
     * @param {string} kind - The type of staff (e.g., 'manager', 'employee')
     */
    getStuffListByType: async (kind) => {
        try {
            // Construct the dynamic path
            // If kind is provided, append it; otherwise use base path
            const url = kind ? `/user/staff/?kind=${kind}` : '/user/staff/';

            const response = await api.get(url);

            // Return the data from the response
            return response.data;
        } catch (error) {
            // Handle errors (log and show toast)
            console.error("Error fetching staff list:", error);

            const errorMessage = error.response?.data?.message || "Failed to fetch staff list.";
            toast.error(errorMessage);

            // Re-throw if the calling component needs to handle the loading state
            throw error;
        }
    }
};