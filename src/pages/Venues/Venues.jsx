import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MainTable from './../../components/MainTable';
import {
    Eye, Pencil, Trash2, CheckCircle, XCircle, TrendingUp,
    MapPin, ExternalLink, Phone, User
} from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import VenuesForm from "../../components/venues/VenuesForm.jsx";
import { venuesService } from '../../services/venues/venuesService.js';
import { surfaceTypesService } from '../../services/surfaceTypes/surfaceTypesService.js';
import { daysOfWeekService } from '../../services/daysOfWeek/daysOfWeekService.js'; // Imported
import { showConfirm } from '../../components/showConfirm.jsx';
import { toast } from 'react-toastify';

const Venues = () => {
    const rowsPerPage = 10;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle('Venues'));
    }, [dispatch]);

    // ================= STATE MANAGEMENT =================

    // Data State
    const [venuesData, setVenuesData] = useState([]);
    const [surfaceTypeOptions, setSurfaceTypeOptions] = useState([]);
    const [daysList, setDaysList] = useState([]); // State for Days List
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Form State (Create/Edit)
    const [showForm, setShowForm] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState(null);

    // Filter State
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        surfaceType: '',
        venueType: '',
        globalSearch: ''
    });

    const [currentView, setCurrentView] = useState('all');

    const staticVenueTypes = [
        { label: 'Indoor', value: 'Indoor' },
        { label: 'Outdoor', value: 'Outdoor' }
    ];

    // ================= API CALLS =================

    const fetchFilterOptions = async () => {
        try {
            // Fetch Surface Types and Days of Week in parallel
            const [surfacesRes, daysRes] = await Promise.all([
                surfaceTypesService.getAllSurfaceTypes(),
                daysOfWeekService.getAll({ all_languages: true }) // Assuming param needed for translations
            ]);

            // Handle Surface Types
            if (surfacesRes && surfacesRes.results) {
                const formattedSurfaces = surfacesRes.results.map(item => ({
                    label: item.translations?.name || item.name || `Surface ${item.id}`,
                    value: item.id
                }));
                setSurfaceTypeOptions(formattedSurfaces);
            }

            // Handle Days List
            if (daysRes && daysRes.results) {
                setDaysList(daysRes.results);
            }

        } catch (error) {
            console.error("Failed to fetch filter options:", error);
        }
    };

    const fetchVenuesData = async () => {
        setIsLoading(true);
        try {
            // Fetch filter options (surfaces, days) if not already loaded
            if (surfaceTypeOptions.length === 0 || daysList.length === 0) {
                await fetchFilterOptions();
            }
            // Fetch main data
            const response = await venuesService.getAllVenues({ page: currentPage });
            if (response && response.results) {
                setVenuesData(response.results);
            }
        } catch (error) {
            console.error("Failed to fetch venues:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVenuesData();
    }, [currentPage]);

    // ================= HANDLERS =================

    // --- View Handler (Navigate with State) ---
    const handleViewVenue = async (venue) => {
        try {
            const fullVenueData = await venuesService.getVenueById(venue.id);

            navigate('/venues/venue-details', {
                state: {
                    venueData: fullVenueData,
                    daysList: daysList // Passing the fetched days list to the details page
                }
            });
        } catch (error) {
            console.error("Failed to fetch venue details:", error);
            toast.error("Failed to load venue details");
        }
    };

    // --- Action Handlers ---
    const handleActivateVenue = async (venue) => {
        const isConfirmed = await showConfirm({
            title: `Activate "${venue.translations?.name || `Venue ${venue.id}`}"?`,
            text: "This venue will be visible to users.",
            confirmButtonText: 'Yes, Activate it'
        });

        if (!isConfirmed) return;

        try {
            await venuesService.updateVenue(venue.id, { is_active: true });
            setVenuesData(prev => prev.map(v => v.id === venue.id ? { ...v, is_active: true } : v));
        } catch (error) {
            console.error("Failed to activate venue:", error);
        }
    };

    const handleDeactivateVenue = async (venue) => {
        const isConfirmed = await showConfirm({
            title: `Deactivate "${venue.translations?.name || `Venue ${venue.id}`}"?`,
            text: "This venue will be hidden from users.",
            confirmButtonText: 'Yes, Deactivate it'
        });

        if (!isConfirmed) return;

        try {
            await venuesService.updateVenue(venue.id, { is_active: false });
            setVenuesData(prev => prev.map(v => v.id === venue.id ? { ...v, is_active: false } : v));
        } catch (error) {
            console.error("Failed to deactivate venue:", error);
        }
    };

    const handleDeleteVenue = async (id, venueName) => {
        const isConfirmed = await showConfirm({
            title: `Delete "${venueName}"?`,
            text: "This action cannot be undone. The venue will be permanently removed.",
            confirmButtonText: 'Yes, Delete it'
        });

        if (!isConfirmed) return;

        try {
            await venuesService.deleteVenue(id);
            setVenuesData(prev => prev.filter(venue => venue.id !== id));
        } catch (error) {
            console.error("Failed to delete venue:", error);
        }
    };

    // --- Form Handlers ---
    const handleCreateVenue = () => {
        setSelectedVenue(null);
        setShowForm(true);
    };

    const handleEditVenue = (venue) => {
        setSelectedVenue(venue);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setSelectedVenue(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedVenue(null);
        fetchVenuesData();
    };

    // --- Filter & Pagination Handlers ---
    const handleFilterChange = (newFilters) => {
        setActiveFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handleSearch = (term) => {
        setActiveFilters(prev => ({ ...prev, globalSearch: term }));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => setCurrentPage(page);

    const handleViewChange = (view) => {
        setCurrentView(view);
        setCurrentPage(1);
    };

    // ================= DATA PROCESSING =================

    const filteredData = useMemo(() => {
        if (!venuesData) return [];
        let filtered = venuesData.filter((item) => {
            // Filters
            if (activeFilters.status && activeFilters.status !== 'all') {
                if (String(item.is_active) !== activeFilters.status) return false;
            }
            if (activeFilters.surfaceType && activeFilters.surfaceType !== 'all') {
                if (String(item.surface_type) !== String(activeFilters.surfaceType)) return false;
            }
            if (activeFilters.venueType && activeFilters.venueType !== 'all') {
                const itemType = String(item.venue_type || '').toLowerCase();
                const filterType = activeFilters.venueType.toLowerCase();
                if (itemType !== filterType) return false;
            }
            // Search
            if (activeFilters.globalSearch) {
                const search = activeFilters.globalSearch.toLowerCase();
                const name = item.translations?.name?.toLowerCase() || '';
                const location = item.address?.toLowerCase() || '';
                const contact = (item.contact_name || item.owner_info?.contact_name || '').toLowerCase();
                if (!name.includes(search) && !location.includes(search) && !contact.includes(search)) return false;
            }
            return true;
        });

        // Tabs View
        switch (currentView) {
            case 'active': filtered = filtered.filter(venue => venue.is_active); break;
            case 'inactive': filtered = filtered.filter(venue => !venue.is_active); break;
            default: break;
        }
        return filtered;
    }, [venuesData, activeFilters, currentView]);

    const stats = useMemo(() => {
        const total = venuesData.length;
        const active = venuesData.filter(venue => venue.is_active).length;
        const inactive = venuesData.filter(venue => !venue.is_active).length;
        return { total, active, inactive };
    }, [venuesData]);

    const activeVenuesList = useMemo(() => venuesData.filter(v => v.is_active), [venuesData]);
    const inactiveVenuesList = useMemo(() => venuesData.filter(v => !v.is_active), [venuesData]);

    // ================= TABLE CONFIGURATION =================

    const filterConfig = [
        {
            key: 'status', label: 'Status', type: 'select',
            options: [{ label: 'All Status', value: 'all' }, { label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }],
            value: activeFilters.status
        },
        {
            key: 'venueType', label: 'Venue Type', type: 'select',
            options: [{ label: 'All Venue Types', value: 'all' }, ...staticVenueTypes],
            value: activeFilters.venueType
        },
        {
            key: 'surfaceType', label: 'Surface Type', type: 'select',
            options: [{ label: 'All Surface Types', value: 'all' }, ...surfaceTypeOptions],
            value: activeFilters.surfaceType
        }
    ];

    const columns = [
        {
            header: 'Sr.No', accessor: 'id', align: 'left', width: '60px',
            render: (row, i) => <div className="text-gray-600 font-medium text-sm">{i + 1}</div>
        },
        {
            header: 'Venue', accessor: 'id', align: 'left', width: '200px',
            render: (row) => (
                <div className="font-medium text-gray-900">
                    <div className="text-sm font-bold text-secondary-600">{row.translations?.name || `Venue ${row.id}`}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${row.venue_type === 'indoor' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                            {row.venue_type || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-400">#{row.id}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Contact Info', accessor: 'contact', align: 'left',
            render: (row) => {
                const name = row.contact_name || row.owner_info?.contact_name || 'N/A';
                const phone = row.phone_number || row.owner_info?.contact_phone || 'N/A';
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700"><User size={14} className="text-gray-400" /><span>{name}</span></div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={12} className="text-gray-400" /><span>{phone}</span></div>
                    </div>
                );
            }
        },
        {
            header: 'Location', accessor: 'location', align: 'left', width: '250px',
            render: (row) => {
                const mapLink = row.latitude && row.longitude ? `https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}` : null;
                return (
                    <div>
                        <div className="text-xs text-gray-600 line-clamp-2 mb-1" title={row.address}>{row.address || row.translations?.address || 'No address'}</div>
                        {mapLink && <a href={mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"><MapPin size={12} /> View on Map <ExternalLink size={10} /></a>}
                    </div>
                );
            }
        },
        {
            header: 'Play Types', accessor: 'venue_play_type', align: 'center', width: '180px',
            render: (row) => (
                <div className="flex flex-wrap gap-1.5 justify-center">
                    {row.venue_play_type?.length > 0 ? row.venue_play_type.map((t) => (
                        <span key={t.id} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] rounded-full font-medium whitespace-nowrap">{t.translations?.name}</span>
                    )) : <span className="text-xs text-gray-400 italic">None</span>}
                </div>
            )
        },
        {
            header: 'Status', accessor: 'is_active', align: 'center', width: '100px',
            render: (row) => <StatusBadge isActive={row.is_active} />
        },
        {
            header: 'Actions', align: 'right', width: '120px',
            render: (row) => <ActionButtons venue={row} />
        }
    ];

    const topActions = [{ label: 'Create Venue', onClick: handleCreateVenue, type: 'primary' }];

    // ================= HELPER COMPONENTS =================

    const ActionButtons = ({ venue }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button className="text-gray-500 hover:text-teal-600 p-1 rounded transition-colors hover:bg-gray-50" title="View Details" onClick={() => handleViewVenue(venue)}>
                <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50" title="Edit Venue" onClick={() => handleEditVenue(venue)}>
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50" title="Delete Venue" onClick={() => handleDeleteVenue(venue.id, venue.translations?.name || `Venue ${venue.id}`)}>
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
        </div>
    );

    const StatusManagementSection = ({ title, venues, statusType, emptyMessage }) => (
        <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-lg w-full shadow-md border border-primary-100 mb-4 sm:mb-6 overflow-hidden">
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-primary-100 bg-gradient-to-r from-primary-50 to-white">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${statusType === 'active' ? 'bg-primary-100' : 'bg-red-50'}`}>
                            {statusType === 'active' ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600" /> : <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />}
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-secondary-600">{title}</h2>
                            <p className="text-xs text-gray-600">{venues.length} {venues.length === 1 ? 'venue' : 'venues'}</p>
                        </div>
                    </div>
                    <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusType === 'active' ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-600'}`}>
                        {statusType === 'active' ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            {venues.length > 0 ? (
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 max-h-64 h-auto custom-scrollbar overflow-auto">
                    <div className="space-y-2 sm:space-y-2.5 h-auto overflow-y-auto pr-1 sm:pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                        {venues.map((venue) => (
                            <div key={venue.id} className="bg-white rounded-lg border border-primary-100 p-2.5 sm:p-3 hover:shadow-md hover:border-primary-300 transition-all duration-200">
                                <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
                                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 w-full sm:w-auto">
                                        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                            <MapPin className="text-white w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                                                <span className="font-semibold text-secondary-600 text-xs sm:text-sm truncate">{venue.translations?.name || `Venue ${venue.id}`}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 flex-wrap">
                                                <span className="font-medium">Type:</span> {venue.venue_type || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-3 justify-between sm:justify-end">
                                        <StatusBadge isActive={venue.is_active} />
                                        <div className="flex gap-1.5">
                                            {statusType === 'active' && (
                                                <button className="flex items-center gap-1 sm:gap-1.5 bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap" onClick={() => handleDeactivateVenue(venue)}>
                                                    <XCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                                                    <span className="hidden sm:inline">Deactivate</span>
                                                    <span className="sm:hidden">✕</span>
                                                </button>
                                            )}
                                            {statusType === 'inactive' && (
                                                <button className="flex items-center gap-1 sm:gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap" onClick={() => handleActivateVenue(venue)}>
                                                    <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                                                    <span className="hidden sm:inline">Activate</span>
                                                    <span className="sm:hidden">✓</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-4 sm:p-6 text-center text-gray-500 text-xs sm:text-sm">{emptyMessage}</div>
            )}
        </div>
    );

    return (
        <div className="w-full px-2 sm:px-0">
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 my-4 sm:my-8">
                <StatCard title="Total Venues" value={stats.total} icon={<TrendingUp className="text-blue-600" />} gradient="from-blue-500 to-blue-600" bgColor="bg-blue-50" />
                <StatCard title="Active Venues" value={stats.active} icon={<CheckCircle className="text-green-600" />} gradient="from-green-500 to-green-600" bgColor="bg-green-50" />
                <StatCard title="Inactive Venues" value={stats.inactive} icon={<XCircle className="text-red-600" />} gradient="from-red-500 to-red-600" bgColor="bg-red-50" />
            </div>

            {/* Status Management Lists */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
                <StatusManagementSection title="Active Venues" venues={activeVenuesList} statusType="active" emptyMessage="No active venues" />
                <StatusManagementSection title="Inactive Venues" venues={inactiveVenuesList} statusType="inactive" emptyMessage="No inactive venues" />
            </div>

            {/* Hidden Forms */}
            {showForm && <div className='mb-6 sm:mb-8'><VenuesForm initialData={selectedVenue} onCancel={handleCancelForm} onSuccess={handleFormSuccess} /></div>}

            {/* View Tabs */}
            <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-lg shadow-sm border border-primary-100 p-1 sm:p-1.5 mt-4 sm:mt-5 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
                    {[{ key: 'all', label: 'All Venues', count: stats.total }, { key: 'active', label: 'Active', count: stats.active }, { key: 'inactive', label: 'Inactive', count: stats.inactive }].map((tab) => (
                        <button key={tab.key} onClick={() => handleViewChange(tab.key)} className={`flex-1 flex items-center justify-center gap-2 px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${currentView === tab.key ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' : 'text-gray-600 hover:text-secondary-600 hover:bg-primary-50'}`}>
                            <span className="truncate">{tab.label}</span>
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${currentView === tab.key ? 'bg-primary-700 text-white' : 'bg-gray-200 text-gray-600'}`}>{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Table */}
            {isLoading && venuesData.length === 0 ? (
                <div className="p-6 sm:p-10 text-center text-gray-500 text-sm sm:text-base">Loading...</div>
            ) : (
                <MainTable
                    data={filteredData || []} columns={columns} filters={filterConfig}
                    searchPlaceholder="Search venue" topActions={topActions}
                    currentPage={currentPage} totalItems={filteredData?.length || 0}
                    itemsPerPage={rowsPerPage} onSearch={handleSearch}
                    onFilterChange={handleFilterChange} onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

// ================= UTILITY COMPONENTS =================

const StatusBadge = ({ isActive }) => {
    const style = isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200';
    return (
        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${style} whitespace-nowrap`}>
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
};

const StatCard = ({ title, value, icon, gradient, bgColor }) => (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className={`p-2 sm:p-3 ${bgColor} rounded-lg sm:rounded-xl`}>{React.cloneElement(icon, { className: "w-5 h-5 sm:w-7 sm:h-7" })}</div>
            <div className={`w-12 sm:w-16 h-1 bg-gradient-to-r ${gradient} rounded-full`}></div>
        </div>
        <div>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">{title}</p>
            <p className="text-2xl sm:text-4xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

export default Venues;