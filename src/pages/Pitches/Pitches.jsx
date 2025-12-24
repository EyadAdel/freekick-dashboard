import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainTable from './../../components/MainTable';
import { Eye, Pencil, Trash2, CheckCircle, XCircle, TrendingUp, Image as ImageIcon } from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import PitchesForm from "../../components/pitches/PitchesForm.jsx";
import { pitchesService } from '../../services/pitches/pitchesService.js';
import { venuesService } from '../../services/venues/venuesService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import { toast } from 'react-toastify';
import StatusManagementSection, { StatusBadge } from '../../components/StatusManagementSection.jsx';
import { IMAGE_BASE_URL } from '../../utils/ImageBaseURL.js';
import StatCard from '../../components/Charts/StatCards.jsx';

// --- Helper: Language Translation for Backend Objects ---
const getTrans = (obj, lang) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (obj[lang]) return obj[lang];
    if (obj.en) return obj.en;
    // Fallback for structure like { translations: { name: "..." } }
    if (obj.translations) {
        // Recursive check if translations is an object
        return obj.translations[lang]?.name || obj.translations.en?.name || obj.translations.name || '';
    }
    return obj.name || '';
};

// Helper Component: Handles Image Loading & Fallback Icon
const PitchImage = ({ imagePath, alt }) => {
    const [hasError, setHasError] = useState(false);

    if (!imagePath || hasError) {
        return (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200" title="No Image Available">
                <ImageIcon size={20} className="text-gray-400" />
            </div>
        );
    }

    return (
        <img
            src={`${IMAGE_BASE_URL}${imagePath}`}
            alt={alt}
            className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
            onError={() => setHasError(true)}
        />
    );
};

const Pitches = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('pitchesPage'); // Use 'pitchesPage' namespace
    const currentLang = i18n.language;
    const rowsPerPage = 10;

    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle', 'Pitches')));
    }, [dispatch, t]);

    // ================= STATE MANAGEMENT =================

    // 1. Table Data
    const [pitchesData, setPitchesData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // 2. Global Data
    const [allPitches, setAllPitches] = useState([]);

    // 3. Dropdown Data
    const [venuesData, setVenuesData] = useState([]);

    // 4. Form & Selection
    const [showForm, setShowForm] = useState(false);
    const [selectedPitch, setSelectedPitch] = useState(null);

    // 5. Filters
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        type: '',
        venue: '',
        price: ''
    });

    // 6. View State
    const [currentView, setCurrentView] = useState('all');

    // ================= API CALLS =================

    const apiFilters = useMemo(() => ({
        page: currentPage,
        page_limit: rowsPerPage,
        search: filters.search,
        venue: filters.venue === 'all' ? undefined : filters.venue,
        is_active: filters.status === 'all' ? undefined : filters.status,
        size: filters.type === 'all' ? undefined : filters.type,
        price_per_hour: filters.price || undefined
    }), [currentPage, rowsPerPage, filters]);

    const fetchVenuesData = async () => {
        try {
            const response = await venuesService.getAllVenues({ page_limit: 1000 });
            if (response && response.results) {
                const formattedVenues = response.results.map((venue) => ({
                    label: getTrans(venue.translations, currentLang) || venue.id,
                    value: venue.id
                }));
                setVenuesData(formattedVenues);
            }
        } catch (error) {
            console.error("Failed to fetch venues:", error);
        }
    };

    const fetchPitchesData = async () => {
        setIsLoading(true);
        try {
            const response = await pitchesService.getAllPitchess(apiFilters);
            if (response) {
                setPitchesData(response.results || []);
                setTotalItems(response.count || 0);
            }
        } catch (error) {
            console.error("Failed to fetch pitches:", error);
            toast.error(t('messages.loadFailed', "Failed to load pitches data"));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGlobalData = async () => {
        try {
            const response = await pitchesService.getAllPitchess({ page_limit: 10000 });
            if (response && response.results) {
                setAllPitches(response.results);
            }
        } catch (error) {
            console.error("Failed to fetch global pitch data:", error);
        }
    };

    useEffect(() => {
        fetchVenuesData();
        fetchGlobalData();
    }, [currentLang]); // Re-fetch or re-format when language changes

    useEffect(() => {
        fetchPitchesData();
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

        if (view === 'approved') statusValue = 'true';
        if (view === 'rejected') statusValue = 'false';

        setFilters(prev => ({ ...prev, status: statusValue }));
        setCurrentPage(1);
    };

    const handleApprovePitch = async (pitch) => {
        const pitchName = getTrans(pitch.translations, currentLang) || `Pitch ${pitch.id}`;
        const isConfirmed = await showConfirm({
            title: t('modals.approveTitle', { name: pitchName }),
            text: t('modals.approveText', "This pitch will be set to active status."),
            confirmButtonText: t('modals.approveBtn', 'Yes, Approve it')
        });

        if (!isConfirmed) return;

        try {
            await pitchesService.updatePitch(pitch.id, { is_active: true });
            fetchPitchesData();
            fetchGlobalData();
        } catch (error) {
            console.error("Failed to approve pitch:", error);
        }
    };

    const handleRejectPitch = async (pitch) => {
        const pitchName = getTrans(pitch.translations, currentLang) || `Pitch ${pitch.id}`;
        const isConfirmed = await showConfirm({
            title: t('modals.rejectTitle', { name: pitchName }),
            text: t('modals.rejectText', "This pitch will be set to inactive status."),
            confirmButtonText: t('modals.rejectBtn', 'Yes, Reject it')
        });

        if (!isConfirmed) return;

        try {
            await pitchesService.updatePitch(pitch.id, { is_active: false });
            fetchPitchesData();
            fetchGlobalData();
        } catch (error) {
            console.error("Failed to reject pitch:", error);
        }
    };

    const handleDeletePitch = async (id, pitchName) => {
        const isConfirmed = await showConfirm({
            title: t('modals.deleteTitle', { name: pitchName }),
            text: t('modals.deleteText', "This action cannot be undone."),
            confirmButtonText: t('modals.deleteBtn', 'Yes, Delete it')
        });

        if (!isConfirmed) return;

        try {
            await pitchesService.deletePitch(id);
            if (pitchesData.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchPitchesData();
            }
            fetchGlobalData();
        } catch (error) {
            console.error("Failed to delete pitch:", error);
        }
    };

    const handleCreatePitch = () => {
        setSelectedPitch(null);
        setShowForm(true);
    };

    const handleViewPitch = (pitch) => {
        navigate('/pitches/pitch-details', {
            state: { pitchId: pitch.id }
        });
    };

    const handleEditPitch = async (pitch) => {
        setIsLoading(true);

        try {
            const fullPitchData = await pitchesService.getPitchById(pitch.id);
            setSelectedPitch(fullPitchData);
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error("Failed to fetch pitch details for editing:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setSelectedPitch(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedPitch(null);
        fetchPitchesData();
        fetchGlobalData();
    };

    // ================= DATA PROCESSING =================

    const globalActivePitches = useMemo(() => allPitches.filter(p => p.is_active), [allPitches]);
    const globalInactivePitches = useMemo(() => allPitches.filter(p => !p.is_active), [allPitches]);

    const formattedPitchesList = useMemo(() => {
        return allPitches.map(pitch => ({
            label: getTrans(pitch.translations, currentLang) || `Pitch #${pitch.id}`,
            value: pitch.id
        }));
    }, [allPitches, currentLang]);

    // ================= TABLE CONFIG =================

    const filterConfig = [
        {
            key: 'status',
            label: t('filters.status', 'Status'),
            type: 'select',
            options: [
                { label: t('filters.allStatus', 'All Status'), value: 'all' },
                { label: t('status.active', 'Active'), value: 'true' },
                { label: t('status.inactive', 'Inactive'), value: 'false' }
            ],
            value: filters.status || 'all'
        },
        {
            key: 'venue',
            label: t('filters.filterVenues', 'Filter Venues'),
            type: 'select',
            options: [{ label: t('filters.allVenues', 'All Venues'), value: 'all' }, ...venuesData],
            value: filters.venue || 'all'
        },
        // {
        //     key: 'price',
        //     label: t('filters.pricePerHour', 'Price Per Hour'),
        //     type: 'number',
        //     placeholder: t('filters.pricePlaceholder', 'e.g. 200'),
        //     value: filters.price
        // }
    ];

    const ActionButtons = ({ pitch }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button
                className="text-gray-500 hover:text-teal-600 p-1 rounded transition-colors hover:bg-gray-50"
                title={t('actions.view', "View Pitch")}
                onClick={() => handleViewPitch(pitch)}
            >
                <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
                title={t('actions.edit', "Edit Pitch")}
                onClick={() => handleEditPitch(pitch)}
            >
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
                onClick={() => handleDeletePitch(pitch.id, getTrans(pitch.translations, currentLang) || `Pitch ${pitch.id}`)}
                title={t('actions.delete', "Delete Pitch")}
            >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
        </div>
    );

    const columns = [
        {
            header: t('table.srNo', 'Sr.No'),
            accessor: 'id',
            align: 'left',
            width: '80px',
            render: (row, index) => (
                <div className="text-gray-600 font-medium text-sm">
                    {index + 1}
                </div>
            )
        },
        {
            header: t('table.image', 'Image'),
            accessor: 'image',
            align: 'center',
            width: '80px',
            render: (row) => (
                <div className="flex items-center justify-center">
                    <PitchImage
                        imagePath={row.image}
                        alt={getTrans(row.translations, currentLang) || 'Pitch'}
                    />
                </div>
            )
        },
        {
            header: t('table.pitchNameId'),
            accessor: 'name',
            align: 'center',
            render: (row) => (
                <div className="font-medium text-gray-900">
                    <div className="text-xs sm:text-sm">{getTrans(row.translations, currentLang) || `Pitch ${row.id}`}</div>
                </div>
            )
        },
        {
            header: t('table.venues', 'Venues'),
            accessor: 'venue',
            align: 'center',
            render: (row) => {
                const venueInfo = venuesData.find(v => v.value === row.venue);
                return <span className="text-gray-700 text-xs sm:text-sm">{venueInfo ? venueInfo.label : `Venue #${row.venue}`}</span>;
            }
        },
        {
            header: t('table.status', 'Status'),
            accessor: 'is_active',
            align: 'center',
            render: (row) => <StatusBadge isActive={row.is_active} />
        },
        {
            header: t('table.type', 'Type'),
            accessor: 'size',
            align: 'center',
            render: (row) => <span className="text-gray-700 text-xs sm:text-sm">{row.size} {t('common.aside', 'a side')}</span>
        },
        {
            header: t('table.pricing', 'Pricing/hour'),
            accessor: 'price_per_hour',
            align: 'center',
            render: (row) => <span className="font-medium text-gray-900 text-xs sm:text-sm">{t('common.currency', 'AED')} {parseFloat(row.price_per_hour || 0).toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US')}</span>
        },
        {
            header: t('table.quickActions', 'Quick Actions'),
            align: 'right',
            render: (row) => <ActionButtons pitch={row} />
        }
    ];

    const topActions = [
        {
            label: t('actions.createPitch', 'Create Pitch'),
            onClick: handleCreatePitch,
            type: 'primary'
        }
    ];

    // ================= RENDER HELPERS =================

    const renderPitchIcon = (pitch) => (
        <span className="text-sm sm:text-base font-bold text-white">{pitch.size}</span>
    );

    const renderPitchHeader = (pitch) => (
        <>
            <span className="font-semibold text-secondary-600 text-xs sm:text-sm truncate">
                {getTrans(pitch.translations, currentLang) || `Pitch ${pitch.id}`}
            </span>
            <span className="px-1.5 sm:px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium whitespace-nowrap">
                {pitch.size} {t('common.aside', 'a side')}
            </span>
        </>
    );

    const renderPitchMeta = (pitch) => {
        const venueInfo = venuesData.find(v => v.value === pitch.venue);
        const venueName = venueInfo ? venueInfo.label : `Venue #${pitch.venue}`;
        return (
            <>
                <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                    <span className="font-medium">{t('card.venue', 'Venue')}:</span>
                    <span className="text-gray-700 font-semibold ml-1 rtl:mr-1">{venueName}</span>
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                    <span className="font-medium">{t('card.price', 'Price')}:</span> {t('common.currency', 'AED')} {parseFloat(pitch.price_per_hour || 0).toLocaleString(currentLang === 'ar' ? 'en-US' : 'en-US')}/{t('common.hr', 'hr')}
                </span>
            </>
        );
    };

    if (!user || !user.role) return false;
    const { role } = user;

    // ================= CONDITIONAL RETURN =================

    if (showForm) {
        return (
            <div className="w-full px-2 sm:px-0 mb-6 sm:mb-8">
                <PitchesForm
                    venuesData={venuesData}
                    pitchesList={formattedPitchesList}
                    pitchDetails={selectedPitch}
                    onCancel={handleCancelForm}
                    onSuccess={handleFormSuccess}
                />
            </div>
        );
    }

    return (
        <div className="w-full px-2 sm:px-8">
            {/* Statistics Cards */}
            {/*xl:grid-cols-4 grid-cols-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2*/}
            <div className="grid          grid-cols-3 gap-3 sm:gap-6 xl:gap-10 my-4 sm:my-8">
                <StatCard
                    title={t('stats.total', 'Total Pitches')}
                    value={totalItems}
                    icon={TrendingUp}
                    iconColor="text-blue-600"
                />
                <StatCard
                    title={t('stats.active', 'Active Pitches')}
                    value={globalActivePitches.length}
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />
                <StatCard
                    title={t('stats.inactive', 'Inactive Pitches')}
                    value={globalInactivePitches.length}
                    icon={XCircle}
                    iconColor="text-red-600"
                />
            </div>

            {/* Status Management Sections */}
            {role.is_pitch_owner === false && (
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
                    <StatusManagementSection
                        name={{group: t('statusSection.groupName', 'Pitches'), single: t('statusSection.singleName', "Pitch")}}
                        title={t('statusSection.approvedTitle', "Approved Pitches")}
                        items={globalActivePitches}
                        statusType="approved"
                        rejectLabel={t('statusSection.reject', "Reject")}
                        emptyMessage={t('statusSection.noApproved', "No approved pitches")}
                        onReject={handleRejectPitch}
                        onItemClick={handleViewPitch}
                        renderIcon={renderPitchIcon}
                        renderHeader={renderPitchHeader}
                        renderMeta={renderPitchMeta}
                    />

                    <StatusManagementSection
                        title={t('statusSection.rejectedTitle', "Rejected Pitches")}
                        name={{group: t('statusSection.groupName', 'Pitches'), single: t('statusSection.singleName', "Pitch")}}
                        items={globalInactivePitches}
                        statusType="rejected"
                        approveLabel={t('statusSection.approve', "Approve")}
                        emptyMessage={t('statusSection.noRejected', "No rejected pitches")}
                        onApprove={handleApprovePitch}
                        onItemClick={handleViewPitch}
                        renderIcon={renderPitchIcon}
                        renderHeader={renderPitchHeader}
                        renderMeta={renderPitchMeta}
                    />
                </div>
            )}

            {/* View Tabs */}
            <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-lg shadow-sm border border-primary-100 p-1 sm:p-1.5 mt-4 sm:mt-5 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 rtl:space-x-reverse">
                    {[
                        { key: 'all', label: t('tabs.all', 'All Pitches'), count: totalItems },
                        { key: 'approved', label: t('tabs.approved', 'Approved') },
                        { key: 'rejected', label: t('tabs.rejected', 'Rejected') },
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
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Table */}
            {isLoading && pitchesData.length === 0 ? (
                <div className="p-6 sm:p-10 text-center text-gray-500 text-sm sm:text-base">
                    {t('messages.loading', 'Loading...')}
                </div>
            ) : (
                <MainTable
                    data={pitchesData}
                    columns={columns}
                    filters={filterConfig}
                    searchPlaceholder={t('filters.searchPlaceholder', 'Search pitch')}
                    topActions={topActions}
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={rowsPerPage}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

export default Pitches;