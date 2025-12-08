import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

export const usePlayerData = (playerId) => {
    const [bookingDate, setBookingDate] = useState(new Date());
    const [bookingStatus, setBookingStatus] = useState('all');
    const [tournamentSearch, setTournamentSearch] = useState('');
    const [tournamentFilters, setTournamentFilters] = useState({});
    const [tournamentSort, setTournamentSort] = useState({ key: 'start_date', direction: 'desc' });
    const [currentTournamentPage, setCurrentTournamentPage] = useState(1);
    const [currentTransactionPage, setCurrentTransactionPage] = useState(1);

    const tournamentsPerPage = 5;
    const transactionsPerPage = 5;

    // These would come from your existing hooks - simplified for example
    const {
        player,
        isLoading: isFetchingDetails,
        error: playerError,
        refetch: refetchPlayer
    } = {}; // Replace with your actual hook

    const bookingFilters = useMemo(() => ({
        start_time__date: bookingDate.toISOString().split('T')[0],
        status: bookingStatus === 'all' ? undefined : bookingStatus
    }), [bookingDate, bookingStatus]);

    useEffect(() => {
        // Handle errors
        const errors = [playerError /* add other errors */];
        errors.forEach(error => {
            if (error) {
                toast.error(`Failed to load data: ${error.message}`);
            }
        });
    }, [playerError]);

    const handleTournamentSort = (key, direction) => {
        setTournamentSort({ key, direction });
    };

    const handleTournamentPageChange = (page) => {
        setCurrentTournamentPage(page);
    };

    const handleTournamentSearch = (searchTerm) => {
        setTournamentSearch(searchTerm);
        setCurrentTournamentPage(1); // Reset to first page on search
    };

    const handleTournamentFilterChange = (filters) => {
        setTournamentFilters(filters);
        setCurrentTournamentPage(1); // Reset to first page on filter
    };

    return {
        // State
        bookingDate,
        bookingStatus,
        tournamentSearch,
        tournamentFilters,
        tournamentSort,
        currentTournamentPage,
        currentTransactionPage,
        tournamentsPerPage,
        transactionsPerPage,
        bookingFilters,

        // Actions
        setBookingDate,
        setBookingStatus,
        setTournamentSearch,
        setTournamentFilters,
        setTournamentSort,
        setCurrentTournamentPage,
        setCurrentTransactionPage,
        handleTournamentSort,
        handleTournamentPageChange,
        handleTournamentSearch,
        handleTournamentFilterChange,

        // Player data
        player,
        isFetchingDetails,
        refetchPlayer
    };
};