import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice.js';
import MainTable from './../../components/MainTable';
import { Eye, Pencil, Trash2, TrendingUp, Plus, Users, CheckCircle, XCircle, MapPin } from 'lucide-react';
import { tournamentsService } from '../../services/tournaments/tournamentsService.js';
import { venuesService } from '../../services/venues/venuesService.js';
import { venueSportsService } from '../../services/venueSports/venueSportsService.js'; // Import the service
import { showConfirm } from '../../components/showConfirm.jsx';
import TournamentsForm from '../../components/tournaments/TournamentsForm.jsx';

const Tournaments = () => {
    const rowsPerPage = 10;
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Tournaments'));
    }, [dispatch]);

    // State Management
    const [tournamentsData, setTournamentsData] = useState([]);
    const [venuesData, setVenuesData] = useState([]);
    const [sportsData, setSportsData] = useState([]); // State for Sports
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Form & Edit States
    const [showForm, setShowForm] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);

    // Filter State
    const [activeFilters, setActiveFilters] = useState({
        globalSearch: '',
        status: 'all',
        venue: 'all'
    });

    // Fetch All Data (Tournaments + Venues + Sports)
    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            // Fetch all required data simultaneously
            const [tournamentsRes, venuesRes, sportsRes] = await Promise.all([
                tournamentsService.getAll(),
                venuesService.getAllVenues(),
                venueSportsService.getAll()
            ]);

            // 1. Handle Tournaments Data
            if (tournamentsRes && tournamentsRes.results) {
                setTournamentsData(tournamentsRes.results);
            } else if (Array.isArray(tournamentsRes)) {
                setTournamentsData(tournamentsRes);
            }

            // 2. Handle Venues Data
            if (venuesRes && venuesRes.results) {
                setVenuesData(venuesRes.results);
            }

            // 3. Handle Sports (Venue Types) Data
            const rawSports = sportsRes.results || sportsRes || [];
            if (Array.isArray(rawSports)) {
                const formattedSports = rawSports.map(sport => ({
                    // Try translations first, fallback to name
                    label: sport.translations?.en.name || sport.name || 'Unknown Sport',
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

    // Helper to get Venue Name by ID
    const getVenueName = (venueId) => {
        if (!venueId) return 'N/A';
        const venue = venuesData.find(v => v.id === venueId);
        return venue?.translations?.name || venue?.name || `Venue #${venueId}`;
    };

    // --- FORM HANDLERS ---
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
        fetchAllData(); // Refresh data
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

    // Filter Logic
    const filteredData = useMemo(() => {
        if (!tournamentsData) return [];

        let filtered = tournamentsData.filter((item) => {
            // Global Search
            if (activeFilters.globalSearch) {
                const search = activeFilters.globalSearch.toLowerCase();
                const name = item.name?.toLowerCase() || '';
                const code = item.code?.toLowerCase() || '';
                const venueName = getVenueName(item.venue).toLowerCase();

                if (!name.includes(search) && !code.includes(search) && !venueName.includes(search)) return false;
            }
            // Status Filter
            if (activeFilters.status !== 'all') {
                const isStatusActive = activeFilters.status === 'active';
                if (item.is_active !== isStatusActive) return false;
            }
            // Venue Filter
            if (activeFilters.venue !== 'all') {
                if (String(item.venue) !== String(activeFilters.venue)) return false;
            }
            return true;
        });

        return filtered;
    }, [tournamentsData, venuesData, activeFilters]);

    // Handlers
    const handleFilterChange = (newFilters) => {
        setActiveFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handleSearch = (term) => {
        setActiveFilters(prev => ({ ...prev, globalSearch: term }));
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    // Statistics based on data
    const stats = useMemo(() => {
        const total = tournamentsData.length;
        const active = tournamentsData.filter(t => t.is_active).length;
        const inactive = tournamentsData.filter(t => !t.is_active).length;
        const totalTeams = tournamentsData.reduce((acc, curr) => acc + (curr.max_teams || 0), 0);

        return { total, active, inactive, totalTeams };
    }, [tournamentsData]);

    // --- ACTION BUTTONS ---
    const ActionButtons = ({ tournament }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button
                className="text-gray-500 hover:text-teal-600 p-1 rounded transition-colors hover:bg-gray-50"
                title="View Details"
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

    // Columns Definition
    const columns = [
        {
            header: 'Sr.No',
            accessor: 'id',
            align: 'left',
            width: '60px',
            render: (row, index) => (
                <div className="text-gray-600 font-medium text-sm">
                    {index + 1}
                </div>
            )
        },
        {
            header: 'Tournament Info',
            accessor: 'name',
            align: 'left',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 text-sm">{row.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-1">
                        Code: {row.code}
                    </span>
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
        {
            label: 'Create Tournament',
            onClick: handleCreateTournament,
            type: 'primary',
            icon: <Plus size={16} />
        }
    ];

    // Filter Configuration
    const filterConfig = [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { label: 'All Status', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' }
            ],
            value: activeFilters.status
        },
        {
            key: 'venue',
            label: 'Filter by Venue',
            type: 'select',
            options: [
                { label: 'All Venues', value: 'all' },
                ...venuesData.map(v => ({
                    label: v.translations?.name || v.name,
                    value: v.id
                }))
            ],
            value: activeFilters.venue
        }
    ];

    // Responsive Stat Card
    const StatCard = ({ title, value, icon, gradient, bgColor }) => (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 ${bgColor} rounded-lg sm:rounded-xl`}>
                    {React.cloneElement(icon, { className: "w-5 h-5 sm:w-7 sm:h-7" })}
                </div>
                <div className={`w-12 sm:w-16 h-1 bg-gradient-to-r ${gradient} rounded-full`}></div>
            </div>
            <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">{title}</p>
                <p className="text-2xl sm:text-4xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="w-full px-2 sm:px-0">
            {/* Statistics Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 my-4 sm:my-8">
                <StatCard
                    title="Total Tournaments"
                    value={stats.total}
                    icon={<TrendingUp className="text-blue-600" />}
                    gradient="from-blue-500 to-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="Active"
                    value={stats.active}
                    icon={<CheckCircle className="text-green-600" />}
                    gradient="from-green-500 to-green-600"
                    bgColor="bg-green-50"
                />
                <StatCard
                    title="Inactive"
                    value={stats.inactive}
                    icon={<XCircle className="text-red-600" />}
                    gradient="from-red-500 to-red-600"
                    bgColor="bg-red-50"
                />
                <StatCard
                    title="Total Capacity (Teams)"
                    value={stats.totalTeams}
                    icon={<Users className="text-purple-600" />}
                    gradient="from-purple-500 to-purple-600"
                    bgColor="bg-purple-50"
                />
            </div>

            {/* Form Section */}
            {showForm && (
                <div className='mb-6 sm:mb-8'>
                    <TournamentsForm
                        initialData={selectedTournament}
                        venuesList={venuesData.map(v => ({ label: v.translations?.name || v.name, value: v.id }))}
                        sportsList={sportsData} // Passing the sports data to the form
                        onCancel={handleCancelForm}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            )}

            {/* Main Table Section */}
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
        </div>
    );
};

// Reusable Status Badge Component
const StatusBadge = ({ isActive }) => {
    const style = isActive
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-red-100 text-red-800 border border-red-200';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
};

export default Tournaments;