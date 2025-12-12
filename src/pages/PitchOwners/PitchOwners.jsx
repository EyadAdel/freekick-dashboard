import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

// Icons
import {
    Pencil, Trash2, CheckCircle, XCircle,
    Users, MapPin, Eye, Mail, Phone, Image as ImageIcon
} from 'lucide-react';

// Components
import MainTable from './../../components/MainTable';
import StatCard from './../../components/Charts/StatCards.jsx';
import PitchOwnerForm from '../../components/pitchOwners/PitchOwnerForm.jsx';
import { showConfirm } from '../../components/showConfirm';
import StatusManagementSection from '../../components/StatusManagementSection';

// Services
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import { pitchOwnersService } from '../../services/pitchOwners/pitchOwnersService.js';
import { bePartnerService } from '../../services/bePartner/bePartnerService.js';

// --- HELPER COMPONENT: AVATAR ---
const OwnerAvatar = ({ image, name }) => {
    const getInitials = (n) => {
        if (!n) return '';
        const parts = n.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const isValidImage = image && image !== "Null" && image !== "null";

    if (isValidImage) {
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
    return (
        <div className="w-10 h-10 min-w-[40px] rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm text-white font-bold text-xs tracking-wider border border-white">
            {initials || <Users size={18} />}
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
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation(); // You might want to pass a namespace here like 'pitchOwnersPage'
    const { user } = useSelector((state) => state.auth);
    const rowsPerPage = 10;

    useEffect(() => {
        dispatch(setPageTitle('Pitch Owners'));
    }, [dispatch]);

    // ================= STATE MANAGEMENT =================

    // 1. Table Data
    const [staffData, setStaffData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // 2. Global Data (For Stats Cards)
    const [allStaff, setAllStaff] = useState([]);

    // 3. Partner Requests Data
    const [partnerRequests, setPartnerRequests] = useState([]);

    // 4. Form & Selection
    const [showForm, setShowForm] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [convertingRequestId, setConvertingRequestId] = useState(null);

    // 5. Filters
    const [filters, setFilters] = useState({
        search: '',
        status: ''
    });

    // 6. View State
    const [currentView, setCurrentView] = useState('all');

    // ================= API CALLS =================

    // Prepare API filters exactly like Pitches page
    const apiFilters = useMemo(() => ({
        page: currentPage,
        page_limit: rowsPerPage,
        kind: 'pitch_owner',
        search: filters.search,
        is_active: filters.status === 'all' ? undefined : filters.status
    }), [currentPage, rowsPerPage, filters]);

    // Fetch Table Data
    const fetchStaffData = async () => {
        setIsLoading(true);
        try {
            const response = await pitchOwnersService.getAllStaff(apiFilters);
            if (response) {
                // Handle both pagination format and simple array format just in case
                if (response.results) {
                    setStaffData(response.results);
                    setTotalItems(response.count || 0);
                } else if (Array.isArray(response)) {
                    setStaffData(response);
                    setTotalItems(response.length);
                }
            }
        } catch (error) {
            console.error("Failed to load staff:", error);
            toast.error("Failed to load pitch owners data");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch Global Data for Stats (Total, Active, Inactive cards)
    const fetchGlobalData = async () => {
        try {
            // Fetch a large number to calculate stats client-side or use a specific stats endpoint
            const response = await pitchOwnersService.getAllStaff({
                kind: 'pitch_owner'
            });
            if (response && response.results) {
                setAllStaff(response.results);
            }
        } catch (error) {
            console.error("Failed to fetch global staff data:", error);
        }
    };

    const fetchPartnerRequests = async () => {
        try {
            const response = await bePartnerService.getAll();
            setPartnerRequests(response.results || []);
        } catch (error) {
            console.error("Failed to load partner requests:", error);
        }
    };

    useEffect(() => {
        fetchGlobalData();
        fetchPartnerRequests();
    }, []);

    useEffect(() => {
        fetchStaffData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiFilters]);

    // ================= HANDLERS =================

    const handleSearch = (term) => {
        setFilters(prev => ({ ...prev, search: term }));
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const handleViewChange = (view) => {
        setCurrentView(view);
        let statusValue = '';

        if (view === 'active') statusValue = 'true';
        if (view === 'inactive') statusValue = 'false';

        setFilters(prev => ({ ...prev, status: statusValue }));
        setCurrentPage(1);
    };

    // --- Partner Request Handlers ---

    const handleApprovePartner = (item) => {
        setConvertingRequestId(item.id);
        const prefilledData = {
            name: item.club_name,
            address: item.address,
            city: item.city,
            state: item.state,
            contact_name: item.contact_name,
            contact_phone: item.contact_phone,
            email: item.contact_email,
            eid: item.emirates_id,
            user_id: item.user.id,
            is_active: true,
            profile_image: (item.cover_photo && item.cover_photo !== "Null") ? item.cover_photo : null,
        };
        setSelectedOwner(prefilledData);
        setShowForm(true);
    };

    const handleRejectPartner = async (item) => {
        const isConfirmed = await showConfirm({
            title: "Reject Request",
            text: "This will remove the request permanently. Continue?",
            confirmButtonText: "Reject & Delete",
            icon: 'warning'
        });

        if (!isConfirmed) return;

        try {
            await bePartnerService.delete(item.id);
            toast.success("Request rejected");
            fetchPartnerRequests();
        } catch (error) {
            console.error(error);
        }
    };

    // --- CRUD Handlers ---

    const getOwnerName = (row) => row.user_info?.name || row.contact_name || "Unknown Owner";

    const handleCreateStaff = () => {
        setConvertingRequestId(null);
        setSelectedOwner(null);
        setShowForm(true);
    };

    const handleEditStaff = async (staff) => {
        setConvertingRequestId(null);
        setIsLoading(true);
        try {
            const fullStaffDetails = await pitchOwnersService.getStaffById(staff.id);
            setSelectedOwner(fullStaffDetails);
            setShowForm(true);
        } catch (error) {
            toast.error("Could not load owner details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewOwner = async (id) => {
        // Option 1: Fetch details then navigate
        setIsLoading(true);
        try {
            const response = await pitchOwnersService.getStaffById(id);
            navigate('/pitch-owner/pitch-owner-details', { state: { ownerData: response } });
        } catch (error) {
            toast.error("Failed to load details");
        } finally {
            setIsLoading(false);
        }
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
            if (staffData.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchStaffData();
            }
            fetchGlobalData(); // Update stats
            toast.success("Deleted successfully");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setSelectedOwner(null);
        setConvertingRequestId(null);
    };

    const handleFormSuccess = async () => {
        if (convertingRequestId) {
            try {
                await bePartnerService.delete(convertingRequestId);
                toast.success("Partner request processed successfully.");
            } catch (error) {
                console.error("Failed to clean up partner request", error);
                toast.warning("Owner created, but failed to remove request from queue.");
            }
        }

        setShowForm(false);
        setSelectedOwner(null);
        setConvertingRequestId(null);
        fetchStaffData();
        fetchGlobalData();
        fetchPartnerRequests();
    };

    // ================= TABLE CONFIG =================

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
            value: filters.status || 'all'
        }
    ];

    const columns = [
        {
            header: 'No.',
            accessor: 'id',
            align: 'left',
            width: '50px',
            render: (row, index) => <div className="text-gray-500 font-medium text-sm">{index + 1 + ((currentPage - 1) * rowsPerPage)}</div>
        },
        {
            header: 'Owner Details',
            accessor: 'user_info',
            align: 'left',
            render: (row) => {
                const ownerName = row.user_info?.name || row.contact_name || "Unknown";
                return (
                    <div className="flex items-center gap-3">
                        <OwnerAvatar image={row.profile_image || row.image} name={ownerName} />
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-semibold text-sm">{ownerName}</span>
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
                    <span className="text-gray-700 text-sm">{row.email}</span>
                    <span className="text-gray-500 text-xs mt-0.5 font-mono">{row.contact_phone || 'No Phone'}</span>
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
                    ) : <span className="text-gray-300 text-xs italic">Not set</span>}
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
                    <button
                        onClick={() => handleViewOwner(row.id)}
                        className="text-gray-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        title="View Details"
                    >
                        <Eye size={18} />
                    </button>
                    {user?.role?.is_admin && (
                        <>
                            <button
                                onClick={() => handleEditStaff(row)}
                                className="text-gray-500 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                                title="Edit"
                            >
                                <Pencil size={18}/>
                            </button>
                            <button
                                onClick={() => handleDeleteStaff(row.id, getOwnerName(row))}
                                className="text-gray-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    const topActions = [
        {
            label: 'Create Pitch Owner',
            onClick: handleCreateStaff,
            type: 'primary'
        }
    ];

    // ================= RENDER =================

    if (!user || !user.role) return null;

    if (showForm) {
        return (
            <PitchOwnerForm
                initialData={selectedOwner}
                onCancel={handleFormCancel}
                onSuccess={handleFormSuccess}
            />
        );
    }

    return (
        <div className="w-full px-2 sm:px-0">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 my-6">
                <StatCard
                    title="Total Owners"
                    value={allStaff.length}
                    icon={Users}
                    iconColor="text-blue-600"
                />
                <StatCard
                    title="Active Owners"
                    value={allStaff.filter(s => s.is_active).length}
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />
                <StatCard
                    title="Inactive Owners"
                    value={allStaff.filter(s => !s.is_active).length}
                    icon={XCircle}
                    iconColor="text-red-600"
                />
            </div>

            {/* Partner Requests Section */}
            {partnerRequests.length > 0 && (
                <div className="mb-8 animate-fade-in-down">
                    <StatusManagementSection
                        title="New Partner Requests"
                        name={{ single: 'Request', group: 'Requests' }}
                        items={partnerRequests}
                        statusType="pending"
                        emptyMessage="No requests"
                        onApprove={handleApprovePartner}
                        onReject={handleRejectPartner}
                        approveLabel="Approve & Create"
                        rejectLabel="Reject"
                        idKey="id"
                        isActiveKey="is_active"
                        renderIcon={(item) => {
                            const hasImage = item.cover_photo && item.cover_photo !== "Null" && item.cover_photo !== "null";
                            return hasImage ? (
                                <img src={item.cover_photo} alt="Cover" className="w-full h-full object-cover rounded-lg" />
                            ) : <ImageIcon className="text-white w-5 h-5" />;
                        }}
                        renderHeader={(item) => (
                            <div className="flex flex-col">
                                <span className="font-bold text-secondary-800 text-sm">{item.contact_name}</span>
                                <span className="text-xs text-primary-600 font-medium">{item.club_name}</span>
                            </div>
                        )}
                        renderMeta={(item) => (
                            <>
                                <div className="flex items-center gap-1"><Mail size={12} /> {item.contact_email}</div>
                                {item.contact_phone && <div className="flex items-center gap-1"><Phone size={12} /> {item.contact_phone}</div>}
                                {item.city && <div className="flex items-center gap-1"><MapPin size={12} /> {item.city}</div>}
                            </>
                        )}
                    />
                </div>
            )}

            {/* View Tabs */}
            <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-lg shadow-sm border border-primary-100 p-1.5 mt-5 mb-6">
                <div className="flex space-x-1">
                    {[
                        { key: 'all', label: 'All Owners' },
                        { key: 'active', label: 'Active Owners' },
                        { key: 'inactive', label: 'Inactive Owners' }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleViewChange(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm capitalize transition-all duration-200 ${
                                currentView === tab.key
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                                    : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Table */}
            <div className='bg-white rounded-lg shadow-sm p-5'>
                {isLoading && staffData.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">Loading Pitch Owners...</div>
                ) : (
                    <MainTable
                        data={staffData}
                        columns={columns}
                        filters={filterConfig}
                        searchPlaceholder="Search name, pitch, city..."
                        topActions={user.role.is_admin ? topActions : []}
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={rowsPerPage}
                        onSearch={handleSearch}
                        onFilterChange={handleFilterChange}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </div>
    );
};

export default PitchOwners;