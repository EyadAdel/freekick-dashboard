import React, { useState, useEffect, useMemo } from 'react';
import { useTeam, useJoinedTeam, useTeamBookings, useTeamTournaments } from "../../hooks/useTeams.js";
import { useContact } from "../../hooks/useContact.js";
import { showConfirm } from "../../components/showConfirm.jsx";
import { teamService } from "../../services/Teams/TeamService.js";
import { toast } from "react-toastify";
import ArrowIcon from "../../components/common/ArrowIcon.jsx";
import { ReusableDatePicker } from "../../components/common/ReusableDatePicker.jsx";
import {
    Calendar,
    Mail,
    MapPin,
    Phone,
    Trophy,
    Users,
    Shield,
    Clock,
    Award,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Activity,
    Star,
    Lock,
    Globe,
    Edit2,
    Save,
    X,
    Power
} from "lucide-react";
import MainTable from "../../components/MainTable.jsx";
import TeamPointsTab from "./TeamPoints.jsx";


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

const TeamDetailView = ({ team: initialTeam, onBack, onRefresh }) => {
    const teamId = initialTeam?.id;
    const { team: fetchedTeam, isLoading: isFetchingDetails } = useTeam(teamId);
    const { handleEmailClick, handleWhatsAppClick } = useContact();

    // State for edit modal

    // Team bookings hook
    const [bookingFilters, setBookingFilters] = useState({
        start_time__date: new Date().toISOString().split('T')[0],
        status: 'all'
    });

    // Team tournaments hook
    const { bookings: teamBookings, isLoading: bookingsLoading } = useTeamBookings(teamId, bookingFilters);
    const { tournaments: teamTournaments, isLoading: tournamentsLoading } = useTeamTournaments(teamId);

    const team = fetchedTeam || initialTeam;

    // Booking filters
    const [bookingDate, setBookingDate] = useState(new Date());
    const [bookingStatus, setBookingStatus] = useState('all');

    // Tournament pagination
    const [currentTournamentPage, setCurrentTournamentPage] = useState(1);
    const tournamentsPerPage = 10;

    // Update booking filters when date or status changes
    useEffect(() => {
        const formattedDate = bookingDate.toISOString().split('T')[0];
        setBookingFilters({
            start_time__date: formattedDate,
            status: bookingStatus === 'all' ? undefined : bookingStatus
        });
    }, [bookingDate, bookingStatus]);
    const [tournamentSearch, setTournamentSearch] = useState('');
    const [tournamentFilters, setTournamentFilters] = useState({});
    const [tournamentSort, setTournamentSort] = useState({ key: 'start_date', direction: 'desc' });
    const [isUpdating, setIsUpdating] = useState(false);

    // Tournament columns configuration for MainTable
// Update the tournament columns configuration
    const tournamentColumns = [
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
            accessor: 'is_active',
            sortable: true,
            sortKey: 'is_active',
            align: 'center',
            render: (tournament) => (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    tournament.is_active
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-red-100 text-red-700'
                }`}>
                {tournament.is_active ? 'Active' : 'Inactive'}
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
                    {tournament.start_time}
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
                    {tournament.end_time}
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
                {tournament.scoring_system?.replace('_', ' ') || 'N/A'}
            </span>
            )
        },
        {
            header: 'Participants',
            accessor: 'joined_user_data',
            align: 'center',
            render: (tournament) => (
                <div className="flex items-center justify-center">
                    <div className="flex -space-x-2">
                        {tournament.joined_user_data?.slice(0, 3).map((user, idx) => (
                            <div key={user.id} className="relative">
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name}
                                        className="w-6 h-6 rounded-full border-2 border-white"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {tournament.joined_user_data && tournament.joined_user_data.length > 3 && (
                        <span className="text-xs text-gray-500 ml-1">
                        +{tournament.joined_user_data.length - 3}
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
    ];

    // Filter and sort tournaments (client-side filtering for example)
    const filteredTournaments = useMemo(() => {
        let tournaments = teamTournaments?.results || [];

        // Apply search filter
        if (tournamentSearch) {
            tournaments = tournaments.filter(t =>
                t.name.toLowerCase().includes(tournamentSearch.toLowerCase()) ||
                (t.subtitle && t.subtitle.toLowerCase().includes(tournamentSearch.toLowerCase())) ||
                (t.description && t.description.toLowerCase().includes(tournamentSearch.toLowerCase()))
            );
        }

        // Apply status filter
        if (tournamentFilters.status) {
            tournaments = tournaments.filter(t =>
                t.status === tournamentFilters.status
            );
        }

        // Apply format filter
        if (tournamentFilters.scoring_system) {
            tournaments = tournaments.filter(t =>
                t.scoring_system === tournamentFilters.scoring_system
            );
        }

        // Apply sorting
        if (tournamentSort.key) {
            tournaments.sort((a, b) => {
                const aValue = a[tournamentSort.key];
                const bValue = b[tournamentSort.key];

                if (tournamentSort.key === 'start_date') {
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
                const comparison = String(aValue || '').localeCompare(String(bValue || ''));
                return tournamentSort.direction === 'asc' ? comparison : -comparison;
            });
        }

        return tournaments;
    }, [teamTournaments, tournamentSearch, tournamentFilters, tournamentSort]);

    // Calculate paginated tournaments
    const paginatedTournaments = useMemo(() => {
        const startIndex = (currentTournamentPage - 1) * tournamentsPerPage;
        const endIndex = startIndex + tournamentsPerPage;
        return filteredTournaments.slice(startIndex, endIndex);
    }, [filteredTournaments, currentTournamentPage]);

    const totalTournamentPages = Math.ceil(filteredTournaments.length / tournamentsPerPage);

    // Handler functions
    const handleTournamentSearch = (searchTerm) => {
        setTournamentSearch(searchTerm);
        setCurrentTournamentPage(1); // Reset to first page on search
    };

    const handleTournamentFilterChange = (filters) => {
        setTournamentFilters(filters);
        setCurrentTournamentPage(1); // Reset to first page on filter
    };

    const handleTournamentSort = (sortKey, direction) => {
        setTournamentSort({ key: sortKey, direction });
    };

    const handleTournamentPageChange = (page) => {
        setCurrentTournamentPage(page);
    };

    if (!team && isFetchingDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading team details...</p>
                </div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">No team data available</p>
                    {onBack && (
                        <button onClick={onBack} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg">
                            Go Back
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Filtered bookings - handled by API
    const filteredBookings = useMemo(() => {
        return teamBookings?.results || [];
    }, [teamBookings]);

    // Paginated tournaments



    const formatDate = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
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

    const formatAmount = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return 'AED 0';
        return `AED ${Math.abs(num).toLocaleString()}`;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            confirmed: { color: 'bg-primary-100 text-primary-700', label: 'Confirmed' },
            pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
            cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' }
        };
        const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                {config.label}
            </span>
        );
    };



    const handleCreatorEmail = () => {
        const email = team.team_leader?.email;
        const creatorName = team.team_leader?.name || 'Team Leader';
        const subject = `Team ${team.name} - ID: ${String(team.id).padStart(5, '0')}`;
        const body = `Dear ${creatorName},\n\nRegarding your team "${team.name}".\n\n`;
        handleEmailClick(email, subject, body);
    };

    const handleCreatorWhatsApp = () => {
        const phone = team.team_leader?.phone;
        const creatorName = team.team_leader?.name || 'Team Leader';
        const message = `Hello ${creatorName}! Regarding your team "${team.name}".`;
        handleWhatsAppClick(phone, message);
    };

    const handleUpdateTeam = async (updates) => {
        try {
            await teamService.updateTeam(team.id, updates);
            toast.success('Team updated successfully');
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error('Failed to update team: ' + error.message);
            throw error;
        }
    };
    const StatusToggle = ({ isActive, onToggle, disabled = false }) => {
        const handleToggle = async () => {
            const confirmed = await showConfirm({
                title: `Are you sure?`,
                text: `Do you want to ${isActive ? 'suspend' : 'activate'} this team?`,
                confirmButtonText: `Yes, ${isActive ? 'suspend' : 'Activate'}`,
                cancelButtonText: "Cancel",
                icon: isActive ? 'warning' : 'info'
            });

            if (confirmed) {
                onToggle(!isActive);
            }
        };

        return (
            <button
                onClick={handleToggle}
                disabled={disabled}
                className={`flex w-full text-center justify-center items-center  gap-2 px-2 py-1.5 rounded-lg font-medium text-sm transition-all ${
                    !isActive
                        ? 'bg-primary-500 text-white  hover:text-primary-700 hover:bg-white border border-primary-500'
                        : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                {!isActive ? (
                    <>
                        Activate team
                        <CheckCircle className="w-4 h-4" />
                    </>
                ) : (
                    <>
                        <XCircle className="w-4 h-4" />
                        Suspend team
                    </>
                )}
                {/*<Power className={`w-4 h-4 transition-transform ${disabled ? '' : 'hover:scale-110'}`} />*/}
            </button>
        );
    };

    const handleStatusToggle = async (newStatus) => {
        setIsUpdating(true);
        try {
            await teamService.updateTeam(team.id, { is_active: newStatus });
            toast.success(`Team ${newStatus ? 'activated' : 'deactivated'} successfully`);
            refetchTeam();
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error('Failed to update team status: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };
    return (
        <div className="min-h-screen xl:px-5  bg-gray-50">
            {/* Header */}
            <div className="bg-white ">
                <div className=" mx-auto  py-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                        <ArrowIcon size={'lg'}/>
                        Back to Teams
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className=" mx-auto py-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {/* Left Sidebar - Team Info */}

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                            {/* Profile Header with gradient background */}
                            <div className="bg-primary-50 p-6 text-white">
                                <div className="flex flex-col items-center">
                                    <div className="w-28 h-28 rounded-full backdrop-blur-sm flex items-center justify-center mb-3 border-2">
                                        {team.logo ? (
                                            <img
                                                className="w-full h-full rounded-full object-cover"
                                                src={team.logo}
                                                alt={team.name}
                                            />
                                        ) : (
                                            <Shield className="w-12 h-12 text-gray-400" />
                                        )}
                                    </div>
                                    <h2 className="text-xl text-gray-900 font-bold">{team.name}</h2>
                                    <p className="text-gray-400 text-sm">Team ID: {String(team.id).padStart(5, '0')}</p>
                                    <div className="mt-3 flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                        team.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                    }`}>
                        {team.is_active ? 'Active' : 'Inactive'}
                    </span>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                                            team.private
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-purple-500 text-white'
                                        }`}>
                        {team.private ? 'Private' : 'Public'}
                    </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Section */}
                            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary-600">{team.num_of_points || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">Points</div>
                                </div>
                                <div className="text-center border-x border-gray-200">
                                    <div className="text-2xl font-bold text-primary-600">{team.number_of_members || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">Members</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary-600">{team.num_of_tournaments || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">Tournaments</div>
                                </div>
                            </div>

                            {/* Additional Stats */}
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Matches Played</p>
                                        <p className="text-sm font-medium">{team.num_of_matches || 0}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Total Tournaments</p>
                                        <p className="text-sm font-medium">{team.num_of_tournaments || 0}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Team Members</p>
                                        <p className="text-sm font-medium">{team.number_of_members || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Team Leader Section */}
                            <div className="p-6 border-t border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                    Team Leader
                                </h4>
                                {team.team_leader && (
                                    <>
                                        <div className="flex items-center gap-3 mb-4">
                                            {team.team_leader.image ? (
                                                <img
                                                    src={team.team_leader.image}
                                                    alt={team.team_leader.name}
                                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                                                    {team.team_leader.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {team.team_leader.name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {team.team_leader.phone}
                                                </p>
                                            </div>
                                        </div>
                                        {team.team_leader?.phone && (
                                            <button
                                                onClick={handleCreatorWhatsApp}
                                                className="w-full px-4 py-2.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-600 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Phone className="w-4 h-4" />
                                                WhatsApp
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Actions Section */}
                            <div className="p-6 pt-0 space-y-2">
                                {team.is_active ? (
                                    <button
                                        disabled={isUpdating}
                                        onClick={() => handleStatusToggle(false)}
                                        className="w-full px-4 py-2.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUpdating ? 'Updating...' : 'Suspend Team'}
                                    </button>
                                ) : (
                                    <button
                                        disabled={isUpdating}
                                        onClick={() => handleStatusToggle(true)}
                                        className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUpdating ? 'Updating...' : 'Activate Team'}
                                    </button>
                                )}
                            </div>

                            {/* Created Date */}
                            <div className="p-6 pt-0">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Created {formatDate(team.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Right Content Area */}
                    <div className="lg:col-span-2 2xl:col-span-3 space-y-6">
                        {/* Bookings Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="p-3 px-5 w-full  flex flex-wrap justify-between items-center border-b border-gray-100">
                                <h3 className="text-lg w-48 font-bold text-gray-900 mb-4"> Bookings</h3>
                                <div className="order-3 w-full xl:w-fit  flex justify-center xl:order-2">
                                    <ReusableDatePicker
                                        selectedDate={bookingDate}
                                        onDateChange={setBookingDate}
                                        disabled={bookingsLoading}
                                    /></div>
                                <div className={'order-2 xl:order-3'}>
                                    <select
                                        value={bookingStatus}
                                        onChange={(e) => setBookingStatus(e.target.value)}
                                        className="px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                            backgroundPosition: 'right 0.5rem center',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: '1.5em 1.5em',
                                            paddingRight: '2.5rem'
                                        }}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="pending">Pending</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>                            </div>
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

                        {/* Tournaments Table */}
                        <div className="bg-white px-4 rounded-lg shadow-sm border border-gray-100">
                            <div className="pt-5 lg:px-6 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">Tournaments </h3>
                                <p className="text-sm text-gray-500 mt-1">Total : {filteredTournaments.length} tournaments</p>
                            </div>

                            {tournamentsLoading ? (
                                <div className="flex justify-center ">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                                </div>
                            ) : filteredTournaments.length > 0 ? (
                                <MainTable
                                    columns={tournamentColumns}
                                    data={paginatedTournaments}
                                    currentPage={currentTournamentPage}
                                    itemsPerPage={tournamentsPerPage}
                                    totalItems={filteredTournaments.length}
                                    onPageChange={handleTournamentPageChange}
                                    showSearch ={false}
                                    onSort={handleTournamentSort}
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No tournaments found</p>
                                    <p className="text-sm text-gray-400 mt-1">This team hasn't participated in any tournaments yet</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-white mt-5 rounded-lg shadow-sm border border-gray-100">
                            <div className="lg:px-6 p-4 flex justify-between items-center border-b border-gray-100">
                                <h3 className=" font-bold text-gray-900">Team Members</h3>
                                <p className="text-xs text-gray-500 mt-1">Total : {team.members?.length || 0} players</p>
                            </div>
                            <div className="p-6">
                                {team.members && team.members.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
                                        {team.members.map((member, idx) => (
                                            <div key={idx} className="relative flex  flex-col flex-wrap items-center text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-gray-100">
                                                {/* Index number in top-left corner */}
                                                <span className="absolute -top-4 -right-2 bg-primary-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {idx + 1}
                        </span>

                                                {member.user_info?.image ? (
                                                    <img
                                                        src={member.user_info.image}
                                                        alt={member.user_info.name}
                                                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md mb-1"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold  border-2 border-white shadow-md mb-1">
                                                        {(member.user_info?.name || member.name)?.charAt(0)?.toUpperCase() || 'P'}
                                                    </div>
                                                )}
                                                <p className="text-sm font-bold text-gray-900 truncate w-full">
                                                    {member.user_info?.name || member.name}
                                                </p>
                                                {/*<div className="mt-1">*/}
                                                {/*    {member.is_admin ? (*/}
                                                {/*        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">Admin</span>*/}
                                                {/*    ) : (*/}
                                                {/*        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Player</span>*/}
                                                {/*    )}*/}
                                                {/*</div>*/}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No team members yet</p>
                                        <p className="text-sm text-gray-400 mt-1">Team leader can invite players to join</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <TeamPointsTab teamId={teamId}/>
                    </div>
                </div>
            </div>


        </div>
    );
};
export  default TeamDetailView