import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from "react-redux";
import { useTranslation } from 'react-i18next'; // Import translation hook
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import { supportService } from '../../services/support/supportService.js';
import MainTable from '../../components/MainTable.jsx';
import { showConfirm } from '../../components/showConfirm.jsx';
import StatCard from '../../components/Charts/StatCards.jsx';

import {
    MoreVertical,
    CheckCircle,
    Clock,
    Trash2,
    MoreHorizontal,
    Loader,
    HelpCircle
} from 'lucide-react';
import { Menu, MenuItem, IconButton, ListItemIcon, ListItemText } from '@mui/material';

const Support = () => {
    const dispatch = useDispatch();
    const { t, i18n } = useTranslation('support'); // Use 'support' namespace

    // ================= STATE MANAGEMENT =================

    // 1. Table Data State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 2. Global Data (For Statistics)
    const [allSupportData, setAllSupportData] = useState([]);

    // 3. Filters
    const [filters, setFilters] = useState({
        search: '',
        status: 'all'
    });

    // 4. Action Menu State
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // ================= API FILTERS & CALLS =================

    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);

    // Create memoized API parameters
    const apiFilters = useMemo(() => ({
        page: currentPage,
        page_limit: itemsPerPage,
        search: filters.search,
        status: filters.status === 'all' ? undefined : filters.status,
    }), [currentPage, itemsPerPage, filters]);

    // Fetch Table Data (Paginated)
    const fetchSupportRequests = async () => {
        setLoading(true);
        try {
            const response = await supportService.getAll(apiFilters);
            if (response) {
                setData(response.results || response.data || []);
                setTotalItems(response.count || response.total || 0);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Global Data (For Stats Cards)
    const fetchGlobalData = async () => {
        try {
            const response = await supportService.getAll({ page_limit: 10000 });
            if (response) {
                setAllSupportData(response.results || []);
            }
        } catch (error) {
            console.error("Failed to fetch global support data:", error);
        }
    };

    // Initial Load & Filter Changes
    useEffect(() => {
        fetchSupportRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiFilters]);

    // Load stats once on mount
    useEffect(() => {
        fetchGlobalData();
    }, []);

    // ================= STATISTICS =================

    const stats = useMemo(() => {
        const sourceData = allSupportData.length > 0 ? allSupportData : [];
        return {
            total: sourceData.length || totalItems,
            pending: sourceData.filter(item => item.status === 'pending').length,
            inProgress: sourceData.filter(item => item.status === 'in_progress').length,
            resolved: sourceData.filter(item => item.status === 'resolved').length
        };
    }, [allSupportData, totalItems]);

    // ================= HANDLERS =================

    const handleSearch = (term) => {
        setFilters(prev => ({ ...prev, search: term }));
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleMenuOpen = (event, row) => {
        setAnchorEl(event.currentTarget);
        setSelectedRequest(row);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedRequest(null);
    };

    const refreshData = () => {
        fetchSupportRequests();
        fetchGlobalData();
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!selectedRequest) return;
        handleMenuClose();

        // Get the localized status text for the confirmation message
        const translatedStatus = t(`status.${newStatus}`);

        const isConfirmed = await showConfirm({
            title: t('confirm.update.title', { status: translatedStatus }),
            text: t('confirm.update.text', { id: selectedRequest.id, status: translatedStatus }),
            confirmButtonText: t('confirm.update.btn')
        });

        if (!isConfirmed) return;

        try {
            // Optimistic UI update
            setData(prevData => prevData.map(item =>
                item.id === selectedRequest.id ? { ...item, status: newStatus } : item
            ));

            await supportService.update(selectedRequest.id, { ...selectedRequest, status: newStatus });
            refreshData();
        } catch (error) {
            refreshData(); // Revert on error
        }
    };

    const handleDelete = async () => {
        if (!selectedRequest) return;
        handleMenuClose();

        const isConfirmed = await showConfirm({
            title: t('confirm.delete.title', { id: selectedRequest.id }),
            text: t('confirm.delete.text'),
            confirmButtonText: t('confirm.delete.btn')
        });

        if (!isConfirmed) return;

        try {
            await supportService.delete(selectedRequest.id);
            if (data.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchSupportRequests();
            }
            fetchGlobalData();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    // ================= HELPERS & COLUMNS =================

    const renderStatusBadge = (status) => {
        let styles = '';
        let icon = null;
        let label = '';
        switch (status) {
            case 'resolved':
                styles = 'border-green-600 text-green-700 bg-white';
                icon = <CheckCircle size={14} className="mr-1.5 ltr:mr-1.5 rtl:ml-1.5" />;
                label = t('status.resolved');
                break;
            case 'in_progress':
                styles = 'border-blue-500 text-blue-600 bg-white';
                icon = <Clock size={14} className="mr-1.5 ltr:mr-1.5 rtl:ml-1.5" />;
                label = t('status.in_progress');
                break;
            case 'pending':
            default:
                styles = 'border-orange-500 text-orange-600 bg-white';
                icon = <MoreHorizontal size={14} className="mr-1.5 ltr:mr-1.5 rtl:ml-1.5" />;
                label = t('status.pending');
                break;
        }
        return (
            <div className={`flex items-center w-fit px-3 py-1 rounded-full border ${styles}`}>
                {icon}
                <span className="text-xs font-semibold">{label}</span>
            </div>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        // Use i18n language for date formatting
        return new Date(dateString).toLocaleString(i18n.language, {
            month: 'numeric', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
        });
    };

    const filterConfig = [
        {
            key: 'status',
            label: t('filters.label'),
            type: 'select',
            options: [
                { label: t('filters.all'), value: 'all' },
                { label: t('status.pending'), value: 'pending' },
                { label: t('status.in_progress'), value: 'in_progress' },
                { label: t('status.resolved'), value: 'resolved' }
            ],
            value: filters.status
        }
    ];

    const columns = [
        { header: t('table.srNo'), accessor: 'id', render: (row, index) => <span className="text-gray-900 font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</span> },
        { header: t('table.name'), accessor: 'user_info', render: (row) => <span className="text-gray-700">{row.user_info?.name || t('table.unknown')}</span> },
        { header: t('table.phone'), accessor: 'user_info', render: (row) => <span className="text-gray-700">{row.user_info?.phone || '-'}</span> },
        { header: t('table.title'), accessor: 'title', render: (row) => <span className="text-gray-700">{row.title}</span> },
        { header: t('table.message'), accessor: 'description', render: (row) => <span className="text-gray-500 text-sm truncate max-w-xs block" title={row.description}>{row.description}</span> },
        { header: t('table.dateTime'), accessor: 'created_at', render: (row) => <span className="text-gray-500 text-sm">{formatDate(row.created_at)}</span> },
        { header: t('table.status'), accessor: 'status', render: (row) => renderStatusBadge(row.status) },
        {
            header: t('table.actions'), align: 'right', render: (row) => (
                <IconButton onClick={(e) => handleMenuOpen(e, row)} size="small" className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={20} />
                </IconButton>
            )
        }
    ];

    return (
        <div className="w-full px-2 sm:px-4 py-4">

            {/* Statistics Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
                <StatCard
                    title={t('stats.total')}
                    value={stats.total}
                    icon={HelpCircle}
                    iconColor="text-white"
                />
                <StatCard
                    title={t('stats.pending')}
                    value={stats.pending}
                    icon={MoreHorizontal}
                    iconColor="text-white"
                />
                <StatCard
                    title={t('stats.inProgress')}
                    value={stats.inProgress}
                    icon={Clock}
                    iconColor="text-white"
                />
                <StatCard
                    title={t('stats.resolved')}
                    value={stats.resolved}
                    icon={CheckCircle}
                    iconColor="text-white"
                />
            </div>

            {/* Main Table */}
            <MainTable
                data={data}
                columns={columns}
                totalItems={totalItems}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                searchPlaceholder={t('searchPlaceholder')}
                onSearch={handleSearch}
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                topActions={[]}
            />

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    style: { boxShadow: '0px 4px 20px rgba(0,0,0,0.1)', borderRadius: '8px', minWidth: '160px', marginTop: '5px' },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => handleStatusUpdate('pending')}>
                    <ListItemIcon><MoreHorizontal size={16} /></ListItemIcon>
                    <ListItemText primary={t('status.pending')} primaryTypographyProps={{ fontSize: '14px' }} />
                </MenuItem>
                <MenuItem onClick={() => handleStatusUpdate('in_progress')}>
                    <ListItemIcon><Loader size={16} /></ListItemIcon>
                    <ListItemText primary={t('status.in_progress')} primaryTypographyProps={{ fontSize: '14px' }} />
                </MenuItem>
                <MenuItem onClick={() => handleStatusUpdate('resolved')}>
                    <ListItemIcon><CheckCircle size={16} /></ListItemIcon>
                    <ListItemText primary={t('status.resolved')} primaryTypographyProps={{ fontSize: '14px' }} />
                </MenuItem>
                <div className="my-1 border-t border-gray-100"></div>
                <MenuItem onClick={handleDelete} className="text-red-600 hover:bg-red-50">
                    <ListItemIcon><Trash2 size={16} className="text-red-600" /></ListItemIcon>
                    <ListItemText primary={t('actions.delete')} primaryTypographyProps={{ fontSize: '14px', className: "text-red-600 font-medium" }} />
                </MenuItem>
            </Menu>

            {loading && (
                <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

export default Support;