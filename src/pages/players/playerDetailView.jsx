import React, {useEffect, useMemo, useState} from 'react';
import { Calendar, Trophy, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import BookingCard from '../../components/players/BookingCard.jsx';
import PlayerProfileCard from '../../components/players/PlayerProfileCard.jsx';
import PlayerPoints from './PlayerPoints';
import MainTable from '../../components/MainTable';
import ArrowIcon from '../../components/common/ArrowIcon';
import { ReusableDatePicker } from '../../components/common/ReusableDatePicker';

import { usePlayer, usePlayerBookings, usePlayerTournaments, useUpdatePlayerStatus } from '../../hooks/usePlayers.js';
import { playerService } from '../../services/players/playerService';
import { showConfirm } from '../../components/showConfirm';

import { formatDate, calculateAge, formatAmount } from '../../hooks/players/formatters.js';
import { getTournamentColumns } from '../../hooks/players/tournamentColumns.jsx';
import {useLocation, useNavigate} from "react-router-dom";
import {useDispatch} from "react-redux";
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";

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
    const { t, i18n } = useTranslation(['players', 'common', 'tournament']);
    const location = useLocation();
    const navigate = useNavigate();
    const playerFromState = location.state?.player;
    const playerId = playerFromState?.id || 1;

    const [bookingDate, setBookingDate] = useState(new Date());
    const [bookingStatus, setBookingStatus] = useState('all');
    const [tournamentSearch, setTournamentSearch] = useState('');
    const [tournamentFilters, setTournamentFilters] = useState({});
    const [tournamentSort, setTournamentSort] = useState({
        key: 'start_date',
        direction: 'desc'
    });
    const [currentTournamentPage, setCurrentTournamentPage] = useState(1);
    const tournamentsPerPage = 5;

    const bookingFilters = useMemo(() => {
        const formattedDate = bookingDate.toISOString().split('T')[0];
        return {
            start_time__date: formattedDate,
            status: bookingStatus === 'all' ? undefined : bookingStatus
        };
    }, [bookingDate, bookingStatus]);

    const { player, isLoading: isFetchingDetails, refetch: refetchPlayer } = usePlayer(playerId);
    const { bookings, isLoading: bookingsLoading, refetch: refetchBookings } = usePlayerBookings(playerId, bookingFilters);
    const { tournaments, isLoading: tournamentsLoading } = usePlayerTournaments(playerId);
    const { mutate: updateStatus, isLoading: isUpdatingStatus } = useUpdatePlayerStatus();

    const currentPlayer = player || playerFromState || getDefaultPlayer();
    const filteredBookings = useMemo(() => bookings?.results || [], [bookings]);
    const tournamentColumns = getTournamentColumns(t);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Player'));
    }, [dispatch]);
    const handleStatusToggle = async (newStatus) => {
        try {
            const confirmed = await showConfirm({
                title: t('players:playersDetail.confirm.title'),
                text: currentPlayer.is_active
                    ? t('players:playersDetail.confirm.suspend')
                    : t('players:playersDetail.confirm.activate'),
                confirmButtonText: currentPlayer.is_active
                    ? t('players:playersDetail.buttons.suspend')
                    : t('players:playersDetail.buttons.activate'),
                cancelButtonText: t('common:buttons.cancel'),
                icon: currentPlayer.is_active ? 'warning' : 'info'
            });

            if (confirmed) {
                await playerService.updatePlayerStatus(playerId, newStatus);
                toast.success(
                    newStatus
                        ? t('players:playersDetail.status.activated')
                        : t('players:playersDetail.status.suspended')
                );
                refetchPlayer();
            }
        } catch (error) {
            console.error('Status update error:', error);
            toast.error(t('players:playersDetail.status.updateError'));
        }
    };

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

    const handleBack = () => {
        navigate('/players');
    };

    if (isFetchingDetails) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header onBack={handleBack} />

            <div className="mx-auto py-6">
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
                            bookingDate={bookingDate}
                            bookingStatus={bookingStatus}
                            onDateChange={setBookingDate}
                            onStatusChange={setBookingStatus}
                            onRefresh={refetchBookings}
                        />

                        <TournamentsSection
                            tournaments={tournaments}
                            isLoading={tournamentsLoading}
                            columns={tournamentColumns}
                            filters={getTranslatedFilters()}
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

    function getTranslatedFilters() {
        return [
            {
                key: 'status',
                label: t('players:playersDetail.filters.status.label'),
                type: 'select',
                options: [
                    { value: 'upcoming', label: t('players:playersDetail.filters.status.options.upcoming') },
                    { value: 'ongoing', label: t('players:playersDetail.filters.status.options.ongoing') },
                    { value: 'completed', label: t('players:playersDetail.filters.status.options.completed') },
                    { value: 'cancelled', label: t('players:playersDetail.filters.status.options.cancelled') },
                    { value: 'won', label: t('players:playersDetail.filters.status.options.won') },
                    { value: 'qualify', label: t('players:playersDetail.filters.status.options.qualify') },
                    { value: 'lost', label: t('players:playersDetail.filters.status.options.lost') }
                ]
            },
            {
                key: 'scoring_system',
                label: t('players:playersDetail.filters.format.label'),
                type: 'select',
                options: [
                    { value: 'round_robin', label: t('players:playersDetail.filters.format.options.roundRobin') },
                    { value: 'knockout', label: t('players:playersDetail.filters.format.options.knockout') },
                    { value: 'double_elimination', label: t('players:playersDetail.filters.format.options.doubleElimination') },
                    { value: 'single_elimination', label: t('players:playersDetail.filters.format.options.singleElimination') }
                ]
            }
        ];
    }
};

const Header = ({ onBack }) => {
    const { t } = useTranslation(['players', 'common']);

    return (
        <div className="bg-white shadow-sm">
            <div className="mx-auto px-4 sm:px-6 py-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                >
                    <ArrowIcon size="lg" />
                    <span className="font-medium">{t('players:playersDetail.buttons.backToPlayers')}</span>
                </button>
            </div>
        </div>
    );
};

const LoadingSpinner = () => {
    const { t } = useTranslation('players');

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('playersDetail.loading')}</p>
            </div>
        </div>
    );
};

const BookingsSection = ({
                             bookings,
                             isLoading,
                             bookingDate,
                             bookingStatus,
                             onDateChange,
                             onStatusChange,
                             onRefresh
                         }) => {
    const { t } = useTranslation(['players', 'common']);

    return (
        <div className="bg-white px-2 rounded-lg shadow-sm border border-gray-100">
            <div className="p-3 lg:px-5 flex flex-wrap justify-between items-center border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900">{t('players:playersDetail.sections.bookings')}</h3>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-1 text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                        title={t('players:playersDetail.buttons.refresh')}
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
                        <span className="sr-only">{t('players:playersDetail.loadingBookings')}</span>
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

const BookingStatusSelect = ({ value, onChange, disabled }) => {
    const { t } = useTranslation('players');

    return (
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
            <option value="all">{t('playersDetail.bookingStatus.all')}</option>
            <option value="confirmed">{t('playersDetail.bookingStatus.confirmed')}</option>
            <option value="pending">{t('playersDetail.bookingStatus.pending')}</option>
            <option value="cancelled">{t('playersDetail.bookingStatus.cancelled')}</option>
        </select>
    );
};

const NoBookingsMessage = ({ date }) => {
    const { t } = useTranslation('players');

    return (
        <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
                {t('playersDetail.noBookings', { date: formatDate(date) })}
            </p>
            <p className="text-sm text-gray-400 mt-1">{t('playersDetail.noBookingsHint')}</p>
        </div>
    );
};

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
    const { t } = useTranslation('players');
    const tournamentData = tournaments?.results || [];

    // Get the count - check multiple possible sources
    const tournamentCount = tournaments?.count || tournaments?.total || tournamentData.length || 0;

    return (
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
            <div className="lg:p-6 p-2 mb-2">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="lg:text-lg font-bold text-gray-900">
                        {t('playersDetail.sections.tournaments')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('playersDetail.tournaments.total', { count: tournamentCount })}
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
                    searchPlaceholder={t('playersDetail.searchTournaments')}
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

const NoTournamentsMessage = () => {
    const { t } = useTranslation('players');

    return (
        <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('playersDetail.noTournaments')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('playersDetail.noTournamentsHint')}</p>
        </div>
    );
};

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