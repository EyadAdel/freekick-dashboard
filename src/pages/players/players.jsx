// pages/Players/Players.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch } from "react-redux";
import { usePlayers, usePlayerAnalytics } from "../../hooks/usePlayers.js";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import { ArrowLeft, User, Wallet, Calendar, Trophy, Phone, Mail } from "lucide-react";
import PlayerDetailView from "./playerDetailView.jsx";
import MainTable from "../../components/MainTable.jsx";
import {useNavigate} from "react-router-dom";
import { getImageUrl, isFullUrl, extractFilename } from "../../utils/imageUtils.js"; // Import the utility functions

function Players() {
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

    // Fetch players with filters - now using useState/useEffect based hook
    const { players: playersData, isLoading, error, refetch } = usePlayers(apiFilters);
    console.log(playersData,'jjjjjjj')

    // Fetch analytics for stats cards
    const { analytics, isLoading: analyticsLoading } = usePlayerAnalytics();
    const navigate = useNavigate()

    useEffect(() => {
        dispatch(setPageTitle('Players'));
    }, [dispatch]);

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
                    Active
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Inactive
            </span>
        );
    };

    const formatDate = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatPhone = (phone) => {
        if (!phone) return 'N/A';
        // Format as +1 224 867 8901
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `+1 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        }
        return phone;
    };

    const formatWallet = (amount) => {
        if (amount === undefined || amount === null) return '$0';
        return `$${amount.toLocaleString()}`;
    };

    // In Players.jsx - Update handleViewPlayer function
    const handleViewPlayer = (player) => {
        navigate(`/players/player-profile`, {
            state: {player:player}
        });
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedPlayer(null);
    };

    // Server-side sorting
    const handleSort = (key) => {
        console.log('🔄 Sort clicked:', key);
        let order = 'asc';

        if (sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }

        setSortConfig({ key, order });
        setCurrentPage(1);
    };

    const columns = [
        {
            header: 'Player',
            accessor: 'name',
            sortable: true,
            sortKey: 'name',
            render: (row) => (
                <div onClick={() => handleViewPlayer(row)} className="flex cursor-pointer items-center gap-3">
                    {row.image ? (
                        <img
                            src={getImageUrl(row.image)} // Use utility function here
                            alt="Player Avatar"
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
                            {row.name || `Player ${row.id}`}
                        </span>
                        <span className="text-xs text-gray-500">
                            ID: PL{String(row.id).padStart(5, '0')}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Phone',
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
            header: 'Email',
            accessor: 'email',
            sortable: true,
            sortKey: 'email',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-gray-900 truncate max-w-[180px]">
                        {row.email || 'N/A'}
                    </span>
                </div>
            )
        },
        // {
        //     header: 'Wallet Balance',
        //     accessor: 'wallet_balance',
        //     sortable: true,
        //     sortKey: 'wallet',
        //     render: (row) => (
        //         <div className="flex items-center gap-2">
        //             <Wallet size={14} className="text-gray-400" />
        //             <span className="text-gray-900 font-medium">
        //                 {formatWallet(row.wallet_balance)}
        //             </span>
        //         </div>
        //     )
        // },
        {
            header: 'Bookings',
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
            header: 'Tournaments',
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
            header: 'points',
            accessor: 'num_of_points',
            sortable: true,
            sortKey: 'num_of_points',
            render: (row) => (
                <span className="text-gray-600">{row.num_of_points}</span>
            )
        },
        {
            header: 'STATUS',
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
                    aria-label="View player details"
                >
                    <ArrowLeft size={18} className="rotate-180" />
                </button>
            )
        }
    ];

    const handleSearch = (searchTerm) => {
        console.log('🔎 Search term:', searchTerm);
        setFilters(prev => ({ ...prev, search: searchTerm }));
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters) => {
        console.log('🎯 Filter changed:', newFilters);
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        console.log('📄 Page changed to:', page);
        setCurrentPage(page);
    };

    const handleRefresh = () => {
        console.log('🔄 Refreshing data...');
        refetch();
    };

    // Access data from the hook response
    const playerData = playersData?.results || [];

    // Get analytics data with fallback values
    const activePlayers = analytics?.active_players || 0;
    const totalBookings = analytics?.total_bookings || 0;
    const totalTournaments = analytics?.total_tournaments || 0;
    const totalWalletBalance = analytics?.total_wallet_balance || 0;

    // Total items for pagination
    const totalItems = playersData?.count || 0;

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">Error loading players</p>
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-2 text-sm underline hover:no-underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // Show detail view if a player is selected
    if (viewMode === 'detail' && selectedPlayer) {
        return (
            <PlayerDetailView
                player={selectedPlayer}
                onBack={handleBackToList}
                onRefresh={handleRefresh}
            />
        );
    }

    // Show list view
    return (
        <div className="bg-white rounded-xl p-5">
            <h1 className="px-8 text-primary-700 lg:-mb-8 lg:text-xl xl:text-2xl lg:mt-8 font-bold">
                Players List
            </h1>

            {isLoading && !playerData.length ? (
                <div className="flex justify-center items-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <MainTable
                    columns={columns}
                    data={playerData}
                    searchPlaceholder="Search player name, phone, email..."
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