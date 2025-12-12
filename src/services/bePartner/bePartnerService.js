import api from '../api.js';
import { toast } from 'react-toastify';

const BASE_URL = '/user/be-partner/';

export const bePartnerService = {
    // GET /user/be-partner/
    // Fetch all records (can accept query params for pagination/filtering)
    getAll: async (params = {}) => {
        try {
            const response = await api.get(BASE_URL, { params });
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to load partner requests.');
            throw error;
        }
    },

    // POST /user/be-partner/
    // Create a new record
    create: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success('Partner request created successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create request.');
            throw error;
        }
    },

    // GET /user/be-partner/{id}/
    // Retrieve a specific record by ID
    getById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/`);
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to load details.');
            throw error;
        }
    },

    // PUT /user/be-partner/{id}/
    // Full update of a specific record
    update: async (id, data) => {
        try {
            const response = await api.put(`${BASE_URL}${id}/`, data);
            toast.success('Updated successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update request.');
            throw error;
        }
    },

    // PATCH /user/be-partner/{id}/
    // Partial update of a specific record
    patch: async (id, data) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/`, data);
            toast.success('Updated successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update request.');
            throw error;
        }
    },

    // DELETE /user/be-partner/{id}/
    // Delete a specific record
    delete: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success('Deleted successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete request.');
            throw error;
        }
    },
};