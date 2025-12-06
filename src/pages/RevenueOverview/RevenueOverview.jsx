import React, { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CustomLineChart from '../../components/Charts/LineChart.jsx';
import MainTable from '../../components/MainTable.jsx';
import analyticsService from '../../services/analyticsService.js';
import TransactionReceipt from '../../components/common/TransactionReceipt.jsx';
import logo from '../../assets/logo.svg'
import { FaFilePdf, FaArrowUp, FaArrowDown, FaDollarSign, FaMoneyBillWave, FaBalanceScale } from "react-icons/fa";
import { TrendingUp, TrendingDown } from 'lucide-react';
import StatCard from "../../components/Charts/StatCards.jsx";
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";
import {useDispatch} from "react-redux";


function RevenueOverview() {
    const [revenueData, setRevenueData] = useState([]);
    const [transferData, setTransferData] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [analytics, setAnalytics] = useState({
        total_income: 0,
        total_expense: 0,
        total: 0,
        revenue_overview: {}
    });
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [generatingPDFId, setGeneratingPDFId] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const printRef = useRef();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;

    // Sort state
    const [sortConfig, setSortConfig] = useState({
        key: 'created_at',
        direction: 'desc'
    });

    // Active filters
    const [activeFilters, setActiveFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Revenue Overview'));
    }, [dispatch]);

    useEffect(() => {
        fetchAnalytics();
        fetchChartsData();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [currentPage, sortConfig, activeFilters, searchTerm]);

    // Generate PDF when transaction is selected
    useEffect(() => {
        if (selectedTransaction && printRef.current) {
            generatePDF();
        }
    }, [selectedTransaction]);

    const generatePDF = async () => {
        try {
            setIsGeneratingPDF(true);

            // Wait a bit for the component to render
            await new Promise(resolve => setTimeout(resolve, 100));

            const element = printRef.current;

            // Generate canvas from the element
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // Calculate PDF dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Download the PDF
            pdf.save(`Transaction_${selectedTransaction.id}_Receipt.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
            setGeneratingPDFId(null);
            setSelectedTransaction(null);
        }
    };

    const fetchChartsData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [bookingAnalytics, transferAnalytics] = await Promise.all([
                analyticsService.getBookingChartAnalytics('this_year'),
                analyticsService.getBookingTransferAnalytics()
            ]);

            if (bookingAnalytics?.data) {
                const formattedRevenueData = Object.entries(bookingAnalytics.data).map(([month, value]) => ({
                    month: month.substring(0, 3).toUpperCase(),
                    clicks: value || 0
                }));
                setRevenueData(formattedRevenueData);
            }

            if (transferAnalytics?.data) {
                const formattedTransferData = Object.entries(transferAnalytics.data).map(([month, value]) => ({
                    month: month.substring(0, 3).toUpperCase(),
                    clicks: value || 0
                }));
                setTransferData(formattedTransferData);
            }
        } catch (err) {
            console.error('Error fetching charts data:', err);
            setError('Failed to load charts data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            setTableLoading(true);

            const params = {
                page: currentPage,
                page_limit: itemsPerPage,
                ordering: sortConfig.direction === 'desc' ? `-${sortConfig.key}` : sortConfig.key,
            };

            if (searchTerm) {
                params.search = searchTerm;
            }

            Object.entries(activeFilters).forEach(([key, value]) => {
                if (value !== '' && value !== undefined) {
                    params[key] = value;
                }
            });

            const response = await analyticsService.getStaffActions(params);

            setTransactions(response.results || []);
            setTotalCount(response.count || 0);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        } finally {
            setTableLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await analyticsService.getStaffActionsAnalytics();

            if (response?.data) {
                setAnalytics({
                    total_income: response.data.total_income || 0,
                    total_expense: response.data.total_expense || 0,
                    total: response.data.total || 0,
                    revenue_overview: response.data.revenue_overview || {}
                });
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        }
    };

    const handleDownloadReceipt = (transaction) => {
        setGeneratingPDFId(transaction.id);
        setSelectedTransaction(transaction);
    };

    // Handle search
    const handleSearch = (search) => {
        setSearchTerm(search);
        setCurrentPage(1);
    };

    // Handle filter changes
    const handleFilterChange = (filters) => {
        setActiveFilters(filters);
        setCurrentPage(1);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Handle sort
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key: key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format amount
    const formatAmount = (amount) => {
        if (!amount && amount !== 0) return 'N/A';
        return `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Calculate percentage change (example - you might want to get this from API)
    const calculatePercentChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / Math.abs(previous) * 100).toFixed(1);
    };

    // Table columns configuration
    const columns = [
        {
            header: 'Transaction ID',
            accessor: 'id',
            align: 'left',
            sortable: true,
            sortKey: 'id',
            render: (row) => (
                <span className="font-semibold">
                    #{row.id}
                </span>
            )
        },
        {
            header: 'Description',
            accessor: 'description',
            align: 'left'
        },
        {
            header: 'Amount',
            accessor: 'amount',
            align: 'right',
            sortable: true,
            sortKey: 'amount',
            render: (row) => (
                <span className={`font-semibold ${
                    row.kind === 'add' ? 'text-green-600' : 'text-red-600'
                }`}>
                    {row.kind === 'add' ? '+' : '-'} AED {formatAmount(row.amount)}
                </span>
            )
        },
        {
            header: 'Type',
            accessor: 'kind',
            align: 'center',
            sortable: true,
            sortKey: 'kind',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    row.kind === 'add'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                }`}>
                    {row.kind === 'add' ? 'Credit' : 'Debit'}
                </span>
            )
        },
        {
            header: 'Booking Action',
            accessor: 'booking_action',
            align: 'center',
            render: (row) => row.booking_action || 'N/A'
        },
        {
            header: 'Date',
            accessor: 'created_at',
            align: 'left',
            sortable: true,
            sortKey: 'created_at',
            render: (row) => formatDate(row.created_at)
        },
        {
            header: 'Receipt',
            align: 'center',
            sortable: false,
            render: (row) => (
                <button
                    onClick={() => handleDownloadReceipt(row)}
                    disabled={isGeneratingPDF && generatingPDFId === row.id}
                    className={`px-3 py-2 gap-[2px] flex items-center rounded-full text-xs text-white transition-colors ${
                        isGeneratingPDF && generatingPDFId === row.id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-primary-500 bg-opacity-80'
                    }`}
                >
                    <FaFilePdf size={'12'} /> {isGeneratingPDF && generatingPDFId === row.id ? 'Generating...' : 'Print PDF'}
                </button>
            )
        },
    ];

    // Filter configurations
    const filterConfigs = [
        {
            type: 'select',
            key: 'kind',
            label: 'Transaction Type',
            options: [
                { value: 'add', label: 'Credit' },
                { value: 'deduct', label: 'Debit' }
            ]
        },
        {
            type: 'number',
            key: 'amount',
            label: 'Exact Amount',
        },
        {
            type: 'number',
            key: 'amount__gte',
            label: 'Min Amount',
        },
        {
            type: 'number',
            key: 'amount__lte',
            label: 'Max Amount',
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-100 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-[180px] bg-gray-100 rounded"></div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-[180px] bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="font-semibold">Error loading data</p>
                <p className="text-sm">{error}</p>
                <button
                    onClick={() => {
                        fetchChartsData();
                        fetchAnalytics();
                    }}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-white rounded-lg p-4 lg:p-8">
            {/* Hidden receipt for PDF generation */}
            {selectedTransaction && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <TransactionReceipt
                        ref={printRef}
                        transaction={selectedTransaction}
                        logo={logo}
                    />
                </div>
            )}

            {/* Stats Cards Section */}
            <div className="mb-8">
                <div className="grid grid-cols-3 gap-4">
                    {/* Total Income */}
                    <StatCard
                        title="Total Income"
                        value={analytics.total_income}
                        percentChange={analytics.total_income > 0 ? 12.5 : 0} // Example percentage
                        icon={FaArrowUp}
                        iconColor="text-green-600"
                    />

                    {/* Total Expense */}
                    <StatCard
                        title="Total Expense"
                        value={analytics.total_expense}
                        percentChange={analytics.total_expense > 0 ? -8.2 : 0} // Example percentage
                        icon={FaArrowDown}
                        iconColor="text-red-600"
                    />

                    {/* Net Balance */}
                    <StatCard
                        title="Net Balance"
                        value={analytics.total}
                        percentChange={analytics.total > 0 ? 5.7 : -5.7} // Example percentage
                        icon={FaBalanceScale}
                        iconColor={analytics.total >= 0 ? "text-green-600" : "text-red-600"}
                    />
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <CustomLineChart
                    data={revenueData}
                    xAxisKey="month"
                    lineKeys={['clicks']}
                    colors={['#2ACEF2']}
                    height={180}
                    title="Monthly Revenue"
                    showGrid={true}
                    showLegend={false}
                    showGradientFill={true}
                    gradientOpacity={0.3}
                    chartType="line"
                />

                <CustomLineChart
                    data={transferData}
                    xAxisKey="month"
                    lineKeys={['clicks']}
                    colors={['#84FAA4']}
                    height={180}
                    title="Monthly Transfers"
                    showGrid={true}
                    showLegend={false}
                    showGradientFill={true}
                    gradientOpacity={0.3}
                    chartType="area"
                />
            </div>

            {/* Transactions Table Section */}
            <div className="mt-8 lg:mt-10">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
                </div>

                <MainTable
                    columns={columns}
                    data={transactions}
                    searchPlaceholder="Search transactions..."
                    filters={filterConfigs}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalCount}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                />
            </div>
        </div>
    );
}

export default RevenueOverview;