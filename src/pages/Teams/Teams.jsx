// pages/Teams/Teams.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch } from "react-redux";
import { useTeams, useTeamAnalytics } from "../../hooks/useTeams.js";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import { ArrowLeft, Trophy, Users, Target, Award } from "lucide-react";
import MainTable from "../../components/MainTable.jsx";
import {useNavigate} from "react-router-dom";
import {IMAGE_BASE_URL} from "../../utils/ImageBaseURL.js";

function Teams() {
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        order: 'asc'
    });
    const [filters, setFilters] = useState({});

    const itemsPerPage = 10;
    const  navigate = useNavigate()

    // Build API filters with pagination and sorting
    const apiFilters = {
        page: currentPage,
        page_limit: itemsPerPage,
        ...filters,
        ...(sortConfig.key && {
            ordering: getOrderingParam(sortConfig.key, sortConfig.order)
        })
    };

    // Debug: Log API filters whenever they change
    useEffect(() => {
        console.log('🔍 API Filters:', apiFilters);
    }, [JSON.stringify(apiFilters)]);

    // Fetch teams with filters
    const { teams, isLoading, error, refetch } = useTeams(apiFilters);


    useEffect(() => {
        dispatch(setPageTitle('Teams'));
    }, [dispatch]);

    // Convert sort keys to API ordering field names
    function getOrderingParam(key, order) {
        const orderingMap = {
            'name': 'name',
            'id': 'id',
            'creator': 'team_leader__name',
            'members': 'number_of_members',
            'matches': 'num_of_matches',
            'tournaments': 'num_of_tournaments',
            'created_at': 'created_at'
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

    const handleViewTeam = (team) => {
        navigate(`/teams/team-profile`, {
            state: {team:team}
        });
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedTeam(null);
    };

    // Server-side sorting - just update sort config, API will handle it
    const handleSort = (key) => {
        console.log('🔄 Sort clicked:', key);
        let order = 'asc';

        if (sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }

        setSortConfig({ key, order });
        setCurrentPage(1); // Reset to first page when sorting
    };

    const columns = [
        {
            header: 'Team Name',
            accessor: 'name',
            sortable: true,
            sortKey: 'name',
            render: (row) => (
                <div
                    onClick={() => handleViewTeam(row)}
                    className="flex cursor-pointer items-center gap-3">
                    {row.logo ? (
                        <img
                            src={ IMAGE_BASE_URL + row.logo}
                            alt="Team Logo"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <Users size={18} className="text-teal-600" />
                        </div>
                    )}
                    <span className="font-medium text-gray-900">
                        {row.name || 'Team ' + row.id}
                    </span>
                </div>
            )
        },
        {
            header: 'Team Leader',
            accessor: 'team_leader',
            sortable: true,
            sortKey: 'creator',
            render: (row) => (
                <div className="flex items-center gap-2">
                    {row.team_leader?.image ? (
                        <img
                            src={IMAGE_BASE_URL + row.team_leader.image}
                            alt={row.team_leader.name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                                {row.team_leader?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                    )}
                    <span className="text-gray-900">
                        {row.team_leader?.name || 'Unknown'}
                    </span>
                </div>
            )
        },
        {
            header: 'Members',
            accessor: 'number_of_members',
            sortable: true,
            sortKey: 'members',
            render: (row) => (
                <span className="text-gray-600">
                    {row.number_of_members || 0}
                </span>
            )
        },
        {
            header: 'Points',
            accessor: 'num_of_points',
            sortable: true,
            sortKey: 'num_of_points',
            render: (row) => (
                <span className="text-gray-600">{row.num_of_points || 0}</span>
            )
        },
        {
            header: 'Bookings',
            accessor: 'number_of_booking',
            sortable: true,
            sortKey: 'number_of_booking',
            render: (row) => (
                <span className="text-gray-600">{row.number_of_booking || 0}</span>
            )
        },
        {
            header: 'Last Activity',
            accessor: 'updated_at',
            sortable: true,
            sortKey: 'updated_at',
            render: (row) => (
                <span className="text-gray-600">{formatDate(row.updated_at)}</span>
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
                    onClick={() => handleViewTeam(row)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="View team details"
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

    // Server returns paginated data directly - no client-side sorting needed
    const teamData = teams?.results || [];

    // Debug: Log data received
    useEffect(() => {
        if (teams) {
            console.log('📊 Teams received:', {
                count: teams.count,
                results: teams.results?.length,
                page: currentPage
            });
        }
    }, [teams]);


    // Total items for pagination
    const totalItems = teams?.count || 0;

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">Error loading teams</p>
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

    // // Show detail view if a team is selected
    // if (viewMode === 'detail' && selectedTeam) {
    //     return (
    //         <TeamDetailView
    //             team={selectedTeam}
    //             onBack={handleBackToList}
    //             onRefresh={handleRefresh}
    //         />
    //     );
    // }

    // Show list view
    return (
        <div className=" bg-white rounded-xl p-5">


            <h1 className="px-8 text-primary-700 lg:-mb-8 lg:text-xl xl:text-2xl lg:mt-8  font-bold">
                Teams List
            </h1>
            <MainTable
                columns={columns}
                data={teamData}
                searchPlaceholder="Search team name, ID, creator..."
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                onPageChange={handlePageChange}
                sortConfig={sortConfig}
                onSort={handleSort}
            />
        </div>
    );
}

export default Teams;