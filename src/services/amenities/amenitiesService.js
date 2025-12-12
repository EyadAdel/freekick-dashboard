import api from '../api.js';
import { toast } from 'react-toastify';

export const amenitiesService = {
    // View all Amenities (Updated to support pagination and search params)
    getAllAmenities: async (params = {}) => {
        try {
            // Pass params (page, page_limit, search) to the API call
            const response = await api.get('/listing/venue-data/amenities/', { params });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load Amenities";
            toast.error(message);
            throw error;
        }
    },

    // GET single Amenity by ID
    getAmenityById: async (id) => {
        try {
            const response = await api.get(`/listing/venue-data/amenities/${id}/?all_languages`);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load Amenity details";
            toast.error(message);
            throw error;
        }
    },

    // Create new Amenity
    createAmenity: async (amenityData) => {
        try {
            const response = await api.post('/listing/venue-data/amenities/', amenityData);
            toast.success("Amenity created successfully");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to create Amenity";
            toast.error(message);
            throw error;
        }
    },

    // Update Amenity
    updateAmenity: async (id, amenityData) => {
        try {
            const response = await api.patch(`/listing/venue-data/amenities/${id}/`, amenityData);
            toast.success("Amenity updated successfully");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to update Amenity";
            toast.error(message);
            throw error;
        }
    },

    // Delete Amenity
    deleteAmenity: async (id) => {
        try {
            const response = await api.delete(`/listing/venue-data/amenities/${id}/`);
            toast.success("Amenity deleted successfully");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to delete Amenity";
            toast.error(message);
            throw error;
        }
    }
};