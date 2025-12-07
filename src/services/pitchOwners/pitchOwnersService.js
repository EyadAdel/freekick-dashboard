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
    updateStaff: async (id, data) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/`, data);
            toast.success('Staff member updated successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update staff member.');
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
    getAllStaffActions: async (params = {}) => {
        try {
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

    // GET /user/staff-actions/analytics/
    // Note: Specific paths usually come before dynamic {id} paths in routing,
    // but in frontend service calls, the order doesn't matter.
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

    // GET /user/staff-actions/{id}/
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