import api from '../api.js';
import { toast } from 'react-toastify';

const BASE_URL = '/listing/venue-data/surface-types/';

export const surfaceTypesService = {
    /**
     * Get all surface types
     * Endpoint: GET /listing/venue-data/surface-types/
     */
    getAllSurfaceTypes: async () => {
        try {
            const response = await api.get(`${BASE_URL}?all_languages`);
            return response.data;
        } catch (error) {
            console.error("Error fetching surface types:", error);
            // Optional: toast.error("Failed to load surface types");
            throw error;
        }
    },

    /**
     * Get a single surface type by ID
     * Endpoint: GET /listing/venue-data/surface-types/{id}/
     */
    getSurfaceTypeById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching surface type ${id}:`, error);
            toast.error("Failed to load surface type details");
            throw error;
        }
    },

    /**
     * Create a new surface type
     * Endpoint: POST /listing/venue-data/surface-types/
     */
    createSurfaceType: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success("Surface type created successfully");
            return response.data;
        } catch (error) {
            console.error("Error creating surface type:", error);
            toast.error(error.response?.data?.message || "Failed to create surface type");
            throw error;
        }
    },

    /**
     * Update an existing surface type
     * Endpoint: PUT /listing/venue-data/surface-types/{id}/
     * (Or PATCH if your API supports partial updates)
     */
    updateSurfaceType: async (id, data) => {
        try {
            // Using put (replace entire resource) or patch (partial update) based on typical REST conventions.
            // Adjust to api.patch if your backend prefers that.
            const response = await api.put(`${BASE_URL}${id}/`, data);
            toast.success("Surface type updated successfully");
            return response.data;
        } catch (error) {
            console.error(`Error updating surface type ${id}:`, error);
            toast.error(error.response?.data?.message || "Failed to update surface type");
            throw error;
        }
    },

    /**
     * Delete a surface type
     * Endpoint: DELETE /listing/venue-data/surface-types/{id}/
     */
    deleteSurfaceType: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success("Surface type deleted successfully");
            return response.data;
        } catch (error) {
            console.error(`Error deleting surface type ${id}:`, error);
            toast.error(error.response?.data?.message || "Failed to delete surface type");
            throw error;
        }
    }
};