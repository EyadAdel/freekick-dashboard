// services/players/playerService.js
import api from '../api.js';

export const playerService = {
    // Get all players with filters
    getPlayers: async (params = {}) => {
        try {
            const response = await api.get('/auth/users/', { params });
            console.log('📊 Service - Raw API response:', response);
            console.log('📊 Service - Response data:', response.data);
            console.log('📊 Service - Response data.results:', response.data?.results);

            // Return based on your API structure
            // If your API returns {results: [...], count: X}
            if (response.data && response.data.results) {
                return {
                    results: response.data.results,
                    count: response.data.count || response.data.results.length
                };
            }
            // If your API returns just the array
            return {
                results: response.data.data || [],
                count: response.data?.length || 0
            };
        } catch (error) {
            console.error('❌ Service - Error fetching players:', error);
            throw error;
        }
    },

    // Get single player by ID
    getPlayer: async (id) => {
        try {
            const response = await api.get(`/auth/users/${id}/`);
            console.log('📊 Service - Player response:', response.data);
            return response.data.data || response.data || null;
        } catch (error) {
            console.error('❌ Service - Error fetching player:', error);
            throw error;
        }
    },

    // Get player analytics/stats
    getPlayerAnalytics: async () => {
        try {
            const response = await api.get('/players/analytics/');
            return response.data || [];
        } catch (error) {
            console.error('❌ Service - Error fetching analytics:', error);
            // Return empty array instead of throwing
            return [];
        }
    },

    // Get player bookings
    getPlayerBookings: async (playerId, params = {}) => {
        try {
            // Add playerId to params to filter by player
            const response = await api.get(`/booking/book/`, {
                params: { ...params, user__id: playerId }
            });

            // Handle paginated response structure
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
            console.error('❌ Service - Error fetching bookings:', error);
            // Return empty structure instead of throwing
            return { results: [], count: 0 };
        }
    },

    // Get player tournaments
    getPlayerTournaments: async (playerId, params = {}) => {
        try {
            const response = await api.get(`/tournaments/tournaments/`, {
                params: { ...params, user_id: playerId }
            });

            // Handle paginated response structure
            if (response.data && response.data.results) {
                return {
                    results: response.data.results,
                    count: response.data.count || 0
                };
            }

            return { results: [], count: 0 };
        } catch (error) {
            console.error('❌ Service - Error fetching tournaments:', error);
            // Return empty structure instead of throwing
            return { results: [], count: 0 };
        }
    },

    // Update player status
    updatePlayerStatus: async (playerId, isActive) => {
        try {
            const response = await api.patch(`/auth/users/${playerId}/`, {
                is_active: isActive
            });
            return response.data.data || response.data;
        } catch (error) {
            console.error('❌ Service - Error updating player status:', error);
            throw error;
        }
    },

    // Get player wallet transactions
    getPlayerTransactions: async (playerId, params = {}) => {
        try {
            // Based on your Django URLs, transactions might not exist yet
            // Try the user endpoint or return empty
            const response = await api.get(`/user/transactions/`, {
                params: { ...params, user_id: playerId }
            });
            return response.data.data || response.data || [];
        } catch (error) {
            console.error('❌ Service - Error fetching transactions:', error);
            // Return empty array instead of throwing
            return [];
        }
    },

    // Get player wallet balance
    getPlayerWalletBalance: async (playerId) => {
        try {
            const response = await api.get(`/user/wallet/${playerId}/`);
            return response.data.data || response.data || { balance: 0 };
        } catch (error) {
            console.error('❌ Service - Error fetching wallet balance:', error);
            // Return default balance instead of throwing
            return { balance: 0 };
        }
    }
,
getPlayerPoints: async (filters = {}) => {
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
        if (filters.user__id) params.append('user__id', filters.user__id);
        if (filters.points) params.append('points', filters.points);
        if (filters.points__gte) params.append('points__gte', filters.points__gte);
        if (filters.points__lte) params.append('points__lte', filters.points__lte);
        if (filters.reason) params.append('reason', filters.reason);
        if (filters.reason__icontains) params.append('reason__icontains', filters.reason__icontains);

        const response = await api.get(`/user/points/?${params.toString()}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
},

    // Create team points
    createPlayerPoints: async (data) => {
    try {
        const response = await api.post('/user/points/', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}
};
