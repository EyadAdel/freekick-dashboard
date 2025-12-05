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
    ChevronRight
} from "lucide-react";
import { usePlayer, usePlayerBookings, usePlayerTournaments, usePlayerTransactions, useUpdatePlayerStatus } from "../../hooks/usePlayers.js";
import {useContact} from "../../hooks/useContact.js";
import {ReusableDatePicker} from "../../components/common/ReusableDatePicker.jsx";

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
// PLAYER DETAIL VIEW
// ============================================================================

const PlayerDetailView = ({ player: initialPlayer, onBack, onRefresh }) => {
    const playerId = initialPlayer?.id || 1;

    const { player, isLoading: isFetchingDetails, refetch: refetchPlayer } = usePlayer(playerId);

    // IMPORTANT: Update the usePlayerBookings hook call to accept filters
    // We'll modify the hook to accept date filters
    const [bookingFilters, setBookingFilters] = useState({
        start_time__date: new Date().toISOString().split('T')[0], // Initial date
        status: 'all'
    });

    const { bookings, isLoading: bookingsLoading } = usePlayerBookings(playerId, bookingFilters);
    const { tournaments, isLoading: tournamentsLoading } = usePlayerTournaments(playerId);
    const { transactions, isLoading: transactionsLoading } = usePlayerTransactions(playerId);
    const { handleWhatsAppClick } = useContact();
    const { mutate: updateStatus, isLoading: isUpdatingStatus } = useUpdatePlayerStatus();
    console.log(tournaments,'kkkk')
    // Booking filters
    const [bookingDate, setBookingDate] = useState(new Date());
    const [bookingStatus, setBookingStatus] = useState('all');

    // Update booking filters when date or status changes
    useEffect(() => {
        const formattedDate = bookingDate.toISOString().split('T')[0];
        setBookingFilters({
            start_time__date: formattedDate,
            status: bookingStatus === 'all' ? undefined : bookingStatus
        });
    }, [bookingDate, bookingStatus]);

    // Tournament pagination
    const [currentTournamentPage, setCurrentTournamentPage] = useState(1);
    const tournamentsPerPage = 5;

    // Transaction pagination
    const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
    const transactionsPerPage = 5;

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
        is_active: true
    };

    // Filtered bookings - now handled by API
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
            lost: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    const formatAmount = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return 'AED 0';
        return `${num >= 0 ? '' : '-'}${Math.abs(num).toLocaleString()} AED`;
    };

    const getAmountColor = (amount) => {
        const num = parseFloat(amount);
        return num >= 0 ? 'text-green-600' : 'text-red-600';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="mx-auto px-4 sm:px-6 py-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Players</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Player Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                            {/* Profile Header */}
                            <div className="bg-primary-50  p-6 text-white">
                                <div className="flex flex-col items-center">
                                    <div className="w-28 h-28 rounded-full  backdrop-blur-sm flex items-center justify-center mb-3 border-2">
                                        {currentPlayer.image ?
                                        <img className={'w-full w-28 h-28 rounded-full'} src={currentPlayer.image} alt={currentPlayer.name}/>
                                        :                                        <User className="w-12 h-12 " />
                                        }
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
                                    <div className="text-2xl font-bold text-primary-600">{currentPlayer.num_of_points}</div>
                                    <div className="text-xs text-gray-500 mt-1">Points</div>
                                </div>
                                <div className="text-center border-x border-gray-200">
                                    <div className="text-2xl font-bold text-primary-600">{currentPlayer.num_of_booking}</div>
                                    <div className="text-xs text-gray-500 mt-1">Bookings</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary-600">{currentPlayer.num_of_tournaments}</div>
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
                                        <p className="text-sm font-medium">{currentPlayer.phone}</p>
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
                                    className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    WhatsApp
                                </button>

                                {currentPlayer.is_active ? (
                                    <button
                                        disabled={isUpdatingStatus}
                                        className="w-full px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        Suspend Player
                                    </button>
                                ) : (
                                    <button
                                        disabled={isUpdatingStatus}
                                        className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        Reactivate Player
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Bookings Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-primary-50 to-white border-b border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Bookings</h3>
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
                                                        <p className="text-sm text-gray-500">Match #{booking.match}</p>
                                                    </div>
                                                    <p className="text-lg font-bold text-primary-600">{formatAmount(booking.total_price)}</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{booking.pitch?.translations?.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{formatDateTime(booking.start_time)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Users className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{booking.max_players} Players</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Award className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{booking.play_kind?.translations?.name}</span>
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
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                                                                <p className="text-sm text-gray-500">{tournament.subtitle}</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                                                            <div className="text-sm">
                                                                <p className="text-gray-500 mb-1">Start Date</p>
                                                                <p className="font-medium text-gray-900">{formatDate(tournament.start_date)}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="text-gray-500 mb-1">Entry Fee</p>
                                                                <p className="font-bold text-primary-600">{formatAmount(tournament.entry_fee)}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="text-gray-500 mb-1">Max Teams</p>
                                                                <p className="font-medium text-gray-900">{tournament.max_teams}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="text-gray-500 mb-1">Format</p>
                                                                <p className="font-medium text-gray-900 capitalize">{tournament.scoring_system}</p>
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

                        {/* Transactions Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-50 to-white border-b border-gray-100 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                        <Wallet className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Transactions</h3>
                                </div>
                            </div>

                            <div className="p-6">
                                {transactionsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                                    </div>
                                ) : paginatedTransactions.length > 0 ? (
                                    <>
                                        <div className="space-y-3">
                                            {paginatedTransactions.map((transaction, idx) => (
                                                <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{transaction.description}</p>
                                                            <p className="text-sm text-gray-500">{formatDateTime(transaction.created_at)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-lg font-bold ${getAmountColor(transaction.amount)}`}>
                                                                {formatAmount(transaction.amount)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">#{transaction.id}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Pagination
                                            currentPage={currentTransactionPage}
                                            totalPages={totalTransactionPages}
                                            onPageChange={setCurrentTransactionPage}
                                        />
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No transactions found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerDetailView;