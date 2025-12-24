import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import i18n hook
import MainTable from './../../components/MainTable';
import StatCard from './../../components/Charts/StatCards.jsx';
import { venuesEditRequestsService } from '../../services/venuesEditRequests/venuesEditRequestsService.js';
import { showConfirm } from '../../components/showConfirm';
import { toast } from 'react-toastify';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import { IMAGE_BASE_URL } from '../../utils/ImageBaseURL.js';

import {
    Eye,
    CheckCircle,
    XCircle,
    MapPin,
    FileText,
    Calendar,
    Clock,
    Phone,
    Mail,
    Check
} from 'lucide-react';

// --- HELPER COMPONENT: VENUE AVATAR ---
const VenueAvatar = ({ images, name }) => {
    const imageFilename = images && images.length > 0 ? images[0].image : null;
    const imageSrc = imageFilename ? `${IMAGE_BASE_URL}${imageFilename}` : null;

    if (imageSrc) {
        return (
            <div className="w-12 h-12 min-w-[48px] rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <img
                    src={imageSrc}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>
        );
    }

    return (
        <div className="w-12 h-12 min-w-[48px] rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 border border-indigo-100">
            <FileText size={20} />
        </div>
    );
};

// --- HELPER COMPONENT: TYPE BADGE ---
const TypeBadge = ({ type }) => {
    const { t } = useTranslation('venueEditRequests');
    const isIndoor = type === 'indoor';
    const style = isIndoor
        ? 'bg-purple-100 text-purple-800 border border-purple-200'
        : 'bg-orange-100 text-orange-800 border border-orange-200';

    // Translate the type if it matches known keys, otherwise show raw
    const label = type === 'indoor' ? t('types.indoor') :
        type === 'outdoor' ? t('types.outdoor') : type;

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${style}`}>
            {label}
        </span>
    );
};

// --- MAIN COMPONENT ---
const VenueEditRequests = () => {
    const { t, i18n } = useTranslation('venueEditRequests'); // Initialize translation
    const rowsPerPage = 10;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);

    // --- STATE MANAGEMENT ---
    const [requestsData, setRequestsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Global stats state (for the cards at the top)
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });

    // Filter State
    const [filters, setFilters] = useState({
        search: '',
        status: 'all' // 'all', 'true' (Approved), 'false' (Pending/Rejected)
    });

    // --- API PARAMS CONSTRUCTION ---
    const apiFilters = useMemo(() => ({
        page: currentPage,
        page_limit: rowsPerPage,
        search: filters.search,
        // Map status 'all' to undefined, otherwise pass the value
        accepted: filters.status === 'all' ? undefined : filters.status
    }), [currentPage, rowsPerPage, filters]);

    // --- FETCH DATA (Main Table) ---
    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await venuesEditRequestsService.getAllRequests(apiFilters);

            if (response && response.results) {
                setRequestsData(response.results);
                setTotalCount(response.count);
            } else if (Array.isArray(response)) {
                // Fallback if API doesn't support pagination format yet
                setRequestsData(response);
                setTotalCount(response.length);
            } else {
                setRequestsData([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error("Failed to fetch requests:", error);
            toast.error(t('messages.loadError'));
        } finally {
            setIsLoading(false);
        }
    };

    // --- FETCH DATA (Global Stats) ---
    const fetchGlobalStats = async () => {
        try {
            const response = await venuesEditRequestsService.getAllRequests({ page_limit: 1000 });
            const allResults = response.results || [];

            setStats({
                total: response.count || 0,
                pending: allResults.filter(r => r.accepted !== true).length,
                approved: allResults.filter(r => r.accepted === true).length
            });
        } catch (error) {
            console.error("Failed to fetch stats");
        }
    };

    // Initial Load & Filter Changes
    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiFilters]);

    // Update stats when page loads or after an action
    useEffect(() => {
        fetchGlobalStats();
    }, []);

    // --- HANDLERS ---

    const handleViewRequest = async (row) => {
        try {
            const response = await venuesEditRequestsService.getRequestById(row.id);
            navigate(`/venue-edit-requests/venue-request-details`, {
                state: { requestData: response }
            });
        } catch (error) {
            console.error("Error fetching request details:", error);
        }
    };

    const handleApprove = async (id, name) => {
        const isConfirmed = await showConfirm({
            title: t('confirm.approveTitle', { name }),
            text: t('confirm.approveText'),
            confirmButtonText: t('confirm.approveBtn'),
            icon: 'question'
        });

        if (!isConfirmed) return;

        try {
            await venuesEditRequestsService.acceptRequest(id);
            fetchRequests();
            fetchGlobalStats();
        } catch (error) {
            // Error handling done in service
        }
    };

    const handleReject = async (id, name) => {
        const isConfirmed = await showConfirm({
            title: t('confirm.rejectTitle', { name }),
            text: t('confirm.rejectText'),
            confirmButtonText: t('confirm.rejectBtn'),
            confirmButtonColor: '#d33'
        });

        if (!isConfirmed) return;

        try {
            await venuesEditRequestsService.deleteRequest(id);
            fetchRequests();
            fetchGlobalStats();
        } catch (error) {
            // Error handling done in service
        }
    };

    // --- FILTER HANDLERS ---
    const handleSearch = (term) => {
        setFilters(prev => ({ ...prev, search: term }));
        setCurrentPage(1); // Reset to page 1 on search
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to page 1 on filter change
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // --- FILTER CONFIGURATION (Dropdowns) ---
    // Defined inside component to access 't'
    const filterConfig = [
        // {
        //     key: 'status',
        //     label: t('filters.statusLabel'),
        //     type: 'select',
        //     options: [
        //         { label: t('filters.all'), value: 'all' },
        //         { label: t('filters.approved'), value: 'true' },
        //         { label: t('filters.pending'), value: 'false' }
        //     ],
        //     value: filters.status
        // }
    ];

    // --- TABLE COLUMNS ---
    const columns = [
        {
            header: t('table.srNo'),
            accessor: 'id',
            width: '60px',
            render: (row, index) => <span className="text-gray-500 text-xs">{index + 1}</span>
        },
        {
            header: t('table.venuesInfo'),
            accessor: 'name',
            width: '250px',
            render: (row) => {
                // Determine language key for data (fallback to 'en')
                const lang = i18n.language === 'ar' ? 'ar' : 'en';
                const name = row.translations?.en?.name || row.translations?.en?.name || t('table.untitled');
                const address = row.translations?.en?.address || row.translations?.en?.address || t('table.noAddress');

                return (
                    <div className="flex items-start gap-3">
                        <VenueAvatar images={row.images_request} name={name} />
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-semibold text-sm line-clamp-1" title={name}>
                                {name}
                            </span>
                            <span className="text-gray-500 text-xs flex items-center gap-1 mt-0.5 line-clamp-1" title={address}>
                                <MapPin size={10} />
                                {address}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: t('table.contact'),
            accessor: 'contact',
            render: (row) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                        <span className="capitalize">{row.contact_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone size={12} /> {row.phone_number}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail size={12} /> {row.email}
                    </div>
                </div>
            )
        },
        {
            header: t('table.details'),
            accessor: 'details',
            render: (row) => (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <TypeBadge type={row.venue_type} />
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {row.city}
                        </span>
                    </div>
                    <div className="text-xs font-mono text-gray-600">
                        <span className="font-bold text-gray-800">{parseFloat(row.price_per_hour).toFixed(0)}</span> {t('table.perHour')}
                    </div>
                </div>
            )
        },
        {
            header: t('table.submitted'),
            accessor: 'created_at',
            render: (row) => {
                const dateObj = new Date(row.created_at);
                // Use current locale for date formatting
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-gray-700 text-xs font-medium">
                            <Calendar size={12} />
                            {dateObj.toLocaleDateString(i18n.language)}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                            <Clock size={12} />
                            {dateObj.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                );
            }
        },
        {
            header: t('table.actions'),
            align: 'right',
            width: '180px',
            render: (row) => {
                const lang = i18n.language === 'ar' ? 'ar' : 'en';
                const name = row.translations?.[lang]?.name || row.translations?.en?.name || "Venue";
                const isApproved = row.accepted === true;

                return (
                    <div className="flex justify-end items-center gap-2">
                        <button
                            onClick={() => handleViewRequest(row)}
                            className="text-gray-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            title={t('buttons.view')}
                        >
                            <Eye size={18} />
                        </button>

                        {isApproved ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 select-none">
                                <CheckCircle size={14} />
                                <span className="text-xs font-semibold">{t('buttons.approvedBadge')}</span>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleApprove(row.id, name)}
                                    className="flex items-center justify-center gap-[2px] border border-green-200 text-green-600 hover:text-green-700 px-2 py-1 rounded-md bg-green-50 hover:bg-green-100 transition-colors text-xs font-medium"
                                    title={t('buttons.approveTooltip')}
                                >
                                    <Check size={14} strokeWidth={2.5} />
                                    {t('buttons.approve')}
                                </button>
                                <button
                                    onClick={() => handleReject(row.id, name)}
                                    className="flex items-center justify-center gap-[2px] border border-red-200 text-red-600 hover:text-red-700 px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 transition-colors text-xs font-medium"
                                    title={t('buttons.rejectTooltip')}
                                >
                                    <XCircle size={14} strokeWidth={2.5} />
                                    {t('buttons.reject')}
                                </button>
                            </>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="w-full md:px-2 px-0 sm:px-0">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 my-6">
                <StatCard
                    title={t('stats.total')}
                    value={stats.total}
                    icon={FileText}
                    iconColor="text-white"
                />
                <StatCard
                    title={t('stats.pending')}
                    value={stats.pending}
                    icon={Clock}
                    iconColor="text-white"
                />
                <StatCard
                    title={t('stats.approved')}
                    value={stats.approved}
                    icon={CheckCircle}
                    iconColor="text-white"
                />
            </div>

            {/* Table Container */}
            <div className='bg-white rounded-lg shadow-sm md:p-5 p-1'>
                {isLoading && requestsData.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">{t('messages.loading')}</div>
                ) : (
                    <MainTable
                        data={requestsData}
                        columns={columns}
                        filters={filterConfig}
                        searchPlaceholder={t('filters.searchPlaceholder')}
                        topActions={[]}
                        currentPage={currentPage}
                        totalItems={totalCount}
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

export default VenueEditRequests;