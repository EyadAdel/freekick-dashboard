// hooks/usePlayers.js
import { useState, useEffect, useCallback } from 'react';
import { playerService } from '../services/players/playerService';

export const usePlayers = (filters = {}) => {
    const [players, setPlayers] = useState({
        results: [],
        count: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPlayers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('🔄 Hook - Fetching players with filters:', filters);
            const data = await playerService.getPlayers(filters);
            console.log('✅ Hook - Players data received:', data);

            setPlayers({
                results: data.results || [],
                count: data.count || 0
            });
            return data;
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch players';
            console.error('❌ Hook - Error:', errorMsg);
            setError(errorMsg);

            // Set empty state on error
            setPlayers({
                results: [],
                count: 0
            });
        } finally {
            setIsLoading(false);
        }
    }, [JSON.stringify(filters)]);

    useEffect(() => {
        console.log('🎯 Hook - useEffect triggered');
        fetchPlayers();
    }, [fetchPlayers]);

    const refetch = () => {
        console.log('🔄 Hook - Manual refetch triggered');
        return fetchPlayers();
    };

    return {
        players: players.results,
        count: players.count,
        isLoading,
        error,
        refetch,
        data: players
    };
};

export const usePlayer = (playerId) => {
    const [player, setPlayer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPlayer = useCallback(async () => {
        if (!playerId) {
            setPlayer(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await playerService.getPlayer(playerId);
            console.log('✅ Player data fetched:', data);
            setPlayer(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch player');
            console.error('❌ Error fetching player:', err);
            // Don't set player to null here - keep initialPlayer if it exists
        } finally {
            setIsLoading(false);
        }
    }, [playerId]);

    useEffect(() => {
        fetchPlayer();
    }, [fetchPlayer]);

    const refetch = () => {
        return fetchPlayer();
    };

    return {
        player,
        isLoading,
        error,
        refetch,
        data: player
    };
};

export const usePlayerAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAnalytics = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await playerService.getPlayerAnalytics();
            setAnalytics(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch analytics');
            console.error('❌ Error fetching analytics:', err);
            setAnalytics([]); // Set empty array on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const refetch = () => {
        return fetchAnalytics();
    };

    return {
        analytics,
        isLoading,
        error,
        refetch,
        data: analytics
    };
};

export const usePlayerBookings = (playerId, filters = {}) => {
    const [bookings, setBookings] = useState({ results: [], count: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBookings = useCallback(async () => {
        if (!playerId) {
            setBookings({ results: [], count: 0 });
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await playerService.getPlayerBookings(playerId, filters);
            console.log('✅ Bookings fetched:', data);
            setBookings(data || { results: [], count: 0 });
        } catch (err) {
            setError(err.message || 'Failed to fetch bookings');
            console.error('❌ Error fetching bookings:', err);
            setBookings({ results: [], count: 0 }); // Set empty structure on error
        } finally {
            setIsLoading(false);
        }
    }, [playerId, JSON.stringify(filters)]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const refetch = () => {
        return fetchBookings();
    };

    return {
        bookings,
        isLoading,
        error,
        refetch,
        data: bookings
    };
};

export const usePlayerTournaments = (playerId, filters = {}) => {
    const [tournaments, setTournaments] = useState({ results: [], count: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTournaments = useCallback(async () => {
        if (!playerId) {
            setTournaments({ results: [], count: 0 });
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await playerService.getPlayerTournaments(playerId, filters);
            console.log('✅ Tournaments fetched:', data);
            setTournaments(data || { results: [], count: 0 });
        } catch (err) {
            setError(err.message || 'Failed to fetch tournaments');
            console.error('❌ Error fetching tournaments:', err);
            setTournaments({ results: [], count: 0 }); // Set empty structure on error
        } finally {
            setIsLoading(false);
        }
    }, [playerId, JSON.stringify(filters)]);

    useEffect(() => {
        fetchTournaments();
    }, [fetchTournaments]);

    const refetch = () => {
        return fetchTournaments();
    };

    return {
        tournaments,
        isLoading,
        error,
        refetch,
        data: tournaments
    };
};

export const usePlayerTransactions = (playerId, filters = {}) => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTransactions = useCallback(async () => {
        if (!playerId) {
            setTransactions([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await playerService.getPlayerTransactions(playerId, filters);
            console.log('✅ Transactions fetched:', data);
            setTransactions(data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch transactions');
            console.error('❌ Error fetching transactions:', err);
            setTransactions([]); // Set empty array on error
        } finally {
            setIsLoading(false);
        }
    }, [playerId, JSON.stringify(filters)]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const refetch = () => {
        return fetchTransactions();
    };

    return {
        transactions,
        isLoading,
        error,
        refetch,
        data: transactions
    };
};

export const useUpdatePlayerStatus = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateStatus = async ({ playerId, isActive }, options = {}) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await playerService.updatePlayerStatus(playerId, isActive);

            if (options.onSuccess) {
                options.onSuccess(data, { playerId, isActive });
            }

            return data;
        } catch (err) {
            const errorMsg = err.message || 'Failed to update player status';
            setError(errorMsg);

            if (options.onError) {
                options.onError(err);
            }

            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        mutate: updateStatus,
        isLoading,
        error
    };
};

export const usePlayerData = (playerId) => {
    const { player, isLoading: playerLoading, error: playerError, refetch: refetchPlayer } = usePlayer(playerId);
    const { bookings, isLoading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = usePlayerBookings(playerId);
    const { tournaments, isLoading: tournamentsLoading, error: tournamentsError, refetch: refetchTournaments } = usePlayerTournaments(playerId);
    const { transactions, isLoading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = usePlayerTransactions(playerId);

    const isLoading = playerLoading || bookingsLoading || tournamentsLoading || transactionsLoading;
    const error = playerError || bookingsError || tournamentsError || transactionsError;

    const refetch = async () => {
        await Promise.all([
            refetchPlayer(),
            refetchBookings(),
            refetchTournaments(),
            refetchTransactions()
        ]);
    };

    return {
        player,
        bookings,
        tournaments,
        transactions,
        isLoading,
        error,
        refetch
    };
};