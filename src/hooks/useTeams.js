// hooks/useTeams.js
import { useEffect, useState, useRef } from 'react';
import { teamService } from '../services/teams/teamService';

// Hook to fetch multiple teams with filters
export const useTeams = (filters = {}) => {
    const [teams, setTeams] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    const fetchTeams = async () => {
        // Cancel previous request if it exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        try {
            setIsLoading(true);
            setError(null);
            abortControllerRef.current = new AbortController();

            const data = await teamService.getTeams(filters);
            setTeams(data);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message || 'Failed to fetch teams');
                console.error('Error fetching teams:', err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();

        // Cleanup function to cancel request on unmount
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [JSON.stringify(filters)]);

    return {
        teams,
        isLoading,
        error,
        refetch: fetchTeams
    };
};

// Hook to fetch single team
export const useTeam = (id) => {
    const [team, setTeam] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        // Don't fetch if no ID
        if (!id) {
            setIsLoading(false);
            return;
        }

        const fetchTeam = async () => {
            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            try {
                setIsLoading(true);
                setError(null);
                abortControllerRef.current = new AbortController();

                const data = await teamService.getTeam(id);

                // Only update state if component is still mounted
                    setTeam(data);

            } catch (err) {
                if (err.name !== 'AbortError' && mountedRef.current) {
                    setError(err.message || 'Failed to fetch team');
                    console.error('Error fetching team:', err);
                }
            } finally {
                // if (mountedRef.current) {
                //     setIsLoading(false);
                // }
            }
        };

        fetchTeam();

        // Cleanup function
        return () => {
            mountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [id]);

    const refetch = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            setError(null);
            const data = await teamService.getTeam(id);
            if (mountedRef.current) {
                setTeam(data);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message || 'Failed to fetch team');
                console.error('Error fetching team:', err);
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    return {
        team,
        isLoading,
        error,
        refetch
    };
};

// Hook to fetch joined teams (tournaments)
export const useJoinedTeam = (id) => {
    const [joinedTeam, setJoinedTeam] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        if (!id) {
            setIsLoading(false);
            return;
        }

        const fetchJoinedTeam = async () => {
            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            try {
                setIsLoading(true);
                setError(null);
                abortControllerRef.current = new AbortController();

                const data = await teamService.getJoinedTeam(id);

                // Only update if mounted
                if (mountedRef.current) {
                    setJoinedTeam(data || []);
                }
            } catch (err) {
                // Handle gracefully - don't break parent component
                if (err.name !== 'AbortError' && mountedRef.current) {
                    console.warn('Tournament data fetch failed (non-critical):', err.message);
                    setJoinedTeam([]);
                    setError(err.message);
                }
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        fetchJoinedTeam();

        // Cleanup
        return () => {
            mountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [id]);

    const refetch = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const data = await teamService.getJoinedTeam(id);
            if (mountedRef.current) {
                setJoinedTeam(data || []);
                setError(null);
            }
        } catch (err) {
            if (mountedRef.current) {
                console.warn('Tournament refetch failed:', err.message);
                setJoinedTeam([]);
                setError(err.message);
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    return {
        joinedTeam,
        isLoading,
        error,
        refetch
    };
};

// Hook to fetch team analytics
export const useTeamAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const fetchAnalytics = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await teamService.getTeamAnalytics();

                if (mountedRef.current) {
                    setAnalytics(data);
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err.message || 'Failed to fetch analytics');
                    console.error('Error fetching team analytics:', err);
                }
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        fetchAnalytics();

        return () => {
            mountedRef.current = false;
        };
    }, []);

    const refetch = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await teamService.getTeamAnalytics();
            if (mountedRef.current) {
                setAnalytics(data);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message || 'Failed to fetch analytics');
                console.error('Error fetching team analytics:', err);
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    return {
        analytics,
        isLoading,
        error,
        refetch
    };
};
export const useTeamBookings = (teamId, filters = {}) => {
    const [bookings, setBookings] = useState({ results: [], count: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        if (!teamId) {
            setIsLoading(false);
            setBookings({ results: [], count: 0 });
            return;
        }

        const fetchTeamBookings = async () => {
            // Cancel previous request if it exists
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            try {
                setIsLoading(true);
                setError(null);
                abortControllerRef.current = new AbortController();

                const data = await teamService.getTeamBookings(teamId, filters);

                // Only update state if component is still mounted
                if (mountedRef.current) {
                    setBookings(data);
                }
            } catch (err) {
                if (err.name !== 'AbortError' && mountedRef.current) {
                    setError(err.message || 'Failed to fetch team bookings');
                    console.error('Error fetching team bookings:', err);
                    // Set empty results on error
                    setBookings({ results: [], count: 0 });
                }
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        fetchTeamBookings();

        // Cleanup function
        return () => {
            mountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [teamId, JSON.stringify(filters)]);

    const refetch = async () => {
        if (!teamId) return;

        try {
            setIsLoading(true);
            setError(null);
            const data = await teamService.getTeamBookings(teamId, filters);
            if (mountedRef.current) {
                setBookings(data);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message || 'Failed to fetch team bookings');
                console.error('Error fetching team bookings:', err);
                setBookings({ results: [], count: 0 });
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    return {
        bookings,
        isLoading,
        error,
        refetch
    };
};

// Hook to fetch team tournaments
export const useTeamTournaments = (teamId, params = {}) => {
    const [tournaments, setTournaments] = useState({ results: [], count: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        if (!teamId) {
            setIsLoading(false);
            setTournaments({ results: [], count: 0 });
            return;
        }

        const fetchTeamTournaments = async () => {
            // Cancel previous request if it exists
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            try {
                setIsLoading(true);
                setError(null);
                abortControllerRef.current = new AbortController();

                const data = await teamService.getTeamTournaments(teamId, params);

                // Only update state if component is still mounted
                if (mountedRef.current) {
                    setTournaments(data);
                }
            } catch (err) {
                if (err.name !== 'AbortError' && mountedRef.current) {
                    setError(err.message || 'Failed to fetch team tournaments');
                    console.error('Error fetching team tournaments:', err);
                    // Set empty results on error
                    setTournaments({ results: [], count: 0 });
                }
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        fetchTeamTournaments();

        // Cleanup function
        return () => {
            mountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [teamId, JSON.stringify(params)]);

    const refetch = async () => {
        if (!teamId) return;

        try {
            setIsLoading(true);
            setError(null);
            const data = await teamService.getTeamTournaments(teamId, params);
            if (mountedRef.current) {
                setTournaments(data);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message || 'Failed to fetch team tournaments');
                console.error('Error fetching team tournaments:', err);
                setTournaments({ results: [], count: 0 });
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    return {
        tournaments,
        isLoading,
        error,
        refetch
    };
};