import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice.js';
import MainTable from './../../components/MainTable';
import { Eye, Pencil, Trash2, TrendingUp, Plus, Users, CheckCircle, XCircle, MapPin, Image as ImageIcon } from 'lucide-react';
import { tournamentsService } from '../../services/tournaments/tournamentsService.js';
import { venuesService } from '../../services/venues/venuesService.js';
import { venueSportsService } from '../../services/venueSports/venueSportsService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import TournamentsForm from '../../components/tournaments/TournamentsForm.jsx';
import StatCard from './../../components/Charts/StatCards.jsx';
import { IMAGE_BASE_URL } from '../../utils/ImageBaseURL.js';

const Tournaments = () => {
    const rowsPerPage = 10;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle('Tournaments'));
    }, [dispatch]);

    // --- STATE MANAGEMENT ---
    const [tournamentsData, setTournamentsData] = useState([]);
    const [venuesData, setVenuesData] = useState([]);
    const [sportsData, setSportsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const [showForm, setShowForm] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);

    const [activeFilters, setActiveFilters] = useState({
        globalSearch: '',
        status: 'all',
        venue: 'all'
    });

    // --- FETCH DATA ---
    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const [tournamentsRes, venuesRes, sportsRes] = await Promise.all([
                tournamentsService.getAll(),
                venuesService.getAllVenues(),
                venueSportsService.getAll()
            ]);

            if (tournamentsRes && tournamentsRes.results) {
                setTournamentsData(tournamentsRes.results);
            } else if (Array.isArray(tournamentsRes)) {
                setTournamentsData(tournamentsRes);
            }

            if (venuesRes && venuesRes.results) {
                setVenuesData(venuesRes.results);
            }

            const rawSports = sportsRes.results || sportsRes || [];
            if (Array.isArray(rawSports)) {
                const formattedSports = rawSports.map(sport => ({
                    label: sport.translations?.en?.name || sport.name || 'Unknown Sport',
                    value: sport.id
                }));
                setSportsData(formattedSports);
            }

        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const getVenueName = (venueId) => {
        if (!venueId) return 'N/A';
        const venue = venuesData.find(v => v.id === venueId);
        return venue?.translations?.name || venue?.name || `Venue #${venueId}`;
    };

    // --- HANDLERS ---
    const handleViewDetails = (tournament) => {
        const resolvedVenueName = getVenueName(tournament.venue);

        navigate(`/tournaments/tournament-details`, {
            state: {
                tournamentData: tournament,
                venueName: resolvedVenueName
            }
        });
    };

    const handleCreateTournament = () => {
        setSelectedTournament(null);
        setShowForm(true);
    };

    const handleEditTournament = (tournament) => {
        setSelectedTournament(tournament);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setSelectedTournament(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedTournament(null);
        fetchAllData();
    };

    const handleDeleteTournament = async (id, name) => {
        const isConfirmed = await showConfirm({
            title: `Delete "${name}"?`,
            text: "This action cannot be undone. The tournament will be permanently removed.",
            confirmButtonText: 'Yes, Delete it'
        });

        if (!isConfirmed) return;

        try {
            await tournamentsService.delete(id);
            setTournamentsData(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Failed to delete tournament:", error);
        }
    };

    // --- FILTER & STATS ---
    const filteredData = useMemo(() => {
        if (!tournamentsData) return [];
        return tournamentsData.filter((item) => {
            if (activeFilters.globalSearch) {
                const search = activeFilters.globalSearch.toLowerCase();
                const name = item.name?.toLowerCase() || '';
                const code = item.code?.toLowerCase() || '';
                const venueName = getVenueName(item.venue).toLowerCase();
                if (!name.includes(search) && !code.includes(search) && !venueName.includes(search)) return false;
            }
            if (activeFilters.status !== 'all') {
                const isStatusActive = activeFilters.status === 'active';
                if (item.is_active !== isStatusActive) return false;
            }
            if (activeFilters.venue !== 'all') {
                if (String(item.venue) !== String(activeFilters.venue)) return false;
            }
            return true;
        });
    }, [tournamentsData, venuesData, activeFilters]);

    const handleFilterChange = (newFilters) => {
        setActiveFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handleSearch = (term) => {
        setActiveFilters(prev => ({ ...prev, globalSearch: term }));
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const stats = useMemo(() => {
        const total = tournamentsData.length;
        const active = tournamentsData.filter(t => t.is_active).length;
        const inactive = tournamentsData.filter(t => !t.is_active).length;
        const totalTeams = tournamentsData.reduce((acc, curr) => acc + (parseInt(curr.max_teams) || 0), 0);
        return { total, active, inactive, totalTeams };
    }, [tournamentsData]);

    // --- ACTIONS COMPONENT ---
    const ActionButtons = ({ tournament }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button
                className="text-gray-500 hover:text-teal-600 p-1 rounded transition-colors hover:bg-gray-50"
                title="View Details"
                onClick={() => handleViewDetails(tournament)}
            >
                <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
                title="Edit Tournament"
                onClick={() => handleEditTournament(tournament)}
            >
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
                onClick={() => handleDeleteTournament(tournament.id, tournament.name || `Tournament ${tournament.id}`)}
                title="Delete Tournament"
            >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
        </div>
    );

    const columns = [
        {
            header: 'Sr.No',
            accessor: 'id',
            align: 'left',
            width: '60px',
            render: (row, index) => <div className="text-gray-600 font-medium text-sm">{index + 1}</div>
        },
        {
            header: 'Tournament Info',
            accessor: 'name',
            align: 'left',
            // UPDATED RENDER: Shows image if exists, otherwise shows Static Icon
            render: (row) => (
                <div className="flex items-center gap-3">
                    {row.cover_image ? (
                        <img
                            src={`${IMAGE_BASE_URL}${row.cover_image}`}
                            alt={row.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100 shadow-sm flex-shrink-0 bg-gray-50"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/100x100?text=No+Img'; // Fallback network image
                            }}
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400">
                            <ImageIcon size={20} />
                        </div>
                    )}

                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-sm line-clamp-1" title={row.name}>{row.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-1">
                            Code: {row.code}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Venue',
            accessor: 'venue',
            align: 'left',
            render: (row) => (
                <div className="flex items-center gap-1.5 text-gray-700">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-sm font-medium">{getVenueName(row.venue)}</span>
                </div>
            )
        },
        {
            header: 'Timeline',
            accessor: 'start_date',
            align: 'center',
            render: (row) => (
                <div className="flex flex-col text-xs sm:text-sm text-gray-600">
                    <span className="whitespace-nowrap">Start: {new Date(row.start_date).toLocaleDateString()}</span>
                    <span className="whitespace-nowrap">End: {new Date(row.end_date).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            header: 'Max Teams',
            accessor: 'max_teams',
            align: 'center',
            render: (row) => (
                <div className="flex items-center justify-center gap-1 text-gray-700 font-medium">
                    <Users size={14} className="text-blue-500" />
                    <span>{row.max_teams}</span>
                </div>
            )
        },
        {
            header: 'Entry Fee',
            accessor: 'entry_fee',
            align: 'center',
            render: (row) => (
                <span className="font-bold text-gray-800 text-sm">
                   AED {parseFloat(row.entry_fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: 'is_active',
            align: 'center',
            render: (row) => <StatusBadge isActive={row.is_active} />
        },
        {
            header: 'Actions',
            align: 'right',
            render: (row) => <ActionButtons tournament={row} />
        }
    ];

    const topActions = [
        { label: 'Create Tournament', onClick: handleCreateTournament, type: 'primary', icon: <Plus size={16} /> }
    ];

    const filterConfig = [
        {
            key: 'status', label: 'Status', type: 'select',
            options: [ { label: 'All Status', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' } ],
            value: activeFilters.status
        },
        {
            key: 'venue', label: 'Filter by Venue', type: 'select',
            options: [ { label: 'All Venues', value: 'all' }, ...venuesData.map(v => ({ label: v.translations?.name || v.name, value: v.id })) ],
            value: activeFilters.venue
        }
    ];

    return (
        <div className="w-full px-2 sm:px-0">
            {showForm ? (
                // SHOW ONLY FORM (Create or Edit Mode)
                <div className='my-4 sm:my-8'>
                    <TournamentsForm
                        initialData={selectedTournament}
                        venuesList={venuesData.map(v => ({ label: v.translations?.name || v.name, value: v.id }))}
                        sportsList={sportsData}
                        onCancel={handleCancelForm}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            ) : (
                // SHOW DASHBOARD (Stats + Table)
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 my-4 sm:my-8">
                        <StatCard
                            title="Total Tournaments"
                            value={stats.total}
                            icon={TrendingUp}
                            iconColor="text-blue-600"
                        />
                        <StatCard
                            title="Active"
                            value={stats.active}
                            icon={CheckCircle}
                            iconColor="text-green-600"
                        />
                        <StatCard
                            title="Inactive"
                            value={stats.inactive}
                            icon={XCircle}
                            iconColor="text-red-600"
                        />
                        <StatCard
                            title="Total Capacity"
                            value={stats.totalTeams}
                            icon={Users}
                            iconColor="text-purple-600"
                        />
                    </div>

                    {isLoading && tournamentsData.length === 0 ? (
                        <div className="p-6 sm:p-10 text-center text-gray-500 text-sm sm:text-base">Loading...</div>
                    ) : (
                        <MainTable
                            data={filteredData || []}
                            columns={columns}
                            filters={filterConfig}
                            searchPlaceholder="Search by name, code or venue..."
                            topActions={topActions}
                            currentPage={currentPage}
                            totalItems={filteredData?.length || 0}
                            itemsPerPage={rowsPerPage}
                            onSearch={handleSearch}
                            onFilterChange={handleFilterChange}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
};

const StatusBadge = ({ isActive }) => {
    const style = isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
};

export default Tournaments;