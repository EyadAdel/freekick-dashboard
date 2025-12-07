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


// ============================================================================
// EDIT MODAL COMPONENT
// ============================================================================

// ============================================================================
// TEAM DETAIL VIEW
// ============================================================================
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
                text: `Do you want to ${isActive ? 'deactivate' : 'activate'} this team?`,
                confirmButtonText: `Yes, ${isActive ? 'Deactivate' : 'Activate'}`,
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
                        Active team
                        <CheckCircle className="w-4 h-4" />
                    </>
                ) : (
                    <>
                        <XCircle className="w-4 h-4" />
                        deactive team
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
                        <div className="bg-white rounded-xl shadow-md lg:sticky lg:top-6">
                            {/* Header with Status Toggle */}
                            {/*<div className="flex justify-between p-4 ">*/}
                            {/*    Team Profile*/}
                            {/*    <StatusToggle*/}
                            {/*        isActive={team.is_active}*/}
                            {/*        onToggle={handleStatusToggle}*/}
                            {/*        disabled={isUpdating}*/}
                            {/*    />*/}
                            {/*</div>*/}

                            {/* Team Logo & Name Section */}
                            <div className="relative pb-16">
                                {/* Background Banner */}
                                <div className="h-32 bg-primary-100 rounded-t-xl"></div>

                                {/* Logo - Positioned Half on Banner, Half Below */}
                                <div className="absolute left-1/2 -translate-x-1/2 top-16">
                                    {team.logo ? (
                                        <img
                                            src={team.logo}
                                            alt={team.name}
                                            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-primary-500 border-4 border-white shadow-lg flex items-center justify-center">
                                            <Shield className="w-14 h-14 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Team Info */}
                            <div className="px-6 pb-6 text-center border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">{team.name}</h2>
                                <div className={'flex gap-2 justify-center'}>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                                    team.private
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'bg-green-50 text-green-700'
                                }`}>
                {team.private ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                                    {team.private ? 'Private' : 'Public'}
            </span>
                                <button
                                    className={`flex w-fit text-center justify-center items-center  gap-2 px-2 py-1.5 rounded-lg font-medium text-sm transition-all ${
                                        team.is_active
                                            ? 'bg-primary-50 text-primary-700 px-3 rounded-xl'
                                            : 'bg-red-100 text-red-700 px-2 rounded-xl'
                                    } `}
                                >
                                {team.is_active ? 'Active' : 'Inactive'}
                                </button>
                                </div>

                            </div>

                            {/* Stats */}
                            <div className="p-6 space-y-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Members</span>
                                    </div>
                                    <span className="text-base font-bold text-gray-900">{team.number_of_members || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                            <Activity className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Matches</span>
                                    </div>
                                    <span className="text-base font-bold text-gray-900">{team.num_of_matches || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                            <Trophy className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Tournaments</span>
                                    </div>
                                    <span className="text-base font-bold text-gray-900">{team.num_of_tournaments || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                                            <Star className="w-4 h-4 text-yellow-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Points</span>
                                    </div>
                                    <span className="text-base font-bold text-gray-900">{team.num_of_points || 0}</span>
                                </div>
                            </div>

                            {/* Team Leader */}
                            {team.team_leader && (
                                <div className="lg:px-6 lg:py-4 p-2 ">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                        Team Leader
                                    </h4>
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
                                                {team.team_leader.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {/*{team.team_leader?.email && (*/}
                                        {/*    <button*/}
                                        {/*        onClick={handleCreatorEmail}*/}
                                        {/*        className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"*/}
                                        {/*    >*/}
                                        {/*        <Mail className="w-4 h-4" />*/}
                                        {/*        Email*/}
                                        {/*    </button>*/}
                                        {/*)}*/}
                                        {team.team_leader?.phone && (
                                            <button
                                                onClick={handleCreatorWhatsApp}
                                                className=" w-full px-3 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Phone className="w-4 h-4" />
                                                WhatsApp
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex w-full justify-between p-4 ">
                                <StatusToggle
                                    isActive={team.is_active}
                                    onToggle={handleStatusToggle}
                                    disabled={isUpdating}
                                />
                            </div>
                            {/* Created Date */}
                            <div className="p-6">
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
                                        {filteredBookings.map((booking) => (
                                            <div key={booking.id} className="border border-gray-100 rounded-lg p-4 hover:border-primary-300 transition-colors">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-gray-900">Booking #{booking.id}</h4>
                                                            {getStatusBadge(booking.status)}
                                                        </div>
                                                        <p className="text-sm text-gray-500">Match #{booking.match || 'N/A'}</p>
                                                    </div>
                                                    <p className="text-lg font-bold text-primary-600">{formatAmount(booking.total_price || 0)}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <MapPin className="w-4 h-4" />
                                                        {booking.pitch?.translations?.name || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Clock className="w-4 h-4" />
                                                        {formatDateTime(booking.start_time)}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Users className="w-4 h-4" />
                                                        {booking.max_players || 0} Players
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Award className="w-4 h-4" />
                                                        {booking.play_kind?.translations?.name || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
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