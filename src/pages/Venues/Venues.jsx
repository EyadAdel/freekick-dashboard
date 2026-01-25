// pages/Venues/Venues.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainTable from './../../components/MainTable';
import {
    Eye, Pencil, Trash2, CheckCircle, XCircle, TrendingUp,
    MapPin, ExternalLink, Phone, User, Clock
} from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import VenuesForm from "../../components/venues/VenuesForm.jsx";
import { venuesService } from '../../services/venues/venuesService.js';
import { daysOfWeekService } from '../../services/daysOfWeek/daysOfWeekService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import { toast } from 'react-toastify';
import StatusManagementSection, { StatusBadge } from './../../components/StatusManagementSection';
import StatCard from '../../components/Charts/StatCards.jsx';

const Venues = () => {
    const { t } = useTranslation('venuesPage');
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);

    // ================= STATE MANAGEMENT =================
    const itemsPerPage = 10;

    const [venuesData, setVenuesData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [allVenues, setAllVenues] = useState([]);
    const [daysList, setDaysList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({
        key: null,
        order: 'asc'
    });

    const [filters, setFilters] = useState({
        search: '',
        venueType: '',
        status: '',
        acceptedFromAdmin: '' // NEW: Admin acceptance filter
    });

    const [currentView, setCurrentView] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState(null);

    const staticVenueTypes = useMemo(() => [
        { label: t('filters.type.indoor'), value: 'indoor' },
        { label: t('filters.type.outdoor'), value: 'outdoor' }
    ], [t]);

    // ================= HELPER FUNCTIONS =================

    function getOrderingParam(key, order) {
        const orderingMap = {
            'id': 'id',
            'name': 'translations__name',
            'venue_type': 'venue_type',
            'is_active': 'is_active',
            'created_at': 'created_at',
            'accepted_from_admin': 'accepted_from_admin'
        };
        const field = orderingMap[key] || key;
        return order === 'desc' ? `-${field}` : field;
    }

    // ================= API CALLS =================

    const apiFilters = useMemo(() => ({
        page: currentPage,
        page_limit: itemsPerPage,
        search: filters.search,
        venue_type: filters.venueType === 'all' ? undefined : filters.venueType,
        is_active: filters.status === 'all' ? undefined : filters.status,
        accepted_from_admin: filters.acceptedFromAdmin === 'all' ? undefined : filters.acceptedFromAdmin,
        ...(sortConfig.key && {
            ordering: getOrderingParam(sortConfig.key, sortConfig.order)
        })
    }), [currentPage, itemsPerPage, filters, sortConfig]);

    const fetchFilterOptions = async () => {
        try {
            const daysRes = await daysOfWeekService.getAll({ all_languages: true });
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
            if (daysList.length === 0) {
                await fetchFilterOptions();
            }
            const response = await venuesService.getAllVenues(apiFilters);

            if (response) {
                setVenuesData(response.results || []);
                setTotalItems(response.count || 0);
            }
        } catch (error) {
            console.error("Failed to fetch venues:", error);
            toast.error(t('messages.errorLoad'));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGlobalData = async () => {
        try {
            const response = await venuesService.getAllVenues({ page_limit: 10000 });
            if (response && response.results) {
                setAllVenues(response.results);
                console.log(response.results,'llllllllll')
            }
        } catch (error) {
            console.error("Failed to fetch global venue data:", error);
        }
    };

    useEffect(() => {
        fetchGlobalData();
    }, []);

    useEffect(() => {
        fetchVenuesData();
    }, [apiFilters]);

    // ================= HANDLERS =================

    const handleSearch = (searchTerm) => {
        setFilters(prev => ({ ...prev, search: searchTerm }));
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters) => {
        const mappedFilters = {
            ...filters,
            venueType: newFilters.venueType !== undefined ? newFilters.venueType : filters.venueType,
            status: newFilters.status !== undefined ? newFilters.status : filters.status,
            acceptedFromAdmin: newFilters.acceptedFromAdmin !== undefined ? newFilters.acceptedFromAdmin : filters.acceptedFromAdmin,
        };
        setFilters(mappedFilters);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }
        setSortConfig({ key, order });
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleViewChange = (viewKey) => {
        setCurrentView(viewKey);
        let statusValue = '';
        let acceptedValue = '';

        if (viewKey === 'active') statusValue = 'true';
        if (viewKey === 'inactive') statusValue = 'false';
        if (viewKey === 'pending') acceptedValue = 'null';
        if (viewKey === 'accepted') acceptedValue = 'true';
        if (viewKey === 'rejected') acceptedValue = 'false';

        setFilters(prev => ({
            ...prev,
            status: statusValue,
            acceptedFromAdmin: acceptedValue
        }));
        setCurrentPage(1);
    };

    // CRUD Handlers
    const handleViewVenue = async (venue) => {
        try {
            navigate(`/venues/venue-details/${venue.id}`);
        } catch (error) {
            console.error("Failed to fetch venue details:", error);
            toast.error(t('messages.errorDetails'));
        }
    };

    const handleActivateVenue = async (venue) => {
        const name = venue.translations?.name || `Venue ${venue.id}`;
        const isConfirmed = await showConfirm({
            title: t('confirm.activate.title', { name }),
            text: t('confirm.activate.text'),
            confirmButtonText: t('confirm.activate.btn')
        });

        if (!isConfirmed) return;

        try {
            await venuesService.updateVenue(venue.id, { is_active: true });
            fetchVenuesData();
            fetchGlobalData();
        } catch (error) {
            console.error("Failed to activate venue:", error);
        }
    };

    const handleDeactivateVenue = async (venue) => {
        const name = venue.translations?.name || `Venue ${venue.id}`;
        const isConfirmed = await showConfirm({
            title: t('confirm.deactivate.title', { name }),
            text: t('confirm.deactivate.text'),
            confirmButtonText: t('confirm.deactivate.btn')
        });

        if (!isConfirmed) return;

        try {
            await venuesService.updateVenue(venue.id, { is_active: false });
            fetchVenuesData();
            fetchGlobalData();
        } catch (error) {
            console.error("Failed to deactivate venue:", error);
        }
    };

    // NEW: Admin Acceptance Handlers
    const handleAcceptVenue = async (venue) => {
        const name = venue.translations?.name || `Venue ${venue.id}`;
        const isConfirmed = await showConfirm({
            title: t('confirm.accept.title', { name }),
            text: t('confirm.accept.text'),
            confirmButtonText: t('confirm.accept.btn')
        });

        if (!isConfirmed) return;

        try {
            await venuesService.updateVenue(venue.id, { accepted_from_admin: true });
            toast.success(t('messages.acceptSuccess'));
            fetchVenuesData();
            fetchGlobalData();
        } catch (error) {
            console.error("Failed to accept venue:", error);
            toast.error(t('messages.acceptError'));
        }
    };

    const handleRejectVenue = async (venue) => {
        const name = venue.translations?.name || `Venue ${venue.id}`;
        const isConfirmed = await showConfirm({
            title: t('confirm.reject.title', { name }),
            text: t('confirm.reject.text'),
            confirmButtonText: t('confirm.reject.btn')
        });

        if (!isConfirmed) return;

        try {
            await venuesService.updateVenue(venue.id, { accepted_from_admin: false });
            toast.success(t('messages.rejectSuccess'));
            fetchVenuesData();
            fetchGlobalData();
        } catch (error) {
            console.error("Failed to reject venue:", error);
            toast.error(t('messages.rejectError'));
        }
    };

    const handleDeleteVenue = async (id, venueName) => {
        const isConfirmed = await showConfirm({
            title: t('confirm.delete.title', { name: venueName }),
            text: t('confirm.delete.text'),
            confirmButtonText: t('confirm.delete.btn')
        });

        if (!isConfirmed) return;

        try {
            await venuesService.deleteVenue(id);
            if (venuesData.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchVenuesData();
            }
            fetchGlobalData();
        } catch (error) {
            console.error("Failed to delete venue:", error);
        }
    };

    const handleCreateVenue = () => {
        setSelectedVenue(null);
        setShowForm(true);
    };

    const handleEditVenue = async (venue) => {
        setIsLoading(true);
        const allLanguage = true;
        try {
            const fullVenueData = await venuesService.getVenueById(venue.id, allLanguage);
            setSelectedVenue(fullVenueData);
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error("Failed to fetch venue details for editing:", error);
            toast.error(t('messages.errorDetails'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setSelectedVenue(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedVenue(null);
        fetchVenuesData();
        fetchGlobalData();
    };

    // ================= DATA PROCESSING =================

    const globalActiveVenues = useMemo(() => allVenues.filter(v => v.is_active), [allVenues]);
    const globalInactiveVenues = useMemo(() => allVenues.filter(v => !v.is_active), [allVenues]);

    // NEW: Admin Acceptance Lists
    const globalPendingVenues = useMemo(() => allVenues.filter(v => v.accepted_from_admin === null), [allVenues]);
    const globalAcceptedVenues = useMemo(() => allVenues.filter(v => v.accepted_from_admin === true), [allVenues]);
    const globalRejectedVenues = useMemo(() => allVenues.filter(v => v.accepted_from_admin === false), [allVenues]);

    // ================= CUSTOM RENDER FUNCTIONS =================
    const renderVenueIcon = () => (
        <MapPin className="text-white w-5 h-5" />
    );

    const renderVenueHeader = (venue) => (
        <span className="font-semibold text-secondary-600 text-xs sm:text-sm truncate">
            {venue.translations?.name || `Venue ${venue.id}`}
        </span>
    );

    const renderVenueMeta = (venue) => {
        const typeLabel = venue.venue_type === 'indoor' ? t('filters.type.indoor')
            : venue.venue_type === 'outdoor' ? t('filters.type.outdoor')
                : venue.venue_type || t('table.rows.na');

        return (
            <>
                <span className="font-medium text-gray-600">{t('filters.type.label')}:</span>
                <span className="ml-1 text-gray-500">{typeLabel}</span>
            </>
        );
    };

    // NEW: Admin Status Badge Component
    const AdminStatusBadge = ({ acceptedFromAdmin }) => {
        if (acceptedFromAdmin === null) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    <Clock size={12} />
                    {t('adminStatus.pending')}
                </span>
            );
        }
        if (acceptedFromAdmin === true) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle size={12} />
                    {t('adminStatus.accepted')}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <XCircle size={12} />
                {t('adminStatus.rejected')}
            </span>
        );
    };

    // ================= TABLE CONFIGURATION =================
    const filterConfig = useMemo(() => [
        {
            key: 'status', label: t('filters.status.label'), type: 'select',
            options: [
                { label: t('filters.status.all'), value: 'all' },
                { label: t('filters.status.active'), value: 'true' },
                { label: t('filters.status.inactive'), value: 'false' }
            ],
            value: filters.status || 'all'
        },
        {
            key: 'venueType', label: t('filters.type.label'), type: 'select',
            options: [{ label: t('filters.type.all'), value: 'all' }, ...staticVenueTypes],
            value: filters.venueType || 'all'
        },
        {
            key: 'acceptedFromAdmin', label: t('filters.adminStatus.label'), type: 'select',
            options: [
                { label: t('filters.adminStatus.all'), value: 'all' },
                { label: t('filters.adminStatus.pending'), value: 'null' },
                { label: t('filters.adminStatus.accepted'), value: 'true' },
                { label: t('filters.adminStatus.rejected'), value: 'false' }
            ],
            value: filters.acceptedFromAdmin || 'all'
        }
    ], [t, filters.status, filters.venueType, filters.acceptedFromAdmin, staticVenueTypes]);

    const ActionButtons = ({ venue }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button className="text-gray-500 hover:text-teal-600 p-1 rounded transition-colors hover:bg-gray-50"
                    title={t('actions.view')}
                    onClick={() => handleViewVenue(venue)}>
                <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
                    title={t('actions.edit')}
                    onClick={() => handleEditVenue(venue)}>
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
                    title={t('actions.delete')}
                    onClick={() => handleDeleteVenue(venue.id, venue.translations?.name || `Venue ${venue.id}`)}>
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
        </div>
    );

    const columns = useMemo(() => [
        {
            header: t('table.headers.srNo'),
            accessor: 'id',
            align: 'left',
            width: '60px',
            sortable: true,
            sortKey: 'id',
            render: (row, i) => <div className="text-gray-600 font-medium text-sm">{row.id}</div>
        },
        {
            header: t('table.headers.venue'),
            accessor: 'name',
            align: 'center',
            width: '200px',
            sortable: true,
            sortKey: 'name',
            render: (row) => {
                const typeLabel = row.venue_type === 'indoor' ? t('filters.type.indoor')
                    : row.venue_type === 'outdoor' ? t('filters.type.outdoor')
                        : row.venue_type || t('table.rows.na');

                return (
                    <div className="font-medium text-gray-900">
                        <div className="text-sm font-bold text-secondary-600">{row.translations?.name || `Venue ${row.id}`}</div>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${row.venue_type === 'indoor' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                {typeLabel}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: t('table.headers.contactInfo'),
            accessor: 'contact',
            align: 'center',
            sortable: false,
            render: (row) => {
                const name = row.contact_name || row.owner_info?.contact_name || t('table.rows.na');
                const phone = row.phone_number || row.owner_info?.contact_phone || t('table.rows.na');
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700"><User size={14} className="text-gray-400" /><span>{name}</span></div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={12} className="text-gray-400" /><span>{phone}</span></div>
                    </div>
                );
            }
        },
        {
            header: t('table.headers.location'),
            accessor: 'location',
            align: 'center',
            width: '250px',
            sortable: false,
            render: (row) => {
                const mapLink = row.latitude && row.longitude ? `https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}` : null;
                return (
                    <div>
                        <div className="text-xs text-gray-600 line-clamp-2 mb-1" title={row.address}>{row.address || row.translations?.address || t('table.rows.noAddress')}</div>
                        {mapLink && <a href={mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"><MapPin size={12} /> {t('table.rows.viewOnMap')} <ExternalLink size={10} /></a>}
                    </div>
                );
            }
        },
        {
            header: t('table.headers.playTypes'),
            accessor: 'venue_play_type',
            align: 'center',
            width: '180px',
            sortable: false,
            render: (row) => (
                <div className="flex flex-wrap gap-1.5 justify-center">
                    {row.venue_play_type?.length > 0 ? row.venue_play_type.map((t) => (
                        <span key={t.id} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] rounded-full font-medium whitespace-nowrap">{t.translations?.name}</span>
                    )) : <span className="text-xs text-gray-400 italic">{t('table.rows.none')}</span>}
                </div>
            )
        },
        {
            header: t('table.headers.adminStatus'),
            accessor: 'accepted_from_admin',
            align: 'center',
            width: '120px',
            sortable: true,
            sortKey: 'accepted_from_admin',
            render: (row) => <AdminStatusBadge acceptedFromAdmin={row.accepted_from_admin} />
        },
        {
            header: t('table.headers.status'),
            accessor: 'is_active',
            align: 'center',
            width: '100px',
            sortable: true,
            sortKey: 'is_active',
            render: (row) => <StatusBadge isActive={row.is_active} />
        },
        {
            header: t('table.headers.actions'),
            align: 'right',
            width: '120px',
            render: (row) => <ActionButtons venue={row} />
        }
    ], [t]);

    const topActions = useMemo(() => [
        { label: t('actions.create'), onClick: handleCreateVenue, type: 'primary' }
    ], [t]);

    // ================= RENDER =================
    if (!user || !user.role) return false;
    const { role } = user;
    const isAdminOrSuper = role.is_admin || role.is_superuser;

    if (showForm) {
        return (
            <div className="w-full px-2 sm:px-0 mb-6 sm:mb-8">
                <VenuesForm
                    initialData={selectedVenue}
                    onCancel={handleCancelForm}
                    onSuccess={handleFormSuccess}
                />
            </div>
        );
    }

    return (
        <div className="w-full px-2 sm:px-0">
            {/* Stats Section with 6 Cards */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 my-4 sm:my-8">
                <StatCard
                    title={t('stats.totalFiltered')}
                    value={totalItems}
                    icon={TrendingUp}
                    iconColor="text-blue-600"
                />

                <StatCard
                    title={t('stats.active')}
                    value={globalActiveVenues.length}
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />

                <StatCard
                    title={t('stats.inactive')}
                    value={globalInactiveVenues.length}
                    icon={XCircle}
                    iconColor="text-red-600"
                />

                <StatCard
                    title={t('stats.pending')}
                    value={globalPendingVenues.length}
                    icon={Clock}
                    iconColor="text-yellow-600"
                />

                <StatCard
                    title={t('stats.accepted')}
                    value={globalAcceptedVenues.length}
                    icon={CheckCircle}
                    iconColor="text-emerald-600"
                />

                <StatCard
                    title={t('stats.rejected')}
                    value={globalRejectedVenues.length}
                    icon={XCircle}
                    iconColor="text-rose-600"
                />
            </div>

            {/* Status Management Lists */}
            {role.is_pitch_owner === false && (
                <>
                    {/* Active/Inactive Section */}
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 mb-6">
                        <StatusManagementSection
                            title={t('statusSection.activeTitle')}
                            name={{ single: t('entity.venue'), group: t('entity.venues') }}
                            items={globalActiveVenues}
                            statusType="approved"
                            emptyMessage={t('statusSection.noActive')}
                            onReject={handleDeactivateVenue}
                            onItemClick={handleViewVenue}
                            rejectLabel={t('statusSection.btnDeactivate')}
                            renderIcon={renderVenueIcon}
                            renderHeader={renderVenueHeader}
                            renderMeta={renderVenueMeta}
                        />

                        <StatusManagementSection
                            title={t('statusSection.inactiveTitle')}
                            name={{ single: t('entity.venue'), group: t('entity.venues') }}
                            items={globalInactiveVenues}
                            statusType="rejected"
                            emptyMessage={t('statusSection.noInactive')}
                            onApprove={handleActivateVenue}
                            onItemClick={handleViewVenue}
                            approveLabel={t('statusSection.btnActivate')}
                            renderIcon={renderVenueIcon}
                            renderHeader={renderVenueHeader}
                            renderMeta={renderVenueMeta}
                        />
                    </div>

                    {/* Admin Acceptance Section - Only for Admin/SuperAdmin */}
                    {isAdminOrSuper && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                            {/* Pending Venues */}
                            <StatusManagementSection
                                title={t('adminSection.pendingTitle')}
                                name={{ single: t('entity.venue'), group: t('entity.venues') }}
                                items={globalPendingVenues}
                                statusType="pending"
                                emptyMessage={t('adminSection.noPending')}
                                onApprove={handleAcceptVenue}
                                onReject={handleRejectVenue}
                                onItemClick={handleViewVenue}
                                approveLabel={t('adminSection.btnAccept')}
                                rejectLabel={t('adminSection.btnReject')}
                                renderIcon={renderVenueIcon}
                                renderHeader={renderVenueHeader}
                                renderMeta={renderVenueMeta}
                            />

                            {/* Accepted Venues */}
                            <StatusManagementSection
                                title={t('adminSection.acceptedTitle')}
                                name={{ single: t('entity.venue'), group: t('entity.venues') }}
                                items={globalAcceptedVenues}
                                statusType="approved"
                                emptyMessage={t('adminSection.noAccepted')}
                                onReject={handleRejectVenue}
                                onItemClick={handleViewVenue}
                                rejectLabel={t('adminSection.btnReject')}
                                renderIcon={renderVenueIcon}
                                renderHeader={renderVenueHeader}
                                renderMeta={renderVenueMeta}
                            />

                            {/* Rejected Venues */}
                            <StatusManagementSection
                                title={t('adminSection.rejectedTitle')}
                                name={{ single: t('entity.venue'), group: t('entity.venues') }}
                                items={globalRejectedVenues}
                                statusType="rejected"
                                emptyMessage={t('adminSection.noRejected')}
                                onApprove={handleAcceptVenue}
                                onItemClick={handleViewVenue}
                                approveLabel={t('adminSection.btnAccept')}
                                renderIcon={renderVenueIcon}
                                renderHeader={renderVenueHeader}
                                renderMeta={renderVenueMeta}
                            />
                        </div>
                    )}
                </>
            )}

            {/* View Tabs */}
            <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-lg shadow-sm border border-primary-100 p-1 sm:p-1.5 mt-4 sm:mt-5 mb-4 sm:mb-6">
                <div className="flex flex-wrap gap-1">
                    {[
                        { key: 'all', label: t('viewTabs.all') },
                        { key: 'active', label: t('viewTabs.active') },
                        { key: 'inactive', label: t('viewTabs.inactive') },
                        ...(isAdminOrSuper ? [
                            { key: 'pending', label: t('viewTabs.pending') },
                            { key: 'accepted', label: t('viewTabs.accepted') },
                            { key: 'rejected', label: t('viewTabs.rejected') }
                        ] : [])
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => handleViewChange(tab.key)}
                                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${currentView === tab.key ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' : 'text-gray-600 hover:text-secondary-600 hover:bg-primary-50'}`}>
                            <span className="truncate">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Table */}
            {isLoading && venuesData.length === 0 ? (
                <div className="p-6 sm:p-10 text-center text-gray-500 text-sm sm:text-base">{t('loading')}</div>
            ) : (
                <MainTable
                    data={venuesData}
                    columns={columns}
                    filters={filterConfig}
                    searchPlaceholder={t('filters.searchPlaceholder')}
                    topActions={topActions}
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                />
            )}
        </div>
    );
};

export default Venues;
// // pages/Venues/Venues.jsx
// import React, { useEffect, useState, useMemo } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next'; // Import i18n hook
// import MainTable from './../../components/MainTable';
// import {
//     Eye, Pencil, Trash2, CheckCircle, XCircle, TrendingUp,
//     MapPin, ExternalLink, Phone, User
// } from 'lucide-react';
// import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
// import VenuesForm from "../../components/venues/VenuesForm.jsx";
// import { venuesService } from '../../services/venues/venuesService.js';
// import { daysOfWeekService } from '../../services/daysOfWeek/daysOfWeekService.js';
// import { showConfirm } from '../../components/showConfirm.jsx';
// import { toast } from 'react-toastify';
// import StatusManagementSection, { StatusBadge } from './../../components/StatusManagementSection';
// import StatCard from '../../components/Charts/StatCards.jsx';
//
// const Venues = () => {
//     const { t } = useTranslation('venuesPage'); // Initialize translation
//     const { user } = useSelector((state) => state.auth);
//     const dispatch = useDispatch();
//     const navigate = useNavigate();
//
//     // Update page title when language changes
//     useEffect(() => {
//         dispatch(setPageTitle(t('pageTitle')));
//     }, [dispatch, t]);
//
//     // ================= STATE MANAGEMENT =================
//     const itemsPerPage = 10;
//
//     // 1. Table Data (Paginated & Filtered)
//     const [venuesData, setVenuesData] = useState([]);
//     const [totalItems, setTotalItems] = useState(0);
//
//     // 2. Global Data (Unpaginated for Cards & Status Lists)
//     const [allVenues, setAllVenues] = useState([]);
//
//     const [daysList, setDaysList] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//
//     // Pagination & Sorting State
//     const [currentPage, setCurrentPage] = useState(1);
//     const [sortConfig, setSortConfig] = useState({
//         key: null,
//         order: 'asc'
//     });
//
//     // Filter State
//     const [filters, setFilters] = useState({
//         search: '',
//         venueType: '',
//         status: ''
//     });
//
//     const [currentView, setCurrentView] = useState('all');
//     const [showForm, setShowForm] = useState(false);
//     const [selectedVenue, setSelectedVenue] = useState(null);
//
//     // Memoized to update on language change
//     const staticVenueTypes = useMemo(() => [
//         { label: t('filters.type.indoor'), value: 'indoor' },
//         { label: t('filters.type.outdoor'), value: 'outdoor' }
//     ], [t]);
//
//     // ================= HELPER FUNCTIONS =================
//
//     function getOrderingParam(key, order) {
//         const orderingMap = {
//             'id': 'id',
//             'name': 'translations__name',
//             'venue_type': 'venue_type',
//             'is_active': 'is_active',
//             'created_at': 'created_at'
//         };
//         const field = orderingMap[key] || key;
//         return order === 'desc' ? `-${field}` : field;
//     }
//
//     // ================= API CALLS =================
//
//     // 1. Filters for the Main Table (Paginated)
//     const apiFilters = useMemo(() => ({
//         page: currentPage,
//         page_limit: itemsPerPage,
//         search: filters.search,
//         venue_type: filters.venueType === 'all' ? undefined : filters.venueType,
//         is_active: filters.status === 'all' ? undefined : filters.status,
//         ...(sortConfig.key && {
//             ordering: getOrderingParam(sortConfig.key, sortConfig.order)
//         })
//     }), [currentPage, itemsPerPage, filters, sortConfig]);
//
//     const fetchFilterOptions = async () => {
//         try {
//             const daysRes = await daysOfWeekService.getAll({ all_languages: true });
//             if (daysRes && daysRes.results) {
//                 setDaysList(daysRes.results);
//             }
//         } catch (error) {
//             console.error("Failed to fetch filter options:", error);
//         }
//     };
//
//     // 2. Fetch Function for Table (Paginated)
//     const fetchVenuesData = async () => {
//         setIsLoading(true);
//         try {
//             if (daysList.length === 0) {
//                 await fetchFilterOptions();
//             }
//             const response = await venuesService.getAllVenues(apiFilters);
//
//             if (response) {
//                 setVenuesData(response.results || []);
//                 setTotalItems(response.count || 0);
//             }
//         } catch (error) {
//             console.error("Failed to fetch venues:", error);
//             toast.error(t('messages.errorLoad'));
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     // 3. Fetch Function for Stats & Lists (Unpaginated / "View All")
//     const fetchGlobalData = async () => {
//         try {
//             // We pass a high limit to get all items, and NO filters
//             const response = await venuesService.getAllVenues({ page_limit: 10000 });
//             if (response && response.results) {
//                 setAllVenues(response.results);
//                 console.log(response.results,'kkkkkkk')
//             }
//         } catch (error) {
//             console.error("Failed to fetch global venue data:", error);
//         }
//     };
//
//     // Initial Fetch (Global Data)
//     useEffect(() => {
//         fetchGlobalData();
//     }, []);
//
//     // Table Fetch (When filters change)
//     useEffect(() => {
//         fetchVenuesData();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [apiFilters]);
//
//     // ================= HANDLERS =================
//
//     const handleSearch = (searchTerm) => {
//         setFilters(prev => ({ ...prev, search: searchTerm }));
//         setCurrentPage(1);
//     };
//
//     const handleFilterChange = (newFilters) => {
//         const mappedFilters = {
//             ...filters,
//             venueType: newFilters.venueType !== undefined ? newFilters.venueType : filters.venueType,
//             status: newFilters.status !== undefined ? newFilters.status : filters.status,
//         };
//         setFilters(mappedFilters);
//         setCurrentPage(1);
//     };
//
//     const handleSort = (key) => {
//         let order = 'asc';
//         if (sortConfig.key === key && sortConfig.order === 'asc') {
//             order = 'desc';
//         }
//         setSortConfig({ key, order });
//         setCurrentPage(1);
//     };
//
//     const handlePageChange = (page) => {
//         setCurrentPage(page);
//     };
//
//     const handleViewChange = (viewKey) => {
//         setCurrentView(viewKey);
//         let statusValue = '';
//         if (viewKey === 'active') statusValue = 'true';
//         if (viewKey === 'inactive') statusValue = 'false';
//
//         setFilters(prev => ({ ...prev, status: statusValue }));
//         setCurrentPage(1);
//     };
//
//     // CRUD Handlers
//     const handleViewVenue = async (venue) => {
//         try {
//             navigate('/venues/venue-details', {
//                 state: {
//                     venueId: venue.id,
//                     daysList: daysList
//                 }
//             });
//         } catch (error) {
//             console.error("Failed to fetch venue details:", error);
//             toast.error(t('messages.errorDetails'));
//         }
//     };
//
//     const handleActivateVenue = async (venue) => {
//         const name = venue.translations?.name || `Venue ${venue.id}`;
//         const isConfirmed = await showConfirm({
//             title: t('confirm.activate.title', { name }),
//             text: t('confirm.activate.text'),
//             confirmButtonText: t('confirm.activate.btn')
//         });
//
//         if (!isConfirmed) return;
//
//         try {
//             await venuesService.updateVenue(venue.id, { is_active: true });
//             fetchVenuesData(); // Refresh Table
//             fetchGlobalData(); // Refresh Stats & Lists
//         } catch (error) {
//             console.error("Failed to activate venue:", error);
//         }
//     };
//
//     const handleDeactivateVenue = async (venue) => {
//         const name = venue.translations?.name || `Venue ${venue.id}`;
//         const isConfirmed = await showConfirm({
//             title: t('confirm.deactivate.title', { name }),
//             text: t('confirm.deactivate.text'),
//             confirmButtonText: t('confirm.deactivate.btn')
//         });
//
//         if (!isConfirmed) return;
//
//         try {
//             await venuesService.updateVenue(venue.id, { is_active: false });
//             fetchVenuesData(); // Refresh Table
//             fetchGlobalData(); // Refresh Stats & Lists
//         } catch (error) {
//             console.error("Failed to deactivate venue:", error);
//         }
//     };
//
//     const handleDeleteVenue = async (id, venueName) => {
//         const isConfirmed = await showConfirm({
//             title: t('confirm.delete.title', { name: venueName }),
//             text: t('confirm.delete.text'),
//             confirmButtonText: t('confirm.delete.btn')
//         });
//
//         if (!isConfirmed) return;
//
//         try {
//             await venuesService.deleteVenue(id);
//             if (venuesData.length === 1 && currentPage > 1) {
//                 setCurrentPage(prev => prev - 1);
//             } else {
//                 fetchVenuesData();
//             }
//             fetchGlobalData(); // Refresh Stats & Lists
//         } catch (error) {
//             console.error("Failed to delete venue:", error);
//         }
//     };
//
//     const handleCreateVenue = () => {
//         setSelectedVenue(null);
//         setShowForm(true);
//     };
//
//     const handleEditVenue = async (venue) => {
//         setIsLoading(true);
//         const allLanguage = true;
//         try {
//             const fullVenueData = await venuesService.getVenueById(venue.id, allLanguage);
//             setSelectedVenue(fullVenueData);
//             setShowForm(true);
//             window.scrollTo({ top: 0, behavior: 'smooth' });
//         } catch (error) {
//             console.error("Failed to fetch venue details for editing:", error);
//             toast.error(t('messages.errorDetails'));
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     const handleCancelForm = () => {
//         setShowForm(false);
//         setSelectedVenue(null);
//     };
//
//     const handleFormSuccess = () => {
//         setShowForm(false);
//         setSelectedVenue(null);
//         fetchVenuesData(); // Refresh Table
//         fetchGlobalData(); // Refresh Stats & Lists
//     };
//
//     // ================= DATA PROCESSING =================
//
//     // Compute Global Stats and Lists based on 'allVenues' (Unpaginated)
//     const globalActiveVenues = useMemo(() => allVenues.filter(v => v.is_active), [allVenues]);
//     const globalInactiveVenues = useMemo(() => allVenues.filter(v => !v.is_active), [allVenues]);
//
//     // ================= CUSTOM RENDER FUNCTIONS =================
//     const renderVenueIcon = () => (
//         <MapPin className="text-white w-5 h-5" />
//     );
//
//     const renderVenueHeader = (venue) => (
//         <span className="font-semibold text-secondary-600 text-xs sm:text-sm truncate">
//             {venue.translations?.name || `Venue ${venue.id}`}
//         </span>
//     );
//
//     // --- TRANSLATED RENDER FUNCTION ---
//     const renderVenueMeta = (venue) => {
//         // Match the logic used in the Main Table for consistency
//         const typeLabel = venue.venue_type === 'indoor' ? t('filters.type.indoor')
//             : venue.venue_type === 'outdoor' ? t('filters.type.outdoor')
//                 : venue.venue_type || t('table.rows.na');
//
//         return (
//             <>
//                 <span className="font-medium text-gray-600">{t('filters.type.label')}:</span>
//                 <span className="ml-1 text-gray-500">{typeLabel}</span>
//             </>
//         );
//     };
//
//     // ================= TABLE CONFIGURATION =================
//     const filterConfig = useMemo(() => [
//         {
//             key: 'status', label: t('filters.status.label'), type: 'select',
//             options: [
//                 { label: t('filters.status.all'), value: 'all' },
//                 { label: t('filters.status.active'), value: 'true' },
//                 { label: t('filters.status.inactive'), value: 'false' }
//             ],
//             value: filters.status || 'all'
//         },
//         {
//             key: 'venueType', label: t('filters.type.label'), type: 'select',
//             options: [{ label: t('filters.type.all'), value: 'all' }, ...staticVenueTypes],
//             value: filters.venueType || 'all'
//         }
//     ], [t, filters.status, filters.venueType, staticVenueTypes]);
//
//     const ActionButtons = ({ venue }) => (
//         <div className="flex justify-end items-center gap-1 sm:gap-2">
//             <button className="text-gray-500 hover:text-teal-600 p-1 rounded transition-colors hover:bg-gray-50"
//                     title={t('actions.view')}
//                     onClick={() => handleViewVenue(venue)}>
//                 <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
//             </button>
//             <button className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
//                     title={t('actions.edit')}
//                     onClick={() => handleEditVenue(venue)}>
//                 <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
//             </button>
//             <button className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
//                     title={t('actions.delete')}
//                     onClick={() => handleDeleteVenue(venue.id, venue.translations?.name || `Venue ${venue.id}`)}>
//                 <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
//             </button>
//         </div>
//     );
//
//     const columns = useMemo(() => [
//         {
//             header: t('table.headers.srNo'),
//             accessor: 'id',
//             align: 'left',
//             width: '60px',
//             sortable: true,
//             sortKey: 'id',
//             render: (row, i) => <div className="text-gray-600 font-medium text-sm">{row.id}</div>
//         },
//         {
//             header: t('table.headers.venue'),
//             accessor: 'name',
//             align: 'center',
//             width: '200px',
//             sortable: true,
//             sortKey: 'name',
//             render: (row) => {
//                 // Determine translation for type label
//                 const typeLabel = row.venue_type === 'indoor' ? t('filters.type.indoor')
//                     : row.venue_type === 'outdoor' ? t('filters.type.outdoor')
//                         : row.venue_type || t('table.rows.na');
//
//                 return (
//                     <div className="font-medium text-gray-900">
//                         <div className="text-sm font-bold text-secondary-600">{row.translations?.name || `Venue ${row.id}`}</div>
//                         <div className="flex items-center justify-center gap-2 mt-1">
//                             <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${row.venue_type === 'indoor' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
//                                 {typeLabel}
//                             </span>
//                         </div>
//                     </div>
//                 );
//             }
//         },
//         {
//             header: t('table.headers.contactInfo'),
//             accessor: 'contact',
//             align: 'center',
//             sortable: false,
//             render: (row) => {
//                 const name = row.contact_name || row.owner_info?.contact_name || t('table.rows.na');
//                 const phone = row.phone_number || row.owner_info?.contact_phone || t('table.rows.na');
//                 return (
//                     <div className="flex flex-col gap-1">
//                         <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700"><User size={14} className="text-gray-400" /><span>{name}</span></div>
//                         <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={12} className="text-gray-400" /><span>{phone}</span></div>
//                     </div>
//                 );
//             }
//         },
//         {
//             header: t('table.headers.location'),
//             accessor: 'location',
//             align: 'center',
//             width: '250px',
//             sortable: false,
//             render: (row) => {
//                 const mapLink = row.latitude && row.longitude ? `https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}` : null;
//                 return (
//                     <div>
//                         <div className="text-xs text-gray-600 line-clamp-2 mb-1" title={row.address}>{row.address || row.translations?.address || t('table.rows.noAddress')}</div>
//                         {mapLink && <a href={mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"><MapPin size={12} /> {t('table.rows.viewOnMap')} <ExternalLink size={10} /></a>}
//                     </div>
//                 );
//             }
//         },
//         {
//             header: t('table.headers.playTypes'),
//             accessor: 'venue_play_type',
//             align: 'center',
//             width: '180px',
//             sortable: false,
//             render: (row) => (
//                 <div className="flex flex-wrap gap-1.5 justify-center">
//                     {row.venue_play_type?.length > 0 ? row.venue_play_type.map((t) => (
//                         <span key={t.id} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] rounded-full font-medium whitespace-nowrap">{t.translations?.name}</span>
//                     )) : <span className="text-xs text-gray-400 italic">{t('table.rows.none')}</span>}
//                 </div>
//             )
//         },
//         {
//             header: t('table.headers.status'),
//             accessor: 'is_active',
//             align: 'center',
//             width: '100px',
//             sortable: true,
//             sortKey: 'is_active',
//             render: (row) => <StatusBadge isActive={row.is_active} />
//         },
//         {
//             header: t('table.headers.actions'),
//             align: 'right',
//             width: '120px',
//             render: (row) => <ActionButtons venue={row} />
//         }
//     ], [t]); // Depend on 't'
//
//     const topActions = useMemo(() => [
//         { label: t('actions.create'), onClick: handleCreateVenue, type: 'primary' }
//     ], [t]);
//
//     // ================= RENDER =================
//     if (!user || !user.role) return false;
//     const { role } = user;
//
//     if (showForm) {
//         return (
//             <div className="w-full px-2 sm:px-0 mb-6 sm:mb-8">
//                 <VenuesForm
//                     initialData={selectedVenue}
//                     onCancel={handleCancelForm}
//                     onSuccess={handleFormSuccess}
//                 />
//             </div>
//         );
//     }
//
//     return (
//         <div className="w-full px-2 sm:px-0">
//             {/* Stats Section with 3 Cards */}
//             <div className="grid grid-cols-3 gap-3 sm:gap-6 my-4 sm:my-8">
//                 <StatCard
//                     title={t('stats.totalFiltered')}
//                     value={totalItems} // Comes from Table Pagination
//                     icon={TrendingUp}
//                     iconColor="text-blue-600"
//                 />
//
//                 {/* NEW CARD: Active Venues (Global) */}
//                 <StatCard
//                     title={t('stats.active')}
//                     value={globalActiveVenues.length}
//                     icon={CheckCircle}
//                     iconColor="text-green-600"
//                 />
//
//                 {/* NEW CARD: Inactive Venues (Global) */}
//                 <StatCard
//                     title={t('stats.inactive')}
//                     value={globalInactiveVenues.length}
//                     icon={XCircle}
//                     iconColor="text-red-600"
//                 />
//             </div>
//
//             {/* Status Management Lists - Using Global (Unpaginated) Data */}
//             {role.is_pitch_owner === false && (
//                 <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
//                     {/* Active Venues Section */}
//                     <StatusManagementSection
//                         title={t('statusSection.activeTitle')}
//                         name={{ single: t('entity.venue'), group: t('entity.venues') }}
//                         items={globalActiveVenues} // Use global list
//                         statusType="approved"
//                         emptyMessage={t('statusSection.noActive')}
//                         onReject={handleDeactivateVenue}
//                         onItemClick={handleViewVenue} /* Added navigation handler */
//                         rejectLabel={t('statusSection.btnDeactivate')}
//                         renderIcon={renderVenueIcon}
//                         renderHeader={renderVenueHeader}
//                         renderMeta={renderVenueMeta}
//                     />
//
//                     {/* Inactive Venues Section */}
//                     <StatusManagementSection
//                         title={t('statusSection.inactiveTitle')}
//                         name={{ single: t('entity.venue'), group: t('entity.venues') }}
//                         items={globalInactiveVenues} // Use global list
//                         statusType="rejected"
//                         emptyMessage={t('statusSection.noInactive')}
//                         onApprove={handleActivateVenue}
//                         onItemClick={handleViewVenue} /* Added navigation handler */
//                         approveLabel={t('statusSection.btnActivate')}
//                         renderIcon={renderVenueIcon}
//                         renderHeader={renderVenueHeader}
//                         renderMeta={renderVenueMeta}
//                     />
//                 </div>
//             )}
//
//             {/* View Tabs */}
//             <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-lg shadow-sm border border-primary-100 p-1 sm:p-1.5 mt-4 sm:mt-5 mb-4 sm:mb-6">
//                 <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
//                     {[
//                         { key: 'all', label: t('viewTabs.all') },
//                         { key: 'active', label: t('viewTabs.active') },
//                         { key: 'inactive', label: t('viewTabs.inactive') }
//                     ].map((tab) => (
//                         <button key={tab.key} onClick={() => handleViewChange(tab.key)}
//                                 className={`flex-1 flex items-center justify-center gap-2 px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${currentView === tab.key ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' : 'text-gray-600 hover:text-secondary-600 hover:bg-primary-50'}`}>
//                             <span className="truncate">{tab.label}</span>
//                         </button>
//                     ))}
//                 </div>
//             </div>
//
//             {/* Main Table */}
//             {isLoading && venuesData.length === 0 ? (
//                 <div className="p-6 sm:p-10 text-center text-gray-500 text-sm sm:text-base">{t('loading')}</div>
//             ) : (
//                 <MainTable
//                     data={venuesData}
//                     columns={columns}
//                     filters={filterConfig}
//                     searchPlaceholder={t('filters.searchPlaceholder')}
//                     topActions={topActions}
//                     currentPage={currentPage}
//                     totalItems={totalItems}
//                     itemsPerPage={itemsPerPage}
//                     onSearch={handleSearch}
//                     onFilterChange={handleFilterChange}
//                     onPageChange={handlePageChange}
//                     sortConfig={sortConfig}
//                     onSort={handleSort}
//                 />
//             )}
//         </div>
//     );
// };
//
// export default Venues;