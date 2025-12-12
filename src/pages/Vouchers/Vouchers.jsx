import React, {useEffect, useState, useCallback} from 'react';
import {useDispatch} from "react-redux";
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";
import {toast} from "react-toastify";
import {showConfirm} from "../../components/showConfirm.jsx";
import CustomLineChart from "../../components/Charts/LineChart.jsx";
import CustomPieChart from "../../components/Charts/PieChart.jsx";
import MainTable from "../../components/MainTable.jsx";
import {useVouchers} from "../../hooks/useVouchers.js";
import CreateVouchers from "../../components/Vouchers/CreateVouchers.jsx";
import StatCard from "../../components/Charts/StatCards.jsx";
import {Edit2, Trash2, TrendingUp, TrendingDown, TicketPercent, CheckCircle, XCircle, Users} from "lucide-react";
import { useTranslation } from 'react-i18next';

function Vouchers(props) {
    const { t } = useTranslation(['vouchers', 'common']);

    const {
        vouchers,
        currentVoucher,
        analytics,
        validatedVoucher,
        pagination,
        loading,
        error,
        success,
        getVouchers,
        getVoucherById,
        addVoucher,
        editVoucher,
        editVoucherPartial,
        removeVoucher,
        getAnalytics,
        validateCode,
        resetError,
        resetSuccess,
        resetCurrentVoucher,
        resetValidatedVoucher,
    } = useVouchers();

    // View state management
    const [currentView, setCurrentView] = useState('list'); // 'list', 'create', or 'edit'
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
        page_limit: 10,
        ordering: null,
    });
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const dispatch = useDispatch();
    const [statChanges, setStatChanges] = useState({
        totalChange: 0,
        activeChange: 0,
        inactiveChange: 0,
        usageChange: 0
    });
    const totalUsage = analytics?.data.used_coupons_number?.reduce((sum, item) => sum + (item.number_of_used || 0), 0) || 0;

    // Fetch vouchers with useCallback to prevent infinite re-renders
    const fetchVouchers = useCallback(() => {
        const params = {
            page: filters.page,
            page_limit: filters.page_limit,
            search: filters.search || undefined,
            ordering: sortConfig.key ? `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.key}` : undefined,
        };
        getVouchers(params);
    }, [filters.page, filters.page_limit, filters.search, sortConfig.key, sortConfig.direction, getVouchers]);

    // Fetch analytics data with useCallback
    const fetchAnalyticsData = useCallback(async () => {
        try {
            setAnalyticsLoading(true);
            await getAnalytics();
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
            toast.error(t('vouchers:messages.loadAnalyticsError'));
        } finally {
            setAnalyticsLoading(false);
        }
    }, [t]);

    // Initial data fetch
    useEffect(() => {
        dispatch(setPageTitle(t('vouchers:title')));
        fetchVouchers();
        fetchAnalyticsData();
    }, [dispatch, fetchVouchers, t]);

    // Re-fetch vouchers when filters change
    useEffect(() => {
        if (currentView === 'list') {
            fetchVouchers();
        }
    }, [filters.page, filters.page_limit, filters.search, sortConfig, currentView, fetchVouchers]);

    // Handle toast notifications
    useEffect(() => {
        if (error) {
            toast.error(error);
            resetError();
        }
        if (success) {
            toast.success(success);
            resetSuccess();
        }
    }, [error, success, resetError, resetSuccess]);

    // Format analytics data for charts
    const formatAnalyticsData = useCallback(() => {
        if (!analytics) {
            return {
                monthUsageData: [],
                couponUsageData: []
            };
        }

        // Format monthly usage data for line chart
        const monthUsageData = analytics.data.used_coupons_last_12_months?.map(item => {
            const [year, month] = item.month.split('-');
            const date = new Date(year, month - 1);
            const monthAbbr = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

            return {
                month: monthAbbr,
                used_count: item.used_count || 0
            };
        }) || [];

        // Format coupon usage data for pie chart
        const couponUsageData = analytics.data.used_coupons_number?.map(item => ({
            name: item.coupon_code,
            value: item.number_of_used || 0
        })) || [];

        return { monthUsageData, couponUsageData };
    }, [analytics]);

    const { monthUsageData, couponUsageData } = formatAnalyticsData();

    // Handler functions
    const handleAddVoucher = () => {
        setEditingVoucher(null);
        setCurrentView('create');
    };

    const handleEditClick = (voucher) => {
        setEditingVoucher(voucher);
        setCurrentView('edit');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setEditingVoucher(null);
        fetchVouchers();
        fetchAnalyticsData();
    };

    const handleDelete = async (id) => {
        const voucherToDelete = vouchers.find(v => v.id === id);
        const voucherName = voucherToDelete?.name || voucherToDelete?.code || t('vouchers:actions.deleteConfirm.voucherName');

        const isConfirmed = await showConfirm({
            title: t('vouchers:actions.deleteConfirm.title'),
            text: t('vouchers:actions.deleteConfirm.text', { voucherName }),
            confirmButtonText: t('vouchers:actions.deleteConfirm.confirm'),
            cancelButtonText: t('vouchers:actions.deleteConfirm.cancel'),
            icon: 'warning'
        });

        if(isConfirmed){
            const result = await removeVoucher(id);
            if (result.type?.includes('fulfilled')) {
                toast.success(t('vouchers:messages.deleteSuccess'));
                fetchVouchers();
                fetchAnalyticsData();
            }
        }
    };

    const handleSearch = (searchTerm) => {
        setFilters(prev => ({
            ...prev,
            search: searchTerm,
            page: 1,
        }));
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            page: 1,
        }));
    };

    const handlePageChange = (page) => {
        setFilters(prev => ({
            ...prev,
            page: page,
        }));
    };

    const handleSort = (sortKey, sortDirection) => {
        setSortConfig({ key: sortKey, direction: sortDirection });
        setFilters(prev => ({
            ...prev,
            page: 1,
        }));
    };

    const onSort = (sortKey, sortDirection) => {
        handleSort(sortKey, sortDirection);
    };

    const topActions = [
        {
            label: t('vouchers:addButton'),
            type: 'primary',
            onClick: handleAddVoucher,
        },
    ];

    // Table columns configuration
    const columns = [

        {
            header: t('vouchers:table.columns.code'),
            accessor: 'code',
            align: 'left',
            sortable: true,
            sortKey: 'code',
            render: (row) => (
                <div className="font-mono font-medium text-gray-900">{row.code}</div>
            ),
        },
        {
            header: t('vouchers:table.columns.name'),
            accessor: 'name',
            align: 'left',
            sortable: true,
            sortKey: 'name',
        },
        {
            header: t('vouchers:table.columns.type'),
            accessor: 'discount_type',
            align: 'left',
            sortable: true,
            sortKey: 'discount_type',
            render: (row) => (
                <div className="text-gray-600">
                    {row.discount_type === 'percentage'
                        ? t('vouchers:table.types.percentage')
                        : row.discount_type === 'fixed'
                            ? t('vouchers:table.types.fixed')
                            : row.discount_type
                    }
                </div>
            ),
        },
        {
            header: t('vouchers:table.columns.discount'),
            accessor: 'discount_amount',
            align: 'right',
            sortable: true,
            sortKey: 'discount_amount',
            render: (row) => (
                <div className="font-semibold text-green-600">
                    {row.discount_type === 'percentage'
                        ? `${row.discount_amount}%`
                        : `$${parseFloat(row.discount_amount).toFixed(2)}`
                    }
                </div>
            ),
        },
        {
            header: t('vouchers:table.columns.maxDiscount'),
            accessor: 'max_discount_amount',
            align: 'right',
            sortable: true,
            sortKey: 'max_discount_amount',
            render: (row) => (
                <div className="text-gray-600">
                    {row.max_discount_amount
                        ? `$${parseFloat(row.max_discount_amount).toFixed(2)}`
                        : t('vouchers:table.noLimit')
                    }
                </div>
            ),
        },
        {
            header: t('vouchers:table.columns.usage'),
            accessor: 'used_count',
            align: 'center',
            sortable: true,
            sortKey: 'used_count',
            render: (row) => (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {row.used_count || 0} / {row.num_of_uses || '∞'}
                </div>
            ),
        },
        {
            header: t('vouchers:table.columns.validFrom'),
            accessor: 'valid_from',
            align: 'left',
            sortable: true,
            sortKey: 'valid_from',
            render: (row) => (
                <div className="text-gray-600">
                    {row.valid_from
                        ? new Date(row.valid_from).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })
                        : t('vouchers:table.immediate')
                    }
                </div>
            ),
        },
        {
            header: t('vouchers:table.columns.validTo'),
            accessor: 'valid_to',
            align: 'left',
            sortable: true,
            sortKey: 'valid_to',
            render: (row) => (
                <div className="text-gray-600">
                    {row.valid_to
                        ? new Date(row.valid_to).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })
                        : t('vouchers:table.noExpiry')
                    }
                </div>
            ),
        },
        {
            header: t('vouchers:table.columns.lastUsed'),
            accessor: 'last_used_on',
            align: 'left',
            sortable: true,
            sortKey: 'last_used_on',
            render: (row) => (
                <div className="text-gray-500 text-sm">
                    {row.last_used_on
                        ? new Date(row.last_used_on).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                        })
                        : t('vouchers:table.never')
                    }
                </div>
            ),
        },
        {
            header: t('vouchers:table.columns.status'),
            accessor: 'is_active',
            align: 'center',
            sortable: true,
            sortKey: 'is_active',
            render: (row) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                >
                    {row.is_active
                        ? t('vouchers:table.status.active')
                        : t('vouchers:table.status.inactive')
                    }
                </span>
            ),
        },
        {
            header: t('vouchers:table.columns.actions'),
            accessor: 'actions',
            align: 'center',
            render: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleEditClick(row)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title={t('vouchers:actions.edit')}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title={t('vouchers:actions.delete')}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ];

    // Render Create/Edit view
    if (currentView === 'create' || currentView === 'edit') {
        return (
            <CreateVouchers
                onBack={handleBackToList}
                editVoucher={editingVoucher}
            />
        );
    }

    // Render List view
    return (
        <div className="container mx-auto xl:px-4 px-1">
            {analytics && (
                <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                    <StatCard
                        title={t('vouchers:stats.totalVouchers')}
                        value={analytics?.data?.total_coupons || 0}
                        icon={TicketPercent}
                        iconColor="text-secondary-600"
                    />

                    <StatCard
                        title={t('vouchers:stats.activeVouchers')}
                        value={analytics?.data?.active_coupons || 0}
                        icon={CheckCircle}
                        iconColor="text-secondary-600"
                    />

                    <StatCard
                        title={t('vouchers:stats.inactiveVouchers')}
                        value={analytics?.data?.inactive_coupons || 0}
                        icon={XCircle}
                        iconColor="text-red-600"
                    />

                    <StatCard
                        title={t('vouchers:stats.totalUsage')}
                        value={totalUsage}
                        icon={Users}
                        iconColor="text-secondary-600"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {analyticsLoading ? (
                    <div className="col-span-2 flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : (
                    <>
                        <CustomLineChart
                            data={monthUsageData}
                            xAxisKey="month"
                            lineKeys={['used_count']}
                            lineNames={[t('vouchers:charts.yAxisLabel')]}
                            colors={['#008c8c', '#00bfbf', '#2ACEF2']}
                            height={350}
                            title={t('vouchers:charts.usageOverTime')}
                            yAxisLabel={t('vouchers:charts.yAxisLabel')}
                            showLegend={true}
                            showGrid={true}
                            showGradientFill={true}
                            gradientOpacity={0.15}
                        />

                        <CustomPieChart
                            data={couponUsageData}
                            colors={['#008c8c', '#00bfbf', '#2ACEF2', '#4DC9E6', '#8CE0FF']}
                            height={300}
                            title={t('vouchers:charts.usageByVoucher')}
                            showCenterMetric={true}
                            centerMetricValue={`${analytics?.data.total_coupons || 0}`}
                            centerMetricLabel={t('vouchers:charts.centerMetricLabel')}
                            showPercentage={true}
                            showLegend={true}
                            showLabels={true}
                        />
                    </>
                )}
            </div>

            {/* Table Section */}
            {loading && vouchers.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <MainTable
                    columns={columns}
                    data={vouchers}
                    searchPlaceholder={t('vouchers:searchPlaceholder')}
                    currentPage={filters.page}
                    itemsPerPage={filters.page_limit}
                    totalItems={pagination.count}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                    topActions={topActions}
                    sortConfig={sortConfig}
                    onSort={onSort}
                    noDataMessage={t('vouchers:noData')}
                />
            )}
        </div>
    );
}

export default Vouchers;