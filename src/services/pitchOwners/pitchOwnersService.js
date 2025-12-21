import api from '../api.js';
import { toast } from 'react-toastify';

const BASE_URL = '/user/staff/';
const ACTIONS_BASE_URL = '/user/staff-actions/';

export const pitchOwnersService = {
    // ==========================
    // STAFF ENDPOINTS
    // ==========================

    // GET /user/staff/
    getAllStaff: async (params = {}) => {
        try {
            const response = await api.get(`${BASE_URL}?all_languages`, { params });
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch staff list.');
            throw error;
        }
    },

    // POST /user/staff/
    createStaff: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success('Staff member created successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create staff member.');
            throw error;
        }
    },

    // GET /user/staff/{id}/
    getStaffById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/?all_languages/?kind=pitch_owner`);
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch staff details.');
            throw error;
        }
    },

    // PATCH /user/staff/{id}/
    // Use this for updating commission_rate
    updateStaff: async (id, data) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/`, data);
            toast.success('Updated successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update details.');
            throw error;
        }
    },

    // DELETE /user/staff/{id}/
    deleteStaff: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success('Staff member deleted successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete staff member.');
            throw error;
        }
    },

    // ==========================
    // STAFF ACTIONS ENDPOINTS
    // ==========================

    // GET /user/staff-actions/
    getAllStaffActions: async (id, page = 1, actionsLimit, startDate, endDate) => {
        try {
            const params = {
                staff__id: id,
                page: page,
                page_limit: actionsLimit,
            };

            // If both dates exist, use the comma-separated range parameter
            if (startDate && endDate) {
                params.created_at__date__range = `${startDate},${endDate}`;
            } else {
                // Fallback to individual bounds if only one date is selected
                if (startDate) params.created_at__date__gte = startDate;
                if (endDate) params.created_at__date__lte = endDate;
            }

            const response = await api.get(ACTIONS_BASE_URL, { params });
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch staff actions.');
            throw error;
        }
    },
    // POST /user/staff-actions/
    createStaffAction: async (data) => {
        try {
            const response = await api.post(ACTIONS_BASE_URL, data);
            toast.success('Action recorded successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to record action.');
            throw error;
        }
    },

    getStaffActionAnalytics: async (params = {}) => {
        try {
            const response = await api.get(`${ACTIONS_BASE_URL}analytics/`, { params });
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch analytics.');
            throw error;
        }
    },

    getStaffActionById: async (id) => {
        try {
            const response = await api.get(`${ACTIONS_BASE_URL}${id}/`);
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch action details.');
            throw error;
        }
    },
};