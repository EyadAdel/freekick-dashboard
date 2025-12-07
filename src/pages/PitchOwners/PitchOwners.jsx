import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // <--- Import useNavigate
import MainTable from './../../components/MainTable';
import StatCard from './../../components/Charts/StatCards.jsx';
import PitchOwnerForm from '../../components/pitchOwners/PitchOwnerForm.jsx';
import {
    Pencil, Trash2, CheckCircle, XCircle,
    Users, MapPin, Eye // <--- Import Eye, Removed UserCheck/UserX
} from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import { pitchOwnersService } from '../../services/pitchOwners/pitchOwnersService.js';
import { showConfirm } from '../../components/showConfirm';
import { toast } from 'react-toastify';

// --- HELPER COMPONENT: AVATAR ---
const OwnerAvatar = ({ image, name }) => {
    const getInitials = (n) => {
        if (!n) return '';
        const parts = n.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    if (image) {
        return (
            <div className="w-10 h-10 min-w-[40px] rounded-full border border-gray-200 overflow-hidden shadow-sm">
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>
        );
    }

    const initials = getInitials(name);

    if (initials) {
        return (
            <div className="w-10 h-10 min-w-[40px] rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm text-white font-bold text-xs tracking-wider border border-white">
                {initials}
            </div>
        );
    }

    return (
        <div className="w-10 h-10 min-w-[40px] rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
            <Users size={18} />
        </div>
    );
};

// --- HELPER COMPONENT: STATUS BADGE ---
const StatusBadge = ({ isActive }) => {
    const style = isActive
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-red-100 text-red-800 border border-red-200';
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${style} whitespace-nowrap`}>
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
};

// --- MAIN COMPONENT ---
const PitchOwners = () => {
    const rowsPerPage = 10;
    const dispatch = useDispatch();
    const navigate = useNavigate(); // <--- Initialize hook

    useEffect(() => {
        dispatch(setPageTitle('Pitch Owners'));
    }, [dispatch]);

    // --- STATE MANAGEMENT ---
    const [staffData, setStaffData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Form Toggle State
    const [showForm, setShowForm] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState(null);

    // Filter State
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        search: ''
    });

    // View State
    const [currentView, setCurrentView] = useState('all');

    // --- FETCH DATA (LIST) ---
    const fetchStaffData = async () => {
        setIsLoading(true);
        try {
            const response = await pitchOwnersService.getAllStaff({
                page: currentPage,
                kind: "pitch_owner"
            });

            if (response && response.results) {
                setStaffData(response.results);
                setTotalCount(response.count);
            } else if (Array.isArray(response)) {
                setStaffData(response);
                setTotalCount(response.length);
            }
        } catch (error) {
            console.error("Failed to fetch pitch owners:", error);
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if we are NOT in form view
        if (!showForm) {
            fetchStaffData();
        }
    }, [currentPage, showForm]);

    // --- HANDLERS ---
    const getOwnerName = (row) => row.user_info?.name || row.contact_name || "Unknown Owner";

    // Toggle Form: Create
    const handleCreateStaff = () => {
        setSelectedOwner(null);
        setShowForm(true);
    };

    // Toggle Form: Edit
    const handleEditStaff = async (staff) => {
        setIsLoading(true);
        try {
            const fullStaffDetails = await pitchOwnersService.getStaffById(staff.id);
            setSelectedOwner(fullStaffDetails);
            setShowForm(true);
        } catch (error) {
            console.error("Failed to fetch owner details:", error);
            if (!toast.isActive("fetch-error")) {
                toast.error("Could not load owner details.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- NEW HANDLER: View One and Navigate ---
    const handleViewOwner = async (id) => {
        setIsLoading(true);
        try {
            // 1. Call View One API
            const response = await pitchOwnersService.getStaffById(id);

            // 2. Navigate and pass response to state
            // access this in the new page via: const { state } = useLocation();
            navigate('/pitch-owner/pitch-owner-details', {
                state: {
                    ownerData: response // Passing the full API response
                }
            });

        } catch (error) {
            console.error("Failed to view owner:", error);
            toast.error("Failed to load details");
        } finally {
            setIsLoading(false);
        }
    };

    // Form Callback: Cancel
    const handleFormCancel = () => {
        setShowForm(false);
        setSelectedOwner(null);
    };

    // Form Callback: Success
    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedOwner(null);
        fetchStaffData(); // Refresh list data
    };

    const handleDeleteStaff = async (id, name) => {
        const isConfirmed = await showConfirm({
            title: `Delete "${name}"?`,
            text: "This action cannot be undone.",
            confirmButtonText: 'Yes, Delete'
        });

        if (!isConfirmed) return;

        try {
            await pitchOwnersService.deleteStaff(id);
            setStaffData(prev => prev.filter(item => item.id !== id));
            toast.success("Deleted successfully");
        } catch (error) {
            console.error("Delete Error:", error);
            toast.error("Failed to delete");
        }
    };

    // --- FILTERS & MEMOS ---
    const filteredData = useMemo(() => {
        if (!staffData) return [];

        let filtered = staffData.filter((item) => {
            if (activeFilters.status && activeFilters.status !== 'all') {
                if (String(item.is_active) !== activeFilters.status) return false;
            }

            if (activeFilters.search) {
                const search = activeFilters.search.toLowerCase();
                const ownerName = (item.user_info?.name || item.contact_name || '').toLowerCase();
                const pitchName = (item.pitch_name || item.name || '').toLowerCase();
                const email = (item.email || '').toLowerCase();
                const phone = (item.contact_phone || item.user_info?.phone || '').toLowerCase();
                const city = (item.city || '').toLowerCase();

                if (
                    !ownerName.includes(search) &&
                    !pitchName.includes(search) &&
                    !email.includes(search) &&
                    !phone.includes(search) &&
                    !city.includes(search)
                ) {
                    return false;
                }
            }
            return true;
        });

        switch (currentView) {
            case 'active':
                filtered = filtered.filter(item => item.is_active);
                break;
            case 'inactive':
                filtered = filtered.filter(item => !item.is_active);
                break;
            case 'all':
            default:
                break;
        }

        return filtered;
    }, [staffData, activeFilters, currentView]);

    const stats = useMemo(() => {
        const total = staffData.length;
        const active = staffData.filter(i => i.is_active).length;
        const inactive = staffData.filter(i => !i.is_active).length;
        return { total, active, inactive };
    }, [staffData]);

    const handleSearch = (term) => {
        setActiveFilters(prev => ({ ...prev, search: term }));
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters) => {
        setActiveFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handleViewChange = (view) => {
        setCurrentView(view);
        setCurrentPage(1);
    };

    // --- TABLE CONFIGURATION ---
    const columns = [
        {
            header: 'No.',
            accessor: 'id',
            align: 'left',
            width: '50px',
            render: (row, index) => (
                <div className="text-gray-500 font-medium text-sm">
                    {index + 1 + ((currentPage - 1) * rowsPerPage)}
                </div>
            )
        },
        {
            header: 'Owner Details',
            accessor: 'user_info',
            align: 'left',
            render: (row) => {
                const ownerName = row.user_info?.name || row.contact_name || "Unknown";
                return (
                    <div className="flex items-center gap-3">
                        <OwnerAvatar
                            image={row.profile_image || row.image}
                            name={ownerName}
                        />
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-semibold text-sm">
                                {ownerName}
                            </span>
                            <span className="text-primary-600 text-xs font-medium flex items-center gap-1 mt-0.5">
                                🏟 {row.pitch_name || row.name || "No Pitch Name"}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Contact Info',
            accessor: 'email',
            align: 'left',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-gray-700 text-sm">
                        {row.email}
                    </span>
                    <span className="text-gray-500 text-xs mt-0.5 font-mono">
                        {row.contact_phone || row.user_info?.phone || 'No Phone'}
                    </span>
                </div>
            )
        },
        {
            header: 'Location',
            accessor: 'city',
            align: 'left',
            render: (row) => (
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                    {(row.city || row.state) ? (
                        <>
                            <MapPin size={14} className="text-gray-400"/>
                            <span className="capitalize">{row.city} {row.state ? `, ${row.state}` : ''}</span>
                        </>
                    ) : (
                        <span className="text-gray-300 text-xs italic">Not set</span>
                    )}
                </div>
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
            render: (row) => (
                <div className="flex justify-end items-center gap-2">
                    {/* View Button (New) */}
                    <button
                        onClick={() => handleViewOwner(row.id)}
                        className="text-gray-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        title="View Details"
                    >
                        <Eye size={18} />
                    </button>

                    {/* Edit Button */}
                    <button
                        className="text-gray-500 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                        title="Edit Details"
                        onClick={() => handleEditStaff(row)}
                    >
                        <Pencil size={18} />
                    </button>

                    {/* Delete Button */}
                    <button
                        className="text-gray-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        onClick={() => handleDeleteStaff(row.id, getOwnerName(row))}
                        title="Delete Owner"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

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
        }
    ];

    const topActions = [
        {
            label: 'Create Pitch Owner',
            onClick: handleCreateStaff,
            type: 'primary'
        }
    ];

    // --- RENDER ---
    return (
        <div className="w-full px-2 sm:px-0">
            {showForm ? (
                // FORM VIEW
                <PitchOwnerForm
                    initialData={selectedOwner}
                    onCancel={handleFormCancel}
                    onSuccess={handleFormSuccess}
                />
            ) : (
                // LIST VIEW
                <>
                    {/* Statistics Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 my-6">
                        <StatCard
                            title="Total Owners"
                            value={stats.total}
                            icon={Users}
                            iconColor="text-white"
                        />
                        <StatCard
                            title="Active Owners"
                            value={stats.active}
                            icon={CheckCircle}
                            iconColor="text-white"
                        />
                        <StatCard
                            title="Inactive Owners"
                            value={stats.inactive}
                            icon={XCircle}
                            iconColor="text-white"
                        />
                    </div>

                    {/* View Tabs */}
                    <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-lg shadow-sm border border-primary-100 p-1.5 mt-5 mb-6">
                        <div className="flex space-x-1">
                            {[
                                { key: 'all', label: 'All Owners', count: stats.total },
                                { key: 'active', label: 'Active', count: stats.active },
                                { key: 'inactive', label: 'Inactive', count: stats.inactive },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleViewChange(tab.key)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                        currentView === tab.key
                                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                                            : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${
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

                    {/* Main Table */}
                    <div className='bg-white rounded-lg shadow-sm'>
                        {isLoading && staffData.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">Loading Pitch Owners...</div>
                        ) : (
                            <MainTable
                                data={filteredData || []}
                                columns={columns}
                                filters={filterConfig}
                                searchPlaceholder="Search name, pitch, city..."
                                topActions={topActions}
                                currentPage={currentPage}
                                totalItems={totalCount}
                                itemsPerPage={rowsPerPage}
                                onSearch={handleSearch}
                                onFilterChange={handleFilterChange}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default PitchOwners;