// services/teams/teamService.js
import api from '../api';

export const teamService = {
    // Get all teams with filters
    getTeams: async (filters = {}) => {
        try {
            const params = new URLSearchParams();

            // Add pagination
            if (filters.page) params.append('page', filters.page);
            if (filters.page_limit) params.append('page_limit', filters.page_limit);

            // Add search
            if (filters.search) params.append('search', filters.search);

            // Add ordering
            if (filters.ordering) params.append('ordering', filters.ordering);

            // Add other filters
            if (filters.name) params.append('name', filters.name);
            if (filters.name__icontains) params.append('name__icontains', filters.name__icontains);
            if (filters.user__id) params.append('user__id', filters.user__id);

            const response = await api.get(`/teams/teams/?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get single team by ID
    getTeam: async (id) => {
        try {
            const response = await api.get(`/teams/teams/${id}/`);
            return response.data.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get team analytics/statistics
    getTeamAnalytics: async () => {
        try {
            // This endpoint might need to be adjusted based on your API
            const response = await api.get('/teams/analytics/');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update team status
    updateTeamStatus: async (id, status) => {
        try {
            const response = await api.patch(`/teams/teams/${id}/`, { status });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Suspend team
    suspendTeam: async (id) => {
        try {
            const response = await api.post(`/teams/teams/${id}/suspend/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateTeam: async (id, data) => {
        try {
            const response = await api.patch(`/teams/teams/${id}/`, {is_active:data,id:id});
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get team bookings
    getTeamBookings: async (teamId, filters = {}) => {
        try {
            const params = new URLSearchParams();

            // Add team_id filter
            params.append('team_id', teamId);

            // Add date filter if provided
            if (filters.start_time__date) {
                params.append('start_time__date', filters.start_time__date);
            }

            // Add status filter if provided and not 'all'
            if (filters.status && filters.status !== 'all') {
                params.append('status', filters.status);
            }

            // Add pagination
            if (filters.page) params.append('page', filters.page);
            if (filters.page_limit) params.append('page_limit', filters.page_limit);

            const response = await api.get(`/booking/book/team/${teamId}`, { params });

            // Handle different response structures
            if (response.data && response.data.results) {
                return {
                    results: response.data.results,
                    count: response.data.count || 0,
                    confirmed: response.data.confirmed || 0,
                    pending: response.data.pending || 0,
                    cancelled: response.data.cancelled || 0
                };
            }

            return { results: [], count: 0 };
        } catch (error) {
            console.error('❌ Service - Error fetching team bookings:', error);
            // Return empty structure instead of throwing
            return { results: [], count: 0 };
        }
    },

    // Get team tournaments
    getTeamTournaments: async (teamId, params = {}) => {
        try {
            const queryParams = new URLSearchParams();

            // Add team_id filter
            queryParams.append('team_id', teamId);

            // Add pagination
            if (params.page) queryParams.append('page', params.page);
            if (params.page_limit) queryParams.append('page_limit', params.page_limit);

            const response = await api.get(`/tournaments/tournaments/team/${teamId}/`);

            // Handle different response structures
            if (response.data && response.data.results) {
                return {
                    results: response.data.results,
                    count: response.data.count || 0
                };
            }

            return { results: [], count: 0 };
        } catch (error) {
            console.error('❌ Service - Error fetching team tournaments:', error);
            // Return empty structure instead of throwing
            return { results: [], count: 0 };
        }
    },

    // Get team points
    getTeamPoints: async (filters = {}) => {
        try {
            const params = new URLSearchParams();

            // Add pagination
            if (filters.page) params.append('page', filters.page);
            if (filters.page_limit) params.append('page_limit', filters.page_limit);

            // Add search
            if (filters.search) params.append('search', filters.search);

            // Add ordering
            if (filters.ordering) params.append('ordering', filters.ordering);

            // Add filters
            if (filters.team_id) params.append('team_id', filters.team_id);
            if (filters.points) params.append('points', filters.points);
            if (filters.points__gte) params.append('points__gte', filters.points__gte);
            if (filters.points__lte) params.append('points__lte', filters.points__lte);
            if (filters.reason) params.append('reason', filters.reason);
            if (filters.reason__icontains) params.append('reason__icontains', filters.reason__icontains);

            const response = await api.get(`/teams/team-points/?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Create team points
    createTeamPoints: async (data) => {
        try {
            const response = await api.post('/teams/team-points/', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update team points
    updateTeamPoints: async (id, data) => {
        try {
            const response = await api.patch(`/teams/team-points/${id}/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};