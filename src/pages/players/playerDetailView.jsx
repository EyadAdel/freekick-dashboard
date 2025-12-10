import React, {useMemo, useState} from 'react';
import { Calendar, Trophy, RefreshCw } from 'lucide-react'; // Added RefreshCw
import { toast } from 'react-toastify';

// Components
import BookingCard from '../../components/players/BookingCard.jsx';
import PlayerProfileCard from '../../components/players/PlayerProfileCard.jsx';
import PlayerPoints from './PlayerPoints';
import MainTable from '../../components/MainTable';
import ArrowIcon from '../../components/common/ArrowIcon';
import { ReusableDatePicker } from '../../components/common/ReusableDatePicker';

// Hooks
import { usePlayer, usePlayerBookings, usePlayerTournaments, useUpdatePlayerStatus } from '../../hooks/usePlayers.js';
import { playerService } from '../../services/players/playerService';
import { showConfirm } from '../../components/showConfirm';

// Utils
import { formatDate, calculateAge, formatAmount } from '../../hooks/players/formatters.js'; // Fixed path
import { getTournamentColumns } from '../../hooks/players/tournamentColumns.jsx';
import {useLocation, useNavigate} from "react-router-dom"; // Fixed path

// Constants
const TOURNAMENT_FILTERS = [
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
];

const PlayerDetailView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const playerFromState = location.state?.player;

    const playerId = playerFromState?.id || 1;

    // Booking state management
    const [bookingDate, setBookingDate] = useState(new Date());
    const [bookingStatus, setBookingStatus] = useState('all');

    // Tournament state management
    const [tournamentSearch, setTournamentSearch] = useState('');
    const [tournamentFilters, setTournamentFilters] = useState({});
    const [tournamentSort, setTournamentSort] = useState({
        key: 'start_date',
        direction: 'desc'
    });
    const [currentTournamentPage, setCurrentTournamentPage] = useState(1);
    const tournamentsPerPage = 5;
    // Calculate booking filters
    const bookingFilters = useMemo(() => {
        const formattedDate = bookingDate.toISOString().split('T')[0];
        return {
            start_time__date: formattedDate,
            status: bookingStatus === 'all' ? undefined : bookingStatus
        };
    }, [bookingDate, bookingStatus]);

    // Use hooks with proper filters
    const { player, isLoading: isFetchingDetails, refetch: refetchPlayer } = usePlayer(playerId);
    const { bookings, isLoading: bookingsLoading, refetch: refetchBookings } = usePlayerBookings(playerId, bookingFilters);
    const { tournaments, isLoading: tournamentsLoading } = usePlayerTournaments(playerId);
    const { mutate: updateStatus, isLoading: isUpdatingStatus } = useUpdatePlayerStatus();

    const currentPlayer = player || playerFromState || getDefaultPlayer();
    const filteredBookings = useMemo(() => bookings?.results || [], [bookings]);
    const tournamentColumns = getTournamentColumns();

    // Debug logging to track bookings
    console.log('Bookings debug:', {
        playerId,
        bookingFilters,
        bookingsData: bookings,
        filteredBookingsCount: filteredBookings.length,
        isLoading: bookingsLoading
    });

    const handleStatusToggle = async (newStatus) => {
        try {
            const confirmed = await showConfirm({
                title: 'Are you sure?',
                text: `Do you want to ${currentPlayer.is_active ? 'Suspend' : 'activate'} this player?`,
                confirmButtonText: `Yes, ${currentPlayer.is_active ? 'Suspend' : 'Activate'}`,
                cancelButtonText: 'Cancel',
                icon: currentPlayer.is_active ? 'warning' : 'info'
            });

            if (confirmed) {
                await playerService.updatePlayerStatus(playerId, newStatus);
                toast.success(`Player ${newStatus ? 'activated' : 'suspended'} successfully`);
                refetchPlayer();
                onRefresh?.();
            }
        } catch (error) {
            console.error('Status update error:', error);
            toast.error(`Failed to update player status: ${error.message || 'Unknown error'}`);
        }
    };

    // Tournament handlers
    const handleTournamentSearch = (searchTerm) => {
        setTournamentSearch(searchTerm);
        setCurrentTournamentPage(1);
    };

    const handleTournamentFilterChange = (filters) => {
        setTournamentFilters(filters);
        setCurrentTournamentPage(1);
    };

    const handleTournamentSort = (key, direction) => {
        setTournamentSort({ key, direction });
    };

    const handleTournamentPageChange = (page) => {
        setCurrentTournamentPage(page);
    };

    if (isFetchingDetails) {
        return <LoadingSpinner />;
    }
    const handleBack = () => {
        navigate('/players');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header onBack={handleBack} />

            <div className="mx-auto  py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    <div className="col-span-1">
                        <PlayerProfileCard
                            player={currentPlayer}
                            onStatusToggle={handleStatusToggle}
                            isUpdatingStatus={isUpdatingStatus}
                            formatDate={formatDate}
                            calculateAge={calculateAge}
                            formatAmount={formatAmount}
                        />
                    </div>

                    <div className="lg:col-span-2 2xl:col-span-3 space-y-6">
                        <BookingsSection
                            bookings={filteredBookings}
                            isLoading={bookingsLoading}
                            bookingDate={bookingDate} // ✅ Use local state
                            bookingStatus={bookingStatus} // ✅ Use local state
                            onDateChange={setBookingDate} // ✅ Use local setter
                            onStatusChange={setBookingStatus} // ✅ Use local setter
                            onRefresh={refetchBookings} // ✅ Add refresh handler
                        />

                        <TournamentsSection
                            tournaments={tournaments}
                            isLoading={tournamentsLoading}
                            columns={tournamentColumns}
                            filters={TOURNAMENT_FILTERS}
                            sortConfig={tournamentSort}
                            currentPage={currentTournamentPage}
                            itemsPerPage={tournamentsPerPage}
                            onSearch={handleTournamentSearch}
                            onFilterChange={handleTournamentFilterChange}
                            onSort={handleTournamentSort}
                            onPageChange={handleTournamentPageChange}
                        />

                        <PlayerPoints playerId={playerId} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const Header = ({ onBack }) => (
    <div className="bg-white shadow-sm">
        <div className="mx-auto px-4 sm:px-6 py-4">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
                <ArrowIcon size="lg" />
                <span className="font-medium">Back to Players</span>
            </button>
        </div>
    </div>
);

const LoadingSpinner = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading player details...</p>
        </div>
    </div>
);

const BookingsSection = ({
                             bookings,
                             isLoading,
                             bookingDate,
                             bookingStatus,
                             onDateChange,
                             onStatusChange,
                             onRefresh
                         }) => {
    console.log('BookingsSection render:', {
        bookingsCount: bookings?.length || 0,
        isLoading
    });

    return (
        <div className="bg-white px-2 rounded-lg shadow-sm border border-gray-100">
            <div className="p-3 lg:px-5 flex flex-wrap justify-between items-center border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900">Bookings</h3>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-1 text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                        title="Refresh bookings"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="order-3 xl:w-fit flex justify-center xl:order-2">
                    <ReusableDatePicker
                        selectedDate={bookingDate}
                        onDateChange={onDateChange}
                        disabled={isLoading}
                    />
                </div>
                <div className="order-2 xl:order-3 mb-1">
                    <BookingStatusSelect
                        value={bookingStatus}
                        onChange={onStatusChange}
                        disabled={isLoading}
                    />
                </div>
            </div>
            <div className="p-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                        <span className="sr-only">Loading bookings...</span>
                    </div>
                ) : bookings.length > 0 ? (
                    <div className="space-y-3">
                        {bookings.map((booking, index) => (
                            <BookingCard key={booking.id || `booking-${index}`} booking={booking} />
                        ))}
                    </div>
                ) : (
                    <NoBookingsMessage date={bookingDate} />
                )}
            </div>
        </div>
    );
};

const BookingStatusSelect = ({ value, onChange, disabled }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="lg:px-4 px-2 py-1 lg:py-2 lg:pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        style={{
            backgroundImage: disabled
                ? 'none'
                : `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
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
);

const NoBookingsMessage = ({ date }) => (
    <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No bookings found for {formatDate(date)}</p>
        <p className="text-sm text-gray-400 mt-1">Try selecting a different date or status</p>
    </div>
);

const TournamentsSection = ({
                                tournaments,
                                isLoading,
                                columns,
                                filters,
                                sortConfig,
                                currentPage,
                                itemsPerPage,
                                onSearch,
                                onFilterChange,
                                onSort,
                                onPageChange
                            }) => {
    const tournamentData = tournaments?.results || [];

    return (
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
            <div className="lg:p-6 p-2 mb-2">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="lg:text-lg font-bold text-gray-900">Tournaments</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Total: {tournamentData.length} tournaments
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                </div>
            ) : tournamentData.length > 0 ? (
                <MainTable
                    columns={columns}
                    data={tournamentData}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={tournamentData.length}
                    onPageChange={onPageChange}
                    onSearch={onSearch}
                    onFilterChange={onFilterChange}
                    onSort={onSort}
                    sortConfig={sortConfig}
                    searchPlaceholder="Search tournaments..."
                    showSearch={true}
                    showFilters={true}
                    filters={filters}
                />
            ) : (
                <NoTournamentsMessage />
            )}
        </div>
    );
};

const NoTournamentsMessage = () => (
    <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No tournaments found</p>
        <p className="text-sm text-gray-400 mt-1">
            This player hasn't participated in any tournaments yet
        </p>
    </div>
);

// Helper function
const getDefaultPlayer = () => ({
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
});

export default PlayerDetailView;