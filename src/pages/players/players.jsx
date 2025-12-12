import React, { useEffect, useState } from 'react';
import { useDispatch } from "react-redux";
import { usePlayers, usePlayerAnalytics } from "../../hooks/usePlayers.js";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import { ArrowLeft, User, Wallet, Calendar, Trophy, Phone, Mail } from "lucide-react";
import PlayerDetailView from "./playerDetailView.jsx";
import MainTable from "../../components/MainTable.jsx";
import {useNavigate} from "react-router-dom";
import { getImageUrl, isFullUrl, extractFilename } from "../../utils/imageUtils.js";
import { useTranslation } from 'react-i18next';

function Players() {
    const { t } = useTranslation('players');
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        order: 'asc'
    });
    const [filters, setFilters] = useState({});

    const itemsPerPage = 10;

    // Build API filters with pagination and sorting
    const apiFilters = {
        page: currentPage,
        page_limit: itemsPerPage,
        ...filters,
        ...(sortConfig.key && {
            ordering: getOrderingParam(sortConfig.key, sortConfig.order)
        })
    };

    // Fetch players with filters
    const { players: playersData, isLoading, error, refetch } = usePlayers(apiFilters);

    // Fetch analytics for stats cards
    const { analytics, isLoading: analyticsLoading } = usePlayerAnalytics();
    const navigate = useNavigate()

    useEffect(() => {
        dispatch(setPageTitle(t('playersPage.title')));
    }, [dispatch, t]);

    // Convert sort keys to API ordering field names
    function getOrderingParam(key, order) {
        const orderingMap = {
            'name': 'name',
            'id': 'id',
            'phone': 'phone',
            'email': 'email',
            'created_at': 'date_joined',
            'bookings': 'num_of_bookings',
            'wallet': 'wallet_balance',
            'status': 'is_active'
        };

        const field = orderingMap[key] || key;
        return order === 'desc' ? `-${field}` : field;
    }

    const getStatusBadge = (isActive) => {
        if (isActive) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {t('playersPage.active')}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {t('playersPage.inactive')}
            </span>
        );
    };

    const formatDate = (dateTime) => {
        if (!dateTime) return t('playersPage.noDate');
        const date = new Date(dateTime);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatPhone = (phone) => {
        if (!phone) return t('playersPage.noPhone');
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `+1 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        }
        return phone;
    };

    const formatWallet = (amount) => {
        if (amount === undefined || amount === null) return t('format.wallet', { amount: 0 });
        return t('format.wallet', { amount: amount.toLocaleString() });
    };

    const handleViewPlayer = (player) => {
        navigate(`/players/player-profile`, {
            state: {player:player}
        });
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedPlayer(null);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }
        setSortConfig({ key, order });
        setCurrentPage(1);
    };

    const columns = [
        {
            header: t('playersPage.player'),
            accessor: 'name',
            sortable: true,
            sortKey: 'name',
            render: (row) => (
                <div onClick={() => handleViewPlayer(row)} className="flex cursor-pointer items-center gap-3">
                    {row.image ? (
                        <img
                            src={getImageUrl(row.image)}
                            alt={t('icons.user')}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.querySelector('.fallback-avatar').style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div className={`w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center ${row.image ? 'hidden fallback-avatar' : ''}`}>
                        <User size={18} className="text-teal-600" />
                    </div>
                    <div>
                        <span className="font-medium text-gray-900 block">
                            {row.name || `${t('playersPage.player')} ${row.id}`}
                        </span>
                        <span className="text-xs text-gray-500">
                            {t('playersPage.playerId', { id: String(row.id).padStart(5, '0') })}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: t('playersPage.phone'),
            accessor: 'phone',
            sortable: true,
            sortKey: 'phone',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-gray-900">
                        {formatPhone(row.phone)}
                    </span>
                </div>
            )
        },
        {
            header: t('playersPage.email'),
            accessor: 'email',
            sortable: true,
            sortKey: 'email',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-gray-900 truncate max-w-[180px]">
                        {row.email || t('playersPage.noEmail')}
                    </span>
                </div>
            )
        },
        {
            header: t('playersPage.bookings'),
            accessor: 'num_of_bookings',
            sortable: true,
            sortKey: 'bookings',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                        {row.num_of_bookings || 0}
                    </span>
                </div>
            )
        },
        {
            header: t('playersPage.tournaments'),
            accessor: 'num_of_tournaments',
            sortable: true,
            sortKey: 'tournaments',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                        {row.num_of_tournaments || 0}
                    </span>
                </div>
            )
        },
        {
            header: t('playersPage.points'),
            accessor: 'num_of_points',
            sortable: true,
            sortKey: 'num_of_points',
            render: (row) => (
                <span className="text-gray-600">{row.num_of_points}</span>
            )
        },
        {
            header: t('playersPage.status'),
            accessor: 'is_active',
            sortable: true,
            sortKey: 'status',
            render: (row) => getStatusBadge(row.is_active)
        },
        {
            header: '',
            accessor: 'actions',
            align: 'center',
            sortable: false,
            render: (row) => (
                <button
                    onClick={() => handleViewPlayer(row)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={t('playersPage.viewDetails')}
                    title={t('playersPage.viewDetails')}
                >
                    <ArrowLeft size={18} className="rotate-180" />
                </button>
            )
        }
    ];

    const handleSearch = (searchTerm) => {
        setFilters(prev => ({ ...prev, search: searchTerm }));
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleRefresh = () => {
        refetch();
    };

    const playerData = playersData?.results || [];
    const totalItems = playersData?.count || 0;

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">{t('playersPage.error.loading')}</p>
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-2 text-sm underline hover:no-underline"
                    >
                        {t('playersPage.error.tryAgain')}
                    </button>
                </div>
            </div>
        );
    }

    if (viewMode === 'detail' && selectedPlayer) {
        return (
            <PlayerDetailView
                player={selectedPlayer}
                onBack={handleBackToList}
                onRefresh={handleRefresh}
            />
        );
    }

    return (
        <div className="bg-white rounded-xl p-5">
            <h1 className="px-8 text-primary-700 lg:-mb-8 lg:text-xl xl:text-2xl lg:mt-8 font-bold">
                {t('playersPage.playersListTitle')}
            </h1>

            {isLoading && !playerData.length ? (
                <div className="flex justify-center items-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    <span className="ml-3">{t('playersPage.loading')}</span>
                </div>
            ) : (
                <MainTable
                    columns={columns}
                    data={playerData}
                    searchPlaceholder={t('playersPage.searchPlaceholder')}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                />
            )}
        </div>
    );
}

export default Players;