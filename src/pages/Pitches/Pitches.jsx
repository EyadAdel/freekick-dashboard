import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import MainTable from './../../components/MainTable';
import {Eye, Pencil, Trash2, CheckCircle, XCircle, TrendingUp, Clock, Filter} from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import PitchesForm from "../../components/pitches/PitchesForm.jsx";
import { pitchesService } from '../../services/pitches/pitchesService.js';
import { venuesService } from '../../services/venues/venuesService.js';
import { showConfirm } from '../../components/showConfirm.jsx';

const Pitches = () => {
    const rowsPerPage = 10;
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Pitches'));
    }, [dispatch]);

    // State Management
    const [pitchesData, setPitchesData] = useState([]);
    const [venuesData, setVenuesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Form & Edit States
    const [showForm, setShowForm] = useState(false);
    const [selectedPitch, setSelectedPitch] = useState(null);

    // Filter State
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        type: '',
        venue: '',
        price: '',
        pitcherName: '',
        globalSearch: ''
    });

    // View State - To switch between different pitch status views
    const [currentView, setCurrentView] = useState('all');

    // Fetch Data
    const fetchPitchesData = async () => {
        setIsLoading(true);
        try {
            const response = await pitchesService.getAllPitchess(currentPage);
            if (response && response.results) {
                setPitchesData(response.results);
            }
        } catch (error) {
            console.error("Failed to fetch pitches:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchVenuesData = async () => {
        try {
            const response = await venuesService.getAllVenues();
            if (response && response.results) {
                const formattedVenues = response.results.map((venue) => ({
                    label: venue.translations.name,
                    value: venue.id
                }));
                setVenuesData(formattedVenues);
            }
        } catch (error) {
            console.error("Failed to fetch venues:", error);
        }
    };

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([fetchPitchesData(), fetchVenuesData()]);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Status Management Functions
    const handleApprovePitch = async (pitch) => {
        const isConfirmed = await showConfirm({
            title: `Approve "${pitch.translations?.name || `Pitch ${pitch.id}`}"?`,
            text: "This pitch will be set to active status and visible to users.",
            confirmButtonText: 'Yes, Approve it'
        });

        if (!isConfirmed) return;

        try {
            await pitchesService.updatePitch(pitch.id, { is_active: true });
            setPitchesData(prev =>
                prev.map(p =>
                    p.id === pitch.id ? { ...p, is_active: true } : p
                )
            );
        } catch (error) {
            console.error("Failed to approve pitch:", error);
        }
    };

    const handleRejectPitch = async (pitch) => {
        const isConfirmed = await showConfirm({
            title: `Reject "${pitch.translations?.name || `Pitch ${pitch.id}`}"?`,
            text: "This pitch will be set to inactive status and hidden from users.",
            confirmButtonText: 'Yes, Reject it'
        });

        if (!isConfirmed) return;

        try {
            await pitchesService.updatePitch(pitch.id, { is_active: false });
            setPitchesData(prev =>
                prev.map(p =>
                    p.id === pitch.id ? { ...p, is_active: false } : p
                )
            );
        } catch (error) {
            console.error("Failed to reject pitch:", error);
        }
    };

    // --- FORM HANDLERS ---
    const handleCreatePitch = () => {
        setSelectedPitch(null);
        setShowForm(true);
    };

    const handleEditPitch = (pitch) => {
        setSelectedPitch(pitch);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setSelectedPitch(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedPitch(null);
        fetchAllData();
    };

    const handleDeletePitch = async (id, pitchName) => {
        const isConfirmed = await showConfirm({
            title: `Delete "${pitchName}"?`,
            text: "This action cannot be undone. The pitch will be permanently removed.",
            confirmButtonText: 'Yes, Delete it'
        });

        if (!isConfirmed) return;

        try {
            await pitchesService.deletePitch(id);
            setPitchesData(prev => prev.filter(pitch => pitch.id !== id));
        } catch (error) {
            console.error("Failed to delete pitch:", error);
        }
    };

    // Filter Logic
    const filteredData = useMemo(() => {
        if (!pitchesData) return [];

        let filtered = pitchesData.filter((item) => {
            if (activeFilters.status && activeFilters.status !== 'all') {
                if (String(item.is_active) !== activeFilters.status) return false;
            }
            if (activeFilters.type && activeFilters.type !== 'all') {
                if (String(item.size) !== activeFilters.type) return false;
            }
            if (activeFilters.venue && activeFilters.venue !== 'all') {
                if (String(item.venue) !== String(activeFilters.venue)) return false;
            }
            if (activeFilters.price) {
                const itemPrice = parseFloat(item.price_per_hour || 0);
                const filterPrice = parseFloat(activeFilters.price);
                if (!isNaN(filterPrice)) {
                    if (itemPrice !== filterPrice) return false;
                }
            }
            if (activeFilters.pitcherName) {
                const name = item.translations?.name?.toLowerCase() || '';
                const searchTerm = activeFilters.pitcherName.toLowerCase();
                if (!name.includes(searchTerm)) return false;
            }
            if (activeFilters.globalSearch) {
                const search = activeFilters.globalSearch.toLowerCase();
                const name = item.translations?.name?.toLowerCase() || '';
                const venue = String(item.venue);
                if (!name.includes(search) && !venue.includes(search)) return false;
            }
            return true;
        });

        // Apply view filter
        switch (currentView) {
            case 'approved':
                filtered = filtered.filter(pitch => pitch.is_active);
                break;
            case 'rejected':
                filtered = filtered.filter(pitch => !pitch.is_active);
                break;
            case 'pending':
                filtered = filtered.filter(pitch => !pitch.is_active);
                break;
            case 'all':
            default:
                break;
        }

        return filtered;
    }, [pitchesData, activeFilters, currentView]);

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

    const handleViewChange = (view) => {
        setCurrentView(view);
        setCurrentPage(1);
    };

    // Statistics
    const stats = useMemo(() => {
        const total = pitchesData.length;
        const active = pitchesData.filter(pitch => pitch.is_active).length;
        const inactive = pitchesData.filter(pitch => !pitch.is_active).length;
        const pending = pitchesData.filter(pitch => !pitch.is_active).length;

        return { total, active, inactive, pending };
    }, [pitchesData]);

    // Get pitches by status for management sections
    const approvedPitches = useMemo(() => {
        return pitchesData.filter(pitch => pitch.is_active);
    }, [pitchesData]);

    const rejectedPitches = useMemo(() => {
        return pitchesData.filter(pitch => !pitch.is_active);
    }, [pitchesData]);

    // --- ACTION BUTTONS (Responsive) ---
    const ActionButtons = ({ pitch }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button
                className="text-gray-500 hover:text-teal-600 p-1 rounded transition-colors hover:bg-gray-50"
                title="View Pitch"
            >
                <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
                title="Edit Pitch"
                onClick={() => handleEditPitch(pitch)}
            >
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
                onClick={() => handleDeletePitch(pitch.id, pitch.translations?.name || `Pitch ${pitch.id}`)}
                title="Delete Pitch"
            >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
        </div>
    );

    // Status Management Section Component (Fully Responsive)
    const StatusManagementSection = ({ title, pitches, statusType, emptyMessage }) => (
        <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-lg w-full shadow-md border border-primary-100 mb-4 sm:mb-6 overflow-hidden">
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-primary-100 bg-gradient-to-r from-primary-50 to-white">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                            statusType === 'approved' ? 'bg-primary-100' :
                                statusType === 'rejected' ? 'bg-red-50' : 'bg-orange-50'
                        }`}>
                            {statusType === 'approved' ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600" /> :
                                statusType === 'rejected' ? <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" /> :
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />}
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-secondary-600">{title}</h2>
                            <p className="text-xs text-gray-600">
                                {pitches.length} {pitches.length === 1 ? 'pitch' : 'pitches'}
                            </p>
                        </div>
                    </div>
                    <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        statusType === 'approved' ? 'bg-primary-100 text-primary-700' :
                            statusType === 'rejected' ? 'bg-red-100 text-red-600' :
                                'bg-orange-100 text-orange-600'
                    }`}>
                        {statusType === 'approved' ? 'Approved' : statusType === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                </div>
            </div>

            {pitches.length > 0 ? (
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 max-h-64 h-auto custom-scrollbar overflow-auto">
                    <div
                        className="space-y-2 sm:space-y-2.5 h-auto overflow-y-auto pr-1 sm:pr-2"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#cbd5e1 transparent'
                        }}
                    >
                        {pitches.map((pitch) => (
                            <div
                                key={pitch.id}
                                className="bg-white rounded-lg border border-primary-100 p-2.5 sm:p-3 hover:shadow-md hover:border-primary-300 transition-all duration-200"
                            >
                                <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
                                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 w-full sm:w-auto">
                                        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                            <span className="text-sm sm:text-base font-bold text-white">{pitch.size}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                                                <span className="font-semibold text-secondary-600 text-xs sm:text-sm truncate">
                                                    {pitch.translations?.name || `Pitch ${pitch.id}`}
                                                </span>
                                                <span className="px-1.5 sm:px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium whitespace-nowrap">
                                                    {pitch.size} a side
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 flex-wrap">
                                                <span className="flex items-center gap-1 whitespace-nowrap">
                                                    <span className="font-medium">ID:</span> #{pitch.id}
                                                </span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                                                <span className="flex items-center gap-1 whitespace-nowrap">
                                                    <span className="font-medium">Venue:</span> #{pitch.venue}
                                                </span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                                                <span className="flex items-center gap-1 whitespace-nowrap">
                                                    <span className="font-medium">Price:</span> AED {parseFloat(pitch.price_per_hour || 0).toLocaleString()}/hr
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-3 justify-between sm:justify-end">
                                        <div className="text-left sm:text-right">
                                            <StatusBadge isActive={pitch.is_active} />
                                        </div>
                                        <div className="flex gap-1.5">
                                            {statusType === 'pending' && (
                                                <button
                                                    className="flex items-center gap-1 sm:gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                                                    onClick={() => handleApprovePitch(pitch)}
                                                >
                                                    <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                                                    <span className="hidden sm:inline">Approve</span>
                                                    <span className="sm:hidden">✓</span>
                                                </button>
                                            )}
                                            {statusType === 'approved' && (
                                                <button
                                                    className="flex items-center gap-1 sm:gap-1.5 bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                                                    onClick={() => handleRejectPitch(pitch)}
                                                >
                                                    <XCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                                                    <span className="hidden sm:inline">Reject</span>
                                                    <span className="sm:hidden">✕</span>
                                                </button>
                                            )}
                                            {statusType === 'rejected' && (
                                                <button
                                                    className="flex items-center gap-1 sm:gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                                                    onClick={() => handleApprovePitch(pitch)}
                                                >
                                                    <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                                                    <span className="hidden sm:inline">Approve</span>
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
                <div className="p-4 sm:p-6 text-center text-gray-500 text-xs sm:text-sm">
                    {emptyMessage}
                </div>
            )}
        </div>
    );

    // Filter Config
    const filterConfig = [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { label: 'All Status', value: 'all' },
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' }
            ],
            value: activeFilters.status
        },
        {
            key: 'venue',
            label: 'Filter Venues',
            type: 'select',
            options: [{ label: 'All Venues', value: 'all' }, ...venuesData],
            value: activeFilters.venue
        },
        {
            key: 'price',
            label: 'Price Per Hour',
            type: 'number',
            placeholder: 'e.g. 200',
            options: [],
            value: activeFilters.price
        }
    ];

    const columns = [
        {
            header: 'Sr.No',
            accessor: 'id',
            align: 'left',
            width: '80px',
            render: (row, index) => {

                return (
                    <div className="text-gray-600 font-medium text-sm">
                        {index + 1}
                    </div>
                )
            }
        },
        {
            header: 'Pitch Name/ID',
            accessor: 'id',
            align: 'center',

            render: (row) => (
                <div className="font-medium text-gray-900">
                    <div className="text-xs sm:text-sm">{row.translations?.name || `Pitch ${row.id}`}</div>
                    <div className="text-xs text-gray-500">#{row.id}</div>
                </div>
            )
        },
        {
            header: 'Venue',
            accessor: 'venue',
            align: 'center',

            render: (row) => <span className="text-gray-700 text-xs sm:text-sm">Venue #{row.venue}</span>
        },
        {
            header: 'Status',
            accessor: 'is_active',
            align: 'center',
            render: (row) => <StatusBadge isActive={row.is_active} />
        },
        {
            header: 'Type',
            accessor: 'size',
            align: 'center',
            render: (row) => <span className="text-gray-700 text-xs sm:text-sm">{row.size} a side</span>
        },
        {
            header: 'Pricing/hour',
            accessor: 'price_per_hour',
            align: 'center',
            render: (row) => <span className="font-medium text-gray-900 text-xs sm:text-sm">AED {parseFloat(row.price_per_hour || 0).toLocaleString()}</span>
        },
        {
            header: 'Quick Actions',
            align: 'right',
            render: (row) => <ActionButtons pitch={row} />
        }
    ];

    const topActions = [
        {
            label: 'Create Pitch',
            onClick: handleCreatePitch,
            type: 'primary'
        }
    ];

    // View Tabs Component (Fully Responsive)
    const ViewTabs = () => (
        <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-lg shadow-sm border border-primary-100 p-1 sm:p-1.5 mt-4 sm:mt-5 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
                {[
                    { key: 'all', label: 'All Pitches', count: stats.total },
                    { key: 'approved', label: 'Approved', count: stats.active },
                    { key: 'rejected', label: 'Rejected', count: stats.inactive },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleViewChange(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                            currentView === tab.key
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-secondary-600 hover:bg-primary-50'
                        }`}
                    >
                        <span className="truncate">{tab.label}</span>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                            currentView === tab.key
                                ? 'bg-primary-700 text-white'
                                : 'bg-gray-200 text-gray-600'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    // PREPARE PITCHES LIST FOR DROPDOWN
    const formattedPitchesList = useMemo(() => {
        return pitchesData.map(pitch => ({
            label: pitch.translations?.name || `Pitch #${pitch.id}`,
            value: pitch.id
        }));
    }, [pitchesData]);

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
                    title="Total Pitches"
                    value={stats.total}
                    icon={<TrendingUp className="text-blue-600" />}
                    gradient="from-blue-500 to-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="Active Pitches"
                    value={stats.active}
                    icon={<CheckCircle className="text-green-600" />}
                    gradient="from-green-500 to-green-600"
                    bgColor="bg-green-50"
                />
                <StatCard
                    title="Inactive Pitches"
                    value={stats.inactive}
                    icon={<XCircle className="text-red-600" />}
                    gradient="from-red-500 to-red-600"
                    bgColor="bg-red-50"
                />
                <StatCard
                    title="Pending Approval"
                    value={stats.pending}
                    icon={<Clock className="text-orange-600" />}
                    gradient="from-orange-500 to-orange-600"
                    bgColor="bg-orange-50"
                />
            </div>

            {/* Status Management Sections */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
                <StatusManagementSection
                    title="Approved Pitches"
                    pitches={approvedPitches}
                    statusType="approved"
                    emptyMessage="No approved pitches"
                />

                <StatusManagementSection
                    title="Rejected Pitches"
                    pitches={rejectedPitches}
                    statusType="rejected"
                    emptyMessage="No rejected pitches"
                />
            </div>

            {/* Form Section */}
            {showForm && (
                <div className='mb-6 sm:mb-8'>
                    <PitchesForm
                        venuesData={venuesData}
                        pitchesList={formattedPitchesList}
                        initialData={selectedPitch}
                        onCancel={handleCancelForm}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            )}

            {/* View Tabs */}
            <ViewTabs />

            {/* Main Table Section */}
            {isLoading && pitchesData.length === 0 ? (
                <div className="p-6 sm:p-10 text-center text-gray-500 text-sm sm:text-base">Loading...</div>
            ) : (
                <MainTable
                    data={filteredData || []}
                    columns={columns}
                    filters={filterConfig}
                    searchPlaceholder="Search pitch"
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

const StatusBadge = ({ isActive }) => {
    const style = isActive
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-red-100 text-red-800 border border-red-200';
    return (
        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${style} whitespace-nowrap`}>
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
};

export default Pitches;