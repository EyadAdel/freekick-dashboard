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

// --- Utils ---
import { getImageUrl } from '../../utils/imageUtils.js';

// --- HELPER COMPONENT: AVATAR ---
const OwnerAvatar = ({ image, name }) => {
    const getInitials = (n) => {
        if (!n) return '';
        const parts = n.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const cleanImage = (image && image !== "Null" && image !== "null") ? image : null;
    const imageUrl = getImageUrl(cleanImage);

    if (imageUrl) {
        return (
            <div className="w-10 h-10 min-w-[40px] rounded-full border border-gray-200 overflow-hidden shadow-sm">
                <img
                    src={imageUrl}
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
    const { t } = useTranslation();
    const style = isActive
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-red-100 text-red-800 border border-red-200';
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${style} whitespace-nowrap`}>
            {isActive
                ? t('pitchOwnerPage:table.content.active')
                : t('pitchOwnerPage:table.content.inactive')}
        </span>
    );
};

// --- MAIN COMPONENT ---
const PitchOwners = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useSelector((state) => state.auth);
    const rowsPerPage = 10;

    useEffect(() => {
        dispatch(setPageTitle(t('pitchOwnerPage:pageTitle')));
    }, [dispatch, t]);

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

    const apiFilters = useMemo(() => ({
        page: currentPage,
        page_limit: rowsPerPage,
        kind: 'pitch_owner',
        search: filters.search,
        is_active: filters.status === 'all' ? undefined : filters.status
    }), [currentPage, rowsPerPage, filters]);

    const fetchStaffData = async () => {
        setIsLoading(true);
        try {
            const response = await pitchOwnersService.getAllStaff(apiFilters);
            if (response) {
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
            toast.error(t('pitchOwnerPage:messages.loadError'));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGlobalData = async () => {
        try {
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

        const rawImage = (item.cover_photo && item.cover_photo !== "Null" && item.cover_photo !== "null") ? item.cover_photo : null;

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
            profile_image: getImageUrl(rawImage),
        };
        setSelectedOwner(prefilledData);
        setShowForm(true);
    };

    const handleRejectPartner = async (item) => {
        const isConfirmed = await showConfirm({
            title: t('pitchOwnerPage:modals.rejectTitle'),
            text: t('pitchOwnerPage:modals.rejectText'),
            confirmButtonText: t('pitchOwnerPage:modals.rejectConfirm'),
            icon: 'warning'
        });

        if (!isConfirmed) return;

        try {
            await bePartnerService.delete(item.id);
            toast.success(t('pitchOwnerPage:messages.rejectSuccess'));
            fetchPartnerRequests();
        } catch (error) {
            console.error(error);
        }
    };

    // --- CRUD Handlers ---

    const getOwnerName = (row) => row.user_info?.name || row.contact_name || t('pitchOwnerPage:table.content.unknownOwner');

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
            toast.error(t('pitchOwnerPage:messages.detailsError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewOwner = async (id) => {
        setIsLoading(true);
        try {
            const response = await pitchOwnersService.getStaffById(id);
            navigate('/pitch-owner/pitch-owner-details', { state: { ownerData: response } });
        } catch (error) {
            toast.error(t('pitchOwnerPage:messages.detailsError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteStaff = async (id, name) => {
        const isConfirmed = await showConfirm({
            title: t('pitchOwnerPage:modals.deleteTitle', { name }),
            text: t('pitchOwnerPage:modals.deleteText'),
            confirmButtonText: t('pitchOwnerPage:modals.deleteConfirm')
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
            toast.success(t('pitchOwnerPage:messages.deleteSuccess'));
        } catch (error) {
            toast.error(t('pitchOwnerPage:messages.deleteError'));
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
                toast.success(t('pitchOwnerPage:messages.partnerProcessSuccess'));
            } catch (error) {
                console.error("Failed to clean up partner request", error);
                toast.warning(t('pitchOwnerPage:messages.partnerProcessWarning'));
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
        // {
        //     key: 'status',
        //     label: t('pitchOwnerPage:table.headers.status'),
        //     type: 'select',
        //     options: [
        //         { label: t('pitchOwnerPage:tabs.all'), value: 'all' },
        //         { label: t('pitchOwnerPage:table.content.active'), value: 'true' },
        //         { label: t('pitchOwnerPage:table.content.inactive'), value: 'false' }
        //     ],
        //     value: filters.status || 'all'
        // }
    ];

    const columns = [
        {
            header: t('pitchOwnerPage:table.headers.no'),
            accessor: 'id',
            align: 'left',
            width: '50px',
            render: (row, index) => <div className="text-gray-500 font-medium text-sm">{index + 1 + ((currentPage - 1) * rowsPerPage)}</div>
        },
        {
            header: t('pitchOwnerPage:table.headers.ownerDetails'),
            accessor: 'user_info',
            align: 'left',
            render: (row) => {
                const ownerName = row.user_info?.name || row.contact_name || t('pitchOwnerPage:table.content.unknown');
                return (
                    <div className="flex items-center gap-3">
                        <OwnerAvatar image={row.profile_image || row.image} name={ownerName} />
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-semibold text-sm">{ownerName}</span>
                            <span className="text-primary-600 text-xs font-medium flex items-center gap-1 mt-0.5">
                                🏟 {row.pitch_name || row.name || t('pitchOwnerPage:table.content.noPitchName')}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: t('pitchOwnerPage:table.headers.contactInfo'),
            accessor: 'email',
            align: 'left',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-gray-700 text-sm">{row.email}</span>
                    <span className="text-gray-500 text-xs mt-0.5 font-mono">{row.contact_phone || t('pitchOwnerPage:table.content.noPhone')}</span>
                </div>
            )
        },
        {
            header: t('pitchOwnerPage:table.headers.location'),
            accessor: 'city',
            align: 'left',
            render: (row) => (
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                    {(row.city || row.state) ? (
                        <>
                            <MapPin size={14} className="text-gray-400"/>
                            <span className="capitalize">{row.city} {row.state ? `, ${row.state}` : ''}</span>
                        </>
                    ) : <span className="text-gray-300 text-xs italic">{t('pitchOwnerPage:table.content.notSet')}</span>}
                </div>
            )
        },
        {
            header: t('pitchOwnerPage:table.headers.status'),
            accessor: 'is_active',
            align: 'center',
            render: (row) => <StatusBadge isActive={row.is_active} />
        },
        {
            header: t('pitchOwnerPage:table.headers.actions'),
            align: 'right',
            render: (row) => (
                <div className="flex justify-end items-center gap-2">
                    <button
                        onClick={() => handleViewOwner(row.id)}
                        className="text-gray-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        title={t('pitchOwnerPage:actions.view')}
                    >
                        <Eye size={18} />
                    </button>
                    {user?.role?.is_admin && (
                        <>
                            <button
                                onClick={() => handleEditStaff(row)}
                                className="text-gray-500 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                                title={t('pitchOwnerPage:actions.edit')}
                            >
                                <Pencil size={18}/>
                            </button>
                            <button
                                onClick={() => handleDeleteStaff(row.id, getOwnerName(row))}
                                className="text-gray-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title={t('pitchOwnerPage:actions.delete')}
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
            label: t('pitchOwnerPage:actions.create'),
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
            <div className="grid grid-cols-3 gap-3 sm:gap-6 my-6">
                <StatCard
                    title={t('pitchOwnerPage:stats.total')}
                    value={allStaff.length}
                    icon={Users}
                    iconColor="text-blue-600"
                />
                <StatCard
                    title={t('pitchOwnerPage:stats.active')}
                    value={allStaff.filter(s => s.is_active).length}
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />
                <StatCard
                    title={t('pitchOwnerPage:stats.inactive')}
                    value={allStaff.filter(s => !s.is_active).length}
                    icon={XCircle}
                    iconColor="text-red-600"
                />
            </div>

            {/* Partner Requests Section */}
            {partnerRequests.length > 0 && (
                <div className="mb-8 animate-fade-in-down">
                    <StatusManagementSection
                        title={t('pitchOwnerPage:partnerRequests.title')}
                        name={{
                            single: t('pitchOwnerPage:partnerRequests.single'),
                            group: t('pitchOwnerPage:partnerRequests.group')
                        }}
                        onItemClick={(item) => handleViewOwner(item.id)}
                        itemClassName="cursor-pointer hover:bg-gray-50 transition-all border border-transparent hover:border-primary-200 shadow-sm"
                        items={partnerRequests}
                        statusType="pending"
                        emptyMessage={t('pitchOwnerPage:partnerRequests.empty')}
                        onApprove={handleApprovePartner}
                        onReject={handleRejectPartner}
                        approveLabel={t('pitchOwnerPage:partnerRequests.approveBtn')}
                        rejectLabel={t('pitchOwnerPage:partnerRequests.rejectBtn')}
                        idKey="id"
                        isActiveKey="is_active"
                        renderIcon={(item) => {
                            const cleanCover = (item.cover_photo && item.cover_photo !== "Null" && item.cover_photo !== "null") ? item.cover_photo : null;
                            const imageUrl = getImageUrl(cleanCover);
                            return imageUrl ? (
                                <img src={imageUrl} alt="Cover" className="w-full h-full object-cover rounded-lg"/>
                            ) : <ImageIcon className="text-white w-5 h-5"/>;
                        }}
                        renderHeader={(item) => (
                            <div className="flex flex-col">
                                <span className="font-bold text-secondary-800 text-sm">{item.contact_name}</span>
                                <span className="text-xs text-primary-600 font-medium">{item.club_name}</span>
                            </div>
                        )}
                        renderMeta={(item) => (
                            <>
                                <div className="flex items-center gap-1"><Mail size={12}/> {item.contact_email}</div>
                                {item.contact_phone &&
                                    <div className="flex items-center gap-1"><Phone size={12}/> {item.contact_phone}
                                    </div>}
                                {item.city &&
                                    <div className="flex items-center gap-1"><MapPin size={12}/> {item.city}</div>}
                            </>
                        )}
                    />
                </div>
            )}



            {/* Main Table */}
            <div className='bg-white rounded-lg shadow-sm p-5'>
                {isLoading && staffData.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">{t('pitchOwnerPage:table.loading')}</div>
                ) : (
                    <MainTable
                        data={staffData}
                        columns={columns}
                        filters={filterConfig}
                        searchPlaceholder={t('pitchOwnerPage:search.placeholder')}
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