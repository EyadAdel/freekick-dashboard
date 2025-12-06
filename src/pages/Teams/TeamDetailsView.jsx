// pages/Teams/TeamDetailView.jsx
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
    MoreVertical,
    Phone,
    Trophy,
    Users,
    Shield,
    Clock,
    User,
    Award,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

// ============================================================================
// PAGINATION COMPONENT
// ============================================================================

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
// TEAM DETAIL VIEW
// ============================================================================

const TeamDetailView = ({ team: initialTeam, onBack, onRefresh }) => {
    const teamId = initialTeam?.id;
    const { team: fetchedTeam, isLoading: isFetchingDetails } = useTeam(teamId);
    const { joinedTeam, isLoading: isLoadingJoined } = useJoinedTeam(teamId);
    const { handleEmailClick, handleWhatsAppClick } = useContact();

    // Team bookings hook
    const [bookingFilters, setBookingFilters] = useState({
        start_time__date: new Date().toISOString().split('T')[0],
        status: 'all'
    });

    // Team tournaments hook
    const { bookings: teamBookings, isLoading: bookingsLoading } = useTeamBookings(teamId, bookingFilters);
    const { tournaments: teamTournaments, isLoading: tournamentsLoading } = useTeamTournaments(teamId);

    const team = fetchedTeam || initialTeam;
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Booking filters
    const [bookingDate, setBookingDate] = useState(new Date());
    const [bookingStatus, setBookingStatus] = useState('all');

    // Tournament pagination
    const [currentTournamentPage, setCurrentTournamentPage] = useState(1);
    const tournamentsPerPage = 5;

    // Update booking filters when date or status changes
    useEffect(() => {
        const formattedDate = bookingDate.toISOString().split('T')[0];
        setBookingFilters({
            start_time__date: formattedDate,
            status: bookingStatus === 'all' ? undefined : bookingStatus
        });
    }, [bookingDate, bookingStatus]);

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
    const paginatedTournaments = useMemo(() => {
        const allTournaments = teamTournaments?.results || [];
        const startIndex = (currentTournamentPage - 1) * tournamentsPerPage;
        const endIndex = startIndex + tournamentsPerPage;
        return allTournaments.slice(startIndex, endIndex);
    }, [teamTournaments, currentTournamentPage]);

    const totalTournamentPages = Math.ceil((teamTournaments?.results || []).length / tournamentsPerPage);

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
        return `${num >= 0 ? '' : '-'}AED ${Math.abs(num).toLocaleString()}`;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            confirmed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Confirmed' },
            pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
            cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' }
        };
        const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    const getTournamentStatusBadge = (status) => {
        const statusColors = {
            won: 'bg-green-100 text-green-700',
            qualify: 'bg-yellow-100 text-yellow-700',
            lost: 'bg-red-100 text-red-700',
            ongoing: 'bg-blue-100 text-blue-700',
            upcoming: 'bg-purple-100 text-purple-700',
            completed: 'bg-gray-100 text-gray-700',
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-gray-100 text-gray-700'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
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

    const getStatusColor = (isActive) => {
        return isActive
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const handleSuspend = async () => {
        try {
            const confirmed = await showConfirm({
                title: "Suspend Team",
                text: "Are you sure you want to suspend this team? Members won't be able to participate in tournaments.",
                confirmButtonText: "Yes, suspend team",
                cancelButtonText: "Cancel",
                icon: "warning"
            });

            if (confirmed) {
                setIsActionLoading(true);
                await teamService.suspendTeam(team.id);
                toast.success('Team suspended successfully');
                if (onRefresh) onRefresh();
                if (onBack) onBack();
            }
        } catch (err) {
            toast.error('Failed to suspend team: ' + err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleReactivate = async () => {
        try {
            const confirmed = await showConfirm({
                title: "Reactivate Team",
                text: "Are you sure you want to reactivate this team?",
                confirmButtonText: "Yes, reactivate",
                cancelButtonText: "Cancel",
                icon: "info"
            });

            if (confirmed) {
                setIsActionLoading(true);
                await teamService.reactivateTeam(team.id);
                toast.success('Team reactivated successfully');
                if (onRefresh) onRefresh();
                if (onBack) onBack();
            }
        } catch (err) {
            toast.error('Failed to reactivate team: ' + err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white mx-4 rounded-xl">
                <div className="mx-auto px-4 sm:px-4 lg:py-3 py-1">
                    <div className="flex flex-col items-start justify-between gap-2">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-primary-700 hover:text-primary-600 transition-colors"
                            >
                                <ArrowIcon direction="left" size="lg" />
                                <span className="font-medium">Back to Teams</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto px-4 sm:px-4 py-4 sm:py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column - Team Profile */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:sticky lg:top-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-900 text-base sm:text-lg">Team Profile</h3>
                                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            {/* Team Logo */}
                            <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-gray-100">
                                <div className="relative mb-4">
                                    {team.logo ? (
                                        <img
                                            src={team.logo}
                                            alt={team.name}
                                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-100 shadow-md"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-100 flex items-center justify-center border-4 border-gray-100 shadow-md">
                                            <Shield size={32} className="text-primary-600" />
                                        </div>
                                    )}
                                </div>

                                <h4 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">
                                    {team.name}
                                </h4>
                                <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${getStatusColor(team.is_active)}`}>
                                    {team.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>

                            {/* Team Information */}
                            <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                                <h4 className="font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">
                                    Team Details
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Shield size={16} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">Team ID</p>
                                            <p className="text-xs sm:text-sm text-gray-900">
                                                TM{String(team.id).padStart(5, '0')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Calendar size={16} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">Created</p>
                                            <p className="text-xs sm:text-sm text-gray-900">
                                                {formatDate(team.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Users size={16} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">Members</p>
                                            <p className="text-xs sm:text-sm text-gray-900">
                                                {team.number_of_members || 0} Players
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Trophy size={16} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">Tournaments</p>
                                            <p className="text-xs sm:text-sm text-gray-900">
                                                {team.num_of_tournaments || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Team Leader Info */}
                            {team.team_leader && (
                                <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                                    <h4 className="font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">
                                        Team Leader
                                    </h4>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        {team.team_leader.image ? (
                                            <img
                                                src={team.team_leader.image}
                                                alt={team.team_leader.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                                <User size={20} className="text-primary-600" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 text-sm">
                                                {team.team_leader.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {team.team_leader.email || 'No email'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="space-y-3">
                                {team.team_leader?.email && (
                                    <button
                                        onClick={handleCreatorEmail}
                                        className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                    >
                                        <Mail size={16} />
                                        Email Leader
                                    </button>
                                )}
                                {team.team_leader?.phone && (
                                    <button
                                        onClick={handleCreatorWhatsApp}
                                        className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                    >
                                        <Phone size={16} />
                                        WhatsApp
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Team Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Team Header Info */}
                        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="flex-1 w-full">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                            {team.name}
                                        </h1>
                                        <span className={`w-fit px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${getStatusColor(team.is_active)}`}>
                                            {team.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                    <div className="text-left flex flex-wrap gap-4 text-xs sm:text-sm text-gray-500">
                                        <p>ID: TM{String(team.id).padStart(5, '0')}</p>
                                        <p>Created: {formatDate(team.created_at)}</p>
                                        <p>Type: {team.private ? '🔒 Private' : '🌐 Public'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team Stats */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="bg-primary-50 p-4 m-4 gap-5 rounded-xl">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <h3 className="text-xs font-semibold text-gray-500 mb-1">Members</h3>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {team.number_of_members || 0}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <h3 className="text-xs font-semibold text-gray-500 mb-1">Matches</h3>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {team.num_of_matches || 0}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <h3 className="text-xs font-semibold text-gray-500 mb-1">Tournaments</h3>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {team.num_of_tournaments || 0}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <h3 className="text-xs font-semibold text-gray-500 mb-1">Points</h3>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {team.num_of_points || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bookings Section */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-primary-50 to-white border-b border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Team Bookings</h3>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Showing {filteredBookings.length} bookings for {formatDate(bookingDate)}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <ReusableDatePicker
                                        selectedDate={bookingDate}
                                        onDateChange={setBookingDate}
                                        disabled={bookingsLoading}
                                    />

                                    <select
                                        value={bookingStatus}
                                        onChange={(e) => setBookingStatus(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                                    <div className="space-y-4">
                                        {filteredBookings.map((booking) => (
                                            <div key={booking.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
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

                                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{booking.pitch?.translations?.name || booking.pitch_name || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{formatDateTime(booking.start_time)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Users className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{booking.max_players || 0} Players</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Award className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{booking.play_kind?.translations?.name || booking.play_type || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No bookings found for {formatDate(bookingDate)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tournaments Section */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-50 to-white border-b border-gray-100 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Tournaments</h3>
                                </div>
                            </div>

                            <div className="p-6">
                                {tournamentsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                                    </div>
                                ) : paginatedTournaments.length > 0 ? (
                                    <>
                                        <div className="space-y-4">
                                            {paginatedTournaments.map((tournament) => (
                                                <div key={tournament.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-semibold text-gray-900">{tournament.name}</h4>
                                                                    {getTournamentStatusBadge(tournament.status)}
                                                                </div>
                                                                <p className="text-sm text-gray-500">{tournament.subtitle || tournament.description || 'No description available'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                                                            <div className="text-sm">
                                                                <p className="text-gray-500 mb-1">Start Date</p>
                                                                <p className="font-medium text-gray-900">{formatDate(tournament.start_date)}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="text-gray-500 mb-1">Entry Fee</p>
                                                                <p className="font-bold text-primary-600">{formatAmount(tournament.entry_fee || 0)}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="text-gray-500 mb-1">Max Teams</p>
                                                                <p className="font-medium text-gray-900">{tournament.max_teams || 'N/A'}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="text-gray-500 mb-1">Format</p>
                                                                <p className="font-medium text-gray-900 capitalize">{tournament.scoring_system || tournament.format || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Pagination
                                            currentPage={currentTournamentPage}
                                            totalPages={totalTournamentPages}
                                            onPageChange={setCurrentTournamentPage}
                                        />
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No tournaments found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Members Section */}
                        {team.members && team.members.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-base">
                                    <Users size={18} className="text-primary-600" />
                                    Team Members ({team.members.length})
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {team.members.map((member, idx) => (
                                        <div key={idx} className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            {member.user_info?.image ? (
                                                <img
                                                    src={member.user_info.image}
                                                    alt={member.user_info.name}
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm mb-2"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold border-2 border-white shadow-sm mb-2 text-xl">
                                                    {member.name?.charAt(0)?.toUpperCase() || 'M'}
                                                </div>
                                            )}
                                            <p className="text-sm font-medium text-gray-900 truncate w-full">
                                                {member.user_info?.name || member.name}
                                            </p>
                                            {member.is_admin && (
                                                <span className="text-xs text-primary-600 font-medium">Admin</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-base">
                                    <Users size={18} className="text-primary-600" />
                                    Team Members (0)
                                </h4>
                                <div className="bg-gray-50 rounded-lg p-8 text-center">
                                    <Users size={48} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No members yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Team leader can invite players to join</p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex flex-col sm:flex-row gap-3">
                                {team.is_active ? (
                                    <button
                                        onClick={handleSuspend}
                                        disabled={isActionLoading}
                                        className="flex-1 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold disabled:opacity-50"
                                    >
                                        {isActionLoading ? 'Processing...' : 'Suspend Team'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleReactivate}
                                        disabled={isActionLoading}
                                        className="flex-1 px-4 py-3 bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-semibold disabled:opacity-50"
                                    >
                                        {isActionLoading ? 'Processing...' : 'Reactivate Team'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamDetailView;