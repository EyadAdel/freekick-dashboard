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
import {Edit2, Trash2, TrendingUp, TrendingDown, TicketPercent, CheckCircle, XCircle, Users} from "lucide-react"
function Vouchers(props) {
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
            toast.error('Failed to load analytics data');
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        dispatch(setPageTitle('Vouchers'));
        fetchVouchers();
        fetchAnalyticsData();
    }, [dispatch, fetchVouchers]);

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
// Format analytics data for charts
    const formatAnalyticsData = useCallback(() => {
        if (!analytics) {
            return {
                monthUsageData: [],
                couponUsageData: []
            };
        }
        console.log(analytics,'gggggg')

        // Format monthly usage data for line chart
        const monthUsageData = analytics.data.used_coupons_last_12_months?.map(item => {
            // Extract month abbreviation from "2025-11" format
            const [year, month] = item.month.split('-');
            const date = new Date(year, month - 1); // month is 0-indexed in Date
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
    // const { clicksOverTimeData, emirateDistributionData } = formatAnalyticsData();

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
        fetchAnalyticsData(); // Refresh analytics when coming back
    };

    const handleDelete = async (id) => {
        const voucherToDelete = vouchers.find(v => v.id === id);
        const voucherName = voucherToDelete?.name || voucherToDelete?.code || 'this voucher';

        const isConfirmed = await showConfirm({
            title: "Delete Voucher?",
            text: `Are you sure you want to delete "${voucherName}"? This action cannot be undone.`,
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            icon: 'warning'
        });

        if(isConfirmed){
            const result = await removeVoucher(id);
            if (result.type?.includes('fulfilled')) {
                toast.success('Voucher deleted successfully');
                fetchVouchers();
                fetchAnalyticsData(); // Refresh analytics after deletion
            }
        }
    };

    const handleSearch = (searchTerm) => {
        setFilters(prev => ({
            ...prev,
            search: searchTerm,
            page: 1, // Reset to first page when searching
        }));
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            page: 1, // Reset to first page when filters change
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
            page: 1, // Reset to first page when sorting
        }));
    };

    const onSort = (sortKey, sortDirection) => {
        handleSort(sortKey, sortDirection);
    };

    const topActions = [
        {
            label: '+ Add Voucher',
            type: 'primary',
            onClick: handleAddVoucher,
        },
    ];

    // Table columns configuration for vouchers (moved after all hooks)
    const columns = [
        {
            header: 'ID',
            accessor: 'id',
            align: 'left',
            sortable: true,
            sortKey: 'id',
        },
        {
            header: 'Code',
            accessor: 'code',
            align: 'left',
            sortable: true,
            sortKey: 'code',
            render: (row) => (
                <div className="font-mono font-medium text-gray-900">{row.code}</div>
            ),
        },
        {
            header: 'Name',
            accessor: 'name',
            align: 'left',
            sortable: true,
            sortKey: 'name',
        },
        {
            header: 'Type',
            accessor: 'discount_type',
            align: 'left',
            sortable: true,
            sortKey: 'discount_type',
            render: (row) => (
                <div className="text-gray-600">
                    {row.discount_type === 'percentage' ? 'Percentage' :
                        row.discount_type === 'fixed' ? 'Fixed Amount' : row.discount_type}
                </div>
            ),
        },
        {
            header: 'Discount',
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
            header: 'Max Discount',
            accessor: 'max_discount_amount',
            align: 'right',
            sortable: true,
            sortKey: 'max_discount_amount',
            render: (row) => (
                <div className="text-gray-600">
                    {row.max_discount_amount
                        ? `$${parseFloat(row.max_discount_amount).toFixed(2)}`
                        : 'No limit'
                    }
                </div>
            ),
        },
        {
            header: 'Usage',
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
            header: 'Valid From',
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
                        : 'Immediate'
                    }
                </div>
            ),
        },
        {
            header: 'Valid To',
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
                        : 'No expiry'
                    }
                </div>
            ),
        },
        {
            header: 'Last Used',
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
                        : 'Never'
                    }
                </div>
            ),
        },
        {
            header: 'Status',
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
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            header: 'Actions',
            accessor: 'actions',
            align: 'center',
            render: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleEditClick(row)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Delete"
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
        <div className="container mx-auto  xl:px-4 px-1 ">
            {analytics && (
                <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2  xl:grid-cols-4 gap-4 mb-4">
                    <StatCard
                        title="Total Vouchers"
                        value={analytics?.data?.total_coupons || 0}
                        // percentChange={statChanges.totalChange}
                        icon={TicketPercent}
                        iconColor="text-secondary-600"
                    />

                    <StatCard
                        title="Active Vouchers"
                        value={analytics?.data?.active_coupons || 0}
                        // percentChange={statChanges.activeChange}
                        icon={CheckCircle}

                        iconColor="text-secondary-600"
                    />

                    <StatCard
                        title="Inactive Vouchers"
                        value={analytics?.data?.inactive_coupons || 0}
                        // percentChange={statChanges.inactiveChange}
                        icon={XCircle}
                        iconColor="text-red-600"
                    />

                    <StatCard
                        title="Total Usage"
                        value={totalUsage}
                        // percentChange={statChanges.usageChange}
                        icon={Users}
                        iconColor="text-secondary-600"
                    />
                </div>            )}

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
                            lineNames={['Used Count']}
                            colors={['#008c8c', '#00bfbf', '#2ACEF2']}
                            height={350}
                            title="Voucher Usage "
                            yAxisLabel="Usage Count"
                            showLegend={true}
                            showGrid={true}
                            showGradientFill={true}
                            gradientOpacity={0.15}
                        />

                        <CustomPieChart
                            data={couponUsageData}
                            colors={['#008c8c', '#00bfbf', '#2ACEF2', '#4DC9E6', '#8CE0FF']}
                            height={300}
                            title="Usage by Voucher "
                            showCenterMetric={true}
                            centerMetricValue={`${analytics?.data.total_coupons || 0}`}
                            centerMetricLabel=" Vouchers"
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
                    searchPlaceholder="Search vouchers by code, name..."
                    currentPage={filters.page}
                    itemsPerPage={filters.page_limit}
                    totalItems={pagination.count}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                    topActions={topActions}
                    sortConfig={sortConfig}
                    onSort={onSort}
                />
            )}
        </div>
    );
}

export default Vouchers;