import api from '../api.js';
import { toast } from 'react-toastify';

// Matches the base path shown in the screenshot
const BASE_URL = '/tournaments/tournaments/';
const JOINED_TEAMS_URL = '/tournaments/joined-teams/';

export const tournamentsService = {

    // GET: /tournaments/tournaments/
    // Fetch the list of all tournaments
    getAll: async (params = {}) => {
        try {
            const response = await api.get(`${BASE_URL}?all_languages/`, { params });
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch tournaments list.');
            throw error;
        }
    },

    // POST: /tournaments/tournaments/
    // Create a new tournament
    create: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success('Tournament created successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to create tournament.');
            throw error;
        }
    },

    // GET: /tournaments/tournaments/{id}/
    // Retrieve specific tournament details
    getById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/`);
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch tournament details.');
            throw error;
        }
    },

    // GET: /tournaments/joined-teams/?tournament__id={id}
    // Fetch teams that have joined a specific tournament
    getJoinedTeams: async (tournamentId) => {
        try {
            const response = await api.get(JOINED_TEAMS_URL, {
                params: { tournament__id: tournamentId }
            });
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch joined teams.');
            throw error;
        }
    },

    // PUT: /tournaments/tournaments/{id}/
    // Update a tournament (Full replacement)
    update: async (id, data) => {
        try {
            const response = await api.put(`${BASE_URL}${id}/`, data);
            toast.success('Tournament updated successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to update tournament.');
            throw error;
        }
    },

    // PATCH: /tournaments/tournaments/{id}/
    // Partially update a tournament
    patch: async (id, data) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/`, data);
            toast.success('Tournament updated successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to update tournament.');
            throw error;
        }
    },

    // DELETE: /tournaments/tournaments/{id}/
    // Delete a tournament
    delete: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success('Tournament deleted successfully!');
            return response.data;
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete tournament.');
            throw error;
        }
    },
};