import api from '../api.js';
import { toast } from 'react-toastify';

// Updated BASE_URL to match the image endpoint
const BASE_URL = '/venue/request-update/venue-update-requests/';

export const venuesEditRequestsService = {
    /**
     * GET List of all venue update requests
     * Endpoint: /venue/request-update/venue-update-requests/
     */
    getAllRequests: async (params = {}) => {
        try {
            const response = await api.get(BASE_URL, { params });
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch update requests.');
            throw error;
        }
    },

    /**
     * POST Create a new venue update request
     * Endpoint: /venue/request-update/venue-update-requests/
     */
    createRequest: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success('Venues update request created successfully.');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to create update request.');
            throw error;
        }
    },

    /**
     * GET Retrieve a single request by ID
     * Endpoint: /venue/request-update/venue-update-requests/{id}/
     */
    getRequestById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/?all_languages`);
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch request details.');
            throw error;
        }
    },

    /**
     * PUT Update an entire request by ID
     * Endpoint: /venue/request-update/venue-update-requests/{id}/
     */
    updateRequest: async (id, data) => {
        try {
            const response = await api.put(`${BASE_URL}${id}/`, data);
            toast.success('Request updated successfully.');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to update request.');
            throw error;
        }
    },

    /**
     * PATCH Partially update a request by ID
     * Endpoint: /venue/request-update/venue-update-requests/{id}/
     */
    patchRequest: async (id, data) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/`, data);
            toast.success('Request updated successfully.');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to update request.');
            throw error;
        }
    },

    /**
     * DELETE Remove a request by ID
     * Endpoint: /venue/request-update/venue-update-requests/{id}/
     */
    deleteRequest: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success('Request deleted successfully.');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete request.');
            throw error;
        }
    },

    /**
     * PATCH Accept a specific request (Custom Action)
     * Endpoint: /venue/request-update/venue-update-requests/{id}/accept_request/
     */
    acceptRequest: async (id, data = {}) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/accept_request/`, data);
            toast.success('Venues update request accepted.');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to accept request.');
            throw error;
        }
    },
};