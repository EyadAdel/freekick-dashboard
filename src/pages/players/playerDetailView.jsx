import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar,
    Phone,
    Trophy,
    User,
    Wallet,
    MapPin,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    AlertCircle,
    Award,
    ChevronLeft,
    ChevronRight,
    Globe,
} from "lucide-react";
import { usePlayer, usePlayerBookings, usePlayerTournaments, usePlayerTransactions, useUpdatePlayerStatus } from "../../hooks/usePlayers.js";
import { useContact } from "../../hooks/useContact.js";
import { ReusableDatePicker } from "../../components/common/ReusableDatePicker.jsx";
import PlayerPoints from "./PlayerPoints.jsx";
import { toast } from "react-toastify";
import { playerService } from "../../services/players/playerService.js";
import {showConfirm} from "../../components/showConfirm.jsx";
import MainTable from "../../components/MainTable.jsx";
import ArrowIcon from "../../components/common/ArrowIcon.jsx";

// ============================================================================
// PAGINATION COMPONENT
// ============================================================================

const BookingCard = ({ booking }) => {
    const getStatusBadge = (status, acceptedByPitchOwner) => {
        // Determine the status to display
        let displayStatus = status?.toLowerCase();

        // If pitch owner has accepted, show as confirmed
        if (acceptedByPitchOwner && displayStatus !== 'cancelled') {
            displayStatus = 'confirmed';
        }

        const statusConfig = {
            confirmed: {
                color: 'bg-green-100 text-green-700',
                icon: CheckCircle,
                label: 'Confirmed'
            },
            pending: {
                color: 'bg-yellow-100 text-yellow-700',
                icon: Clock,
                label: 'Pending'
            },
            cancelled: {
                color: 'bg-red-100 text-red-700',
                icon: XCircle,
                label: 'Cancelled'
            },
            matched: {
                color: 'bg-blue-100 text-blue-700',
                icon: Users,
                label: 'Matched'
            }
        };

        const config = statusConfig[displayStatus] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Calculate match status based on players
    const getMatchStatus = () => {
        if (!booking.max_players) return 'Waiting for players...';

        const currentPlayers = booking.team_player || 0;
        const neededPlayers = booking.max_players - currentPlayers;

        if (neededPlayers <= 0) {
            return 'Match Full';
        }

        return `${neededPlayers} more players needed`;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Booking ID Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                    Booking ID: <span className="text-gray-900">{booking.id}</span>
                </span>
                {getStatusBadge(booking.status, booking.accepted_by_pitch_owner)}
            </div>

            {/* Main Content */}
            <div className="p-4">
                <div className="flex justify-between items-center w-full gap-3 mb-4">
                    {/* Match Status Section */}
                    <div className="flex gap-2 items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900">
                                {booking.play_kind?.translations?.name || 'Match'}
                            </h3>
                            {/*<p className="text-sm text-gray-600">*/}
                            {/*    {getMatchStatus()}*/}
                            {/*</p>*/}
                            {booking.max_players && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {booking.team_player || 0} / {booking.max_players} players
                                </p>
                            )}
                            <div className="flex text-xs items-center gap-4">
                                {booking.is_private ? (
                                    <span className="flex items-center gap-1 text-gray-400">
                                    <Lock className="w-3 h-3" />
                                    Private
                                </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-gray-400">
                                    <Globe className="w-3 h-3" />
                                    Public
                                </span>
                                )}

                                {booking.code && (
                                    <span className="flex items-center gap-1 text-gray-400">
                                    <Key className="w-3 h-3" />
                                    Code: {booking.code}
                                </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location Info */}
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                                {booking.pitch?.translations?.name || 'Venue'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {booking.pitch?.venue?.city || 'Location'}
                            </p>
                        </div>
                    </div>

                    {/* Time Info */}
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                                {formatDate(booking.start_time)}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatTime(booking.start_time)}
                            </p>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                        <p className="text-xl font-bold text-emerald-600">
                            {booking.total_price} AED
                        </p>
                        {booking.split_payment && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                Split payment
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
        const pages = [];
        const showEllipsis = totalPages > 7;

        if (!showEllipsis) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft className="w-5 h-5 text-primary-600" />
            </button>

            {getPageNumbers().map((page, idx) => (
                page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === page
                                ? 'bg-primary-500 text-white'
                                : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                        {page}
                    </button>
                )
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronRight className="w-5 h-5 text-primary-600" />
            </button>
        </div>
    );
};

// ============================================================================
// PLAYER DETAIL VIEW
// ============================================================================

const PlayerDetailView = ({ player: initialPlayer, onBack, onRefresh }) => {
    const playerId = initialPlayer?.id || 1;

    // ALL HOOKS MUST BE DECLARED FIRST - BEFORE ANY CONDITIONAL RETURNS
    const {
        player,
        isLoading: isFetchingDetails,
        refetch: refetchPlayer,
        error: playerError
    } = usePlayer(playerId);

    // Booking filters state
    const [bookingFilters, setBookingFilters] = useState({
        start_time__date: new Date().toISOString().split('T')[0],
        status: 'all'
    });

    // Use the hook with filters
    const {
        bookings,
        isLoading: bookingsLoading,
        error: bookingsError,
        refetch: refetchBookings
    } = usePlayerBookings(playerId, bookingFilters);

    const {
        tournaments,
        isLoading: tournamentsLoading,
        error: tournamentsError
    } = usePlayerTournaments(playerId);

    const {
        transactions,
        isLoading: transactionsLoading,
        error: transactionsError
    } = usePlayerTransactions(playerId);

    const { handleWhatsAppClick } = useContact();
    const { mutate: updateStatus, isLoading: isUpdatingStatus } = useUpdatePlayerStatus();

    // Booking filters
    const [bookingDate, setBookingDate] = useState(new Date());
    const [bookingStatus, setBookingStatus] = useState('all');

    // Tournament state
    const [tournamentSearch, setTournamentSearch] = useState('');
    const [tournamentFilters, setTournamentFilters] = useState({});
    const [tournamentSort, setTournamentSort] = useState({ key: 'start_date', direction: 'desc' });
    const [isUpdating, setIsUpdating] = useState(false);

    // Tournament pagination
    const [currentTournamentPage, setCurrentTournamentPage] = useState(1);
    const tournamentsPerPage = 5;

    // Transaction pagination
    const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
    const transactionsPerPage = 5;

    // Update booking filters when date or status changes
    useEffect(() => {
        const formattedDate = bookingDate.toISOString().split('T')[0];
        setBookingFilters({
            start_time__date: formattedDate,
            status: bookingStatus === 'all' ? undefined : bookingStatus
        });
    }, [bookingDate, bookingStatus]);

    // Handle errors
    useEffect(() => {
        if (playerError) {
            toast.error(`Failed to load player: ${playerError.message}`);
        }
        if (bookingsError) {
            toast.error(`Failed to load bookings: ${bookingsError.message}`);
        }
        if (tournamentsError) {
            toast.error(`Failed to load tournaments: ${tournamentsError.message}`);
        }
        if (transactionsError) {
            toast.error(`Failed to load transactions: ${transactionsError.message}`);
        }
    }, [playerError, bookingsError, tournamentsError, transactionsError]);

    const currentPlayer = player || initialPlayer || {
        id: 1,
        name: 'Ali Raheem',
        user_code: 'ALI001',
        phone: '+971501234567',
        date_of_birth: '1996-10-20',
        wallet_balance: 2890,
        num_of_points: 25000,
        num_of_booking: 12,
        num_of_tournaments: 3,
        is_active: true,
        image: null
    };

    // Filtered bookings
    const filteredBookings = useMemo(() => {
        return bookings?.results || [];
    }, [bookings]);

    // Paginated tournaments
    const paginatedTournaments = useMemo(() => {
        const allTournaments = tournaments?.results || [];
        const startIndex = (currentTournamentPage - 1) * tournamentsPerPage;
        const endIndex = startIndex + tournamentsPerPage;
        return allTournaments.slice(startIndex, endIndex);
    }, [tournaments, currentTournamentPage]);

    const totalTournamentPages = Math.ceil((tournaments?.results || []).length / tournamentsPerPage);

    // Paginated transactions
    const paginatedTransactions = useMemo(() => {
        const allTransactions = transactions || [];
        const startIndex = (currentTransactionPage - 1) * transactionsPerPage;
        const endIndex = startIndex + transactionsPerPage;
        return allTransactions.slice(startIndex, endIndex);
    }, [transactions, currentTransactionPage]);

    const totalTransactionPages = Math.ceil((transactions || []).length / transactionsPerPage);

    // Tournament columns configuration for MainTable
    const tournamentColumns = useMemo(() => [
        {
            header: 'Tournament',
            accessor: 'name',
            sortable: true,
            sortKey: 'name',
            render: (tournament) => (
                <div className="flex items-center gap-3">
                    {tournament.images && tournament.images.length > 0 ? (
                        <img
                            src={`https://pub-f8c5de66602c4f6f91311c6fd40e1794.r2.dev/${tournament.images[0].image}`}
                            alt={tournament.name}
                            className="w-10 h-10 rounded-lg object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/40';
                            }}
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-primary-600" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{tournament.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                            {tournament.subtitle || tournament.description || 'No description'}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            sortable: true,
            sortKey: 'status',
            align: 'center',
            render: (tournament) => (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        tournament.status === 'ongoing' ? 'bg-yellow-100 text-yellow-700' :
                            tournament.status === 'completed' ? 'bg-green-100 text-green-700' :
                                tournament.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    tournament.status === 'won' ? 'bg-purple-100 text-purple-700' :
                                        tournament.status === 'qualify' ? 'bg-green-100 text-green-700' :
                                            tournament.status === 'lost' ? 'bg-gray-100 text-gray-700' :
                                                'bg-gray-100 text-gray-700'
                }`}>
                    {tournament.status ? tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1) : 'N/A'}
                </span>
            )
        },
        {
            header: 'Start Date',
            accessor: 'start_date',
            sortable: true,
            sortKey: 'start_date',
            align: 'center',
            render: (tournament) => (
                <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-600">
                        {formatDate(tournament.start_date)}
                    </span>
                    <span className="text-xs text-gray-400">
                        {tournament.start_time || 'N/A'}
                    </span>
                </div>
            )
        },
        {
            header: 'End Date',
            accessor: 'end_date',
            sortable: true,
            sortKey: 'end_date',
            align: 'center',
            render: (tournament) => (
                <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-600">
                        {formatDate(tournament.end_date)}
                    </span>
                    <span className="text-xs text-gray-400">
                        {tournament.end_time || 'N/A'}
                    </span>
                </div>
            )
        },
        {
            header: 'Format',
            accessor: 'scoring_system',
            sortable: true,
            sortKey: 'scoring_system',
            align: 'center',
            render: (tournament) => (
                <span className="text-sm text-gray-600 capitalize">
                    {tournament.scoring_system?.replace(/_/g, ' ') || 'N/A'}
                </span>
            )
        },
        {
            header: 'Participants',
            accessor: 'joined_users',
            align: 'center',
            render: (tournament) => (
                <div className="flex items-center justify-center">
                    <div className="flex -space-x-2">
                        {tournament.joined_users?.slice(0, 3).map((user, idx) => (
                            <div key={idx} className="relative">
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name}
                                        className="w-6 h-6 rounded-full border-2 border-white"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.parentElement.innerHTML =
                                                `<div class="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">
                                                ${user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>`;
                                        }}
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">
                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {tournament.joined_users && tournament.joined_users.length > 3 && (
                        <span className="text-xs text-gray-500 ml-1">
                            +{tournament.joined_users.length - 3}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Entry Fee',
            accessor: 'entry_fee',
            sortable: true,
            sortKey: 'entry_fee',
            align: 'right',
            render: (tournament) => (
                <span className="text-sm font-semibold text-primary-600">
                    {formatAmount(tournament.entry_fee || 0)}
                </span>
            )
        }
    ], []);

    // Filter and sort tournaments
    const filteredTournaments = useMemo(() => {
        let tournamentList = tournaments?.results || [];

        // Apply search filter
        if (tournamentSearch) {
            tournamentList = tournamentList.filter(t =>
                t.name?.toLowerCase().includes(tournamentSearch.toLowerCase()) ||
                (t.subtitle && t.subtitle.toLowerCase().includes(tournamentSearch.toLowerCase())) ||
                (t.description && t.description.toLowerCase().includes(tournamentSearch.toLowerCase()))
            );
        }

        // Apply status filter
        if (tournamentFilters.status) {
            tournamentList = tournamentList.filter(t =>
                t.status === tournamentFilters.status
            );
        }

        // Apply format filter
        if (tournamentFilters.scoring_system) {
            tournamentList = tournamentList.filter(t =>
                t.scoring_system === tournamentFilters.scoring_system
            );
        }

        // Apply sorting
        if (tournamentSort.key) {
            tournamentList.sort((a, b) => {
                const aValue = a[tournamentSort.key];
                const bValue = b[tournamentSort.key];

                if (tournamentSort.key === 'start_date' || tournamentSort.key === 'end_date') {
                    const aDate = new Date(aValue || 0);
                    const bDate = new Date(bValue || 0);
                    return tournamentSort.direction === 'asc'
                        ? aDate - bDate
                        : bDate - aDate;
                }

                if (tournamentSort.key === 'entry_fee') {
                    const aNum = parseFloat(aValue) || 0;
                    const bNum = parseFloat(bValue) || 0;
                    return tournamentSort.direction === 'asc'
                        ? aNum - bNum
                        : bNum - aNum;
                }

                // String comparison for other fields
                const aStr = String(aValue || '').toLowerCase();
                const bStr = String(bValue || '').toLowerCase();
                const comparison = aStr.localeCompare(bStr);
                return tournamentSort.direction === 'asc' ? comparison : -comparison;
            });
        }

        return tournamentList;
    }, [tournaments, tournamentSearch, tournamentFilters, tournamentSort]);

    // UTILITY FUNCTIONS
    const formatDate = (dateTime) => {
        if (!dateTime) return 'N/A';
        return new Date(dateTime).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return 'N/A';
        return new Date(dateTime).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return 'N/A';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };


    const getTournamentStatusBadge = (status) => {
        const statusColors = {
            won: 'bg-green-100 text-green-700',
            qualify: 'bg-yellow-100 text-yellow-700',
            lost: 'bg-red-100 text-red-700',
            ongoing: 'bg-blue-100 text-blue-700',
            upcoming: 'bg-purple-100 text-purple-700'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    const formatAmount = (amount) => {
        if (amount === undefined || amount === null) return 'AED 0';
        const num = parseFloat(amount);
        if (isNaN(num)) return 'AED 0';
        return `${num >= 0 ? '' : '-'}AED ${Math.abs(num).toLocaleString()}`;
    };

    const getAmountColor = (amount) => {
        if (amount === undefined || amount === null) return 'text-gray-600';
        const num = parseFloat(amount);
        return num >= 0 ? 'text-green-600' : 'text-red-600';
    };

    // EVENT HANDLERS
    const handleStatusToggle = async (newStatus) => {
        try {
            const confirmed = await showConfirm({
                title: `Are you sure?`,
                text: `Do you want to ${currentPlayer.is_active ? 'Suspend' : 'activate'} this player?`,
                confirmButtonText: `Yes, ${currentPlayer.is_active ? 'Suspend' : 'Activate'}`,
                cancelButtonText: "Cancel",
                icon: currentPlayer.is_active ? 'warning' : 'info'
            });

            if (confirmed) {
                await playerService.updatePlayerStatus(playerId, newStatus);
                toast.success(`Player ${newStatus ? 'activated' : 'suspended'} successfully`);
                refetchPlayer();
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Status update error:', error);
            toast.error(`Failed to update player status: ${error.message || 'Unknown error'}`);
        }
    };

    const handleRefreshBookings = () => {
        refetchBookings();
    };

    const handleTournamentSort = (key, direction) => {
        setTournamentSort({ key, direction });
    };

    const handleTournamentPageChange = (page) => {
        setCurrentTournamentPage(page);
    };

    const handleTournamentSearch = (searchTerm) => {
        setTournamentSearch(searchTerm);
    };

    const handleTournamentFilterChange = (filters) => {
        setTournamentFilters(filters);
    };

    // NOW SAFE TO HAVE CONDITIONAL RETURNS - ALL HOOKS ABOVE
    if (isFetchingDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading player details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="mx-auto px-3  py-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        <ArrowIcon size={'lg'}/>
                        <span className="font-medium">Back to Players</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto  py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {/* Left Column - Player Profile Card */}
                    <div className="col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                            {/* Profile Header */}
                            <div className="bg-primary-50 p-6 text-white">
                                <div className="flex flex-col items-center">
                                    <div className="w-28 h-28 rounded-full backdrop-blur-sm flex items-center justify-center mb-3 border-2">
                                        {currentPlayer.image ? (
                                            <img
                                                className="w-full h-full rounded-full object-cover"
                                                src={currentPlayer.image}
                                                alt={currentPlayer.name}
                                            />
                                        ) : (
                                            <User className="w-12 h-12 text-gray-400" />
                                        )}
                                    </div>
                                    <h2 className="text-xl text-gray-900 font-bold">{currentPlayer.name}</h2>
                                    <p className="text-gray-400 text-sm">{currentPlayer.user_code}</p>
                                    <div className="mt-3">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                                            currentPlayer.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                                        }`}>
                                            {currentPlayer.is_active ? 'Active' : 'Suspended'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary-600">{currentPlayer.num_of_points || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">Points</div>
                                </div>
                                <div className="text-center border-x border-gray-200">
                                    <div className="text-2xl font-bold text-primary-600">{currentPlayer.num_of_booking || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">Bookings</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary-600">{currentPlayer.num_of_tournaments || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">Tournaments</div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm font-medium">{currentPlayer.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Birth Date</p>
                                        <p className="text-sm font-medium">{formatDate(currentPlayer.date_of_birth)}</p>
                                        <p className="text-xs text-gray-400">Age: {calculateAge(currentPlayer.date_of_birth)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                        <Wallet className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Wallet Balance</p>
                                        <p className="text-lg font-bold text-primary-600">{formatAmount(currentPlayer.wallet_balance)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-6 pt-0 space-y-2">
                                <button
                                    onClick={() => handleWhatsAppClick(currentPlayer.phone, `Hello ${currentPlayer.name}!`)}
                                    disabled={!currentPlayer.phone}
                                    className="w-full px-4 py-2.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-600 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Phone className="w-4 h-4" />
                                    WhatsApp
                                </button>

                                {currentPlayer.is_active ? (
                                    <button
                                        disabled={isUpdatingStatus}
                                        onClick={() => handleStatusToggle(false)}
                                        className="w-full px-4 py-2.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUpdatingStatus ? 'Updating...' : 'Suspend Player'}
                                    </button>
                                ) : (
                                    <button
                                        disabled={isUpdatingStatus}
                                        onClick={() => handleStatusToggle(true)}
                                        className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUpdatingStatus ? 'Updating...' : 'Reactivate Player'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Content */}
                    <div className="lg:col-span-2 2xl:col-span-3 space-y-6">
                        {/* Bookings Section */}
                        <div className="bg-white px-2 rounded-lg shadow-sm border border-gray-100">
                            <div className="p-3 lg:px-5   flex flex-wrap justify-between items-center border-b border-gray-100">
                                <h3 className="text-lg  font-bold text-gray-900 mb-4">Bookings</h3>
                                <div className="order-3  xl:w-fit flex justify-center xl:order-2">
                                    <ReusableDatePicker
                                        selectedDate={bookingDate}
                                        onDateChange={setBookingDate}
                                        disabled={bookingsLoading}
                                    />
                                </div>
                                <div className="order-2 xl:order-3 mb-1">
                                    <select
                                        value={bookingStatus}
                                        onChange={(e) => setBookingStatus(e.target.value)}
                                        className="lg:px-4 px-2 py-1 lg:py-2 lg:pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                            backgroundPosition: 'right 0.4rem center',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: '1.5em 1.5em',
                                            paddingRight: '1.5rem'
                                        }}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="pending">Pending</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-6">
                                {bookingsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                                    </div>
                                ) : filteredBookings.length > 0 ? (
                                    <div className="space-y-3">
                                        {filteredBookings.map((booking,index) => (
                                            <BookingCard key={index} booking={booking} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No bookings found for {formatDate(bookingDate)}</p>
                                        <p className="text-sm text-gray-400 mt-1">Try selecting a different date or status</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tournaments Section */}
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                            <div className="lg:p-6 p-2 mb-2">
                                    <div className="flex   items-center justify-between gap-4">
                                        <h3 className="lg:text-lg font-bold text-gray-900">Tournaments</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Total: {(tournaments?.results || []).length} tournaments
                                        </p>
                                    </div>
                            </div>

                            {tournamentsLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                                </div>
                            ) : filteredTournaments.length > 0 ? (
                                <MainTable
                                    columns={tournamentColumns}
                                    data={filteredTournaments}
                                    currentPage={currentTournamentPage}
                                    itemsPerPage={tournamentsPerPage}
                                    totalItems={filteredTournaments.length}
                                    onPageChange={handleTournamentPageChange}
                                    onSearch={handleTournamentSearch}
                                    onFilterChange={handleTournamentFilterChange}
                                    onSort={handleTournamentSort}
                                    sortConfig={tournamentSort}
                                    searchPlaceholder="Search tournaments..."
                                    showSearch={true}
                                    showFilters={true}
                                    filters={[
                                        {
                                            key: 'status',
                                            label: 'Status',
                                            type: 'select',
                                            options: [
                                                { value: 'upcoming', label: 'Upcoming' },
                                                { value: 'ongoing', label: 'Ongoing' },
                                                { value: 'completed', label: 'Completed' },
                                                { value: 'cancelled', label: 'Cancelled' },
                                                { value: 'won', label: 'Won' },
                                                { value: 'qualify', label: 'Qualified' },
                                                { value: 'lost', label: 'Lost' }
                                            ]
                                        },
                                        {
                                            key: 'scoring_system',
                                            label: 'Format',
                                            type: 'select',
                                            options: [
                                                { value: 'round_robin', label: 'Round Robin' },
                                                { value: 'knockout', label: 'Knockout' },
                                                { value: 'double_elimination', label: 'Double Elimination' },
                                                { value: 'single_elimination', label: 'Single Elimination' }
                                            ]
                                        }
                                    ]}
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No tournaments found</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {tournamentSearch || tournamentFilters.status || tournamentFilters.scoring_system
                                            ? 'Try adjusting your search or filters'
                                            : 'This player hasn\'t participated in any tournaments yet'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Player Points Component */}
                        <PlayerPoints playerId={playerId} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerDetailView;