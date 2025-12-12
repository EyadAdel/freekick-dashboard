import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CustomLineChart from '../../components/Charts/LineChart.jsx';
import MainTable from '../../components/MainTable.jsx';
import analyticsService from '../../services/analyticsService.js';
import TransactionReceipt from '../../components/common/TransactionReceipt.jsx';
import logo from '../../assets/logo.svg';
import { FaFilePdf, FaArrowUp, FaArrowDown, FaDollarSign, FaMoneyBillWave, FaBalanceScale } from "react-icons/fa";
import { TrendingUp, TrendingDown } from 'lucide-react';
import StatCard from "../../components/Charts/StatCards.jsx";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import { useDispatch } from "react-redux";
import Transactions from "./Transactions.jsx";

function RevenueOverview() {
    const [revenueData, setRevenueData] = useState([]);
    const [transferData, setTransferData] = useState([]);
    const [analytics, setAnalytics] = useState({
        total_income: 0,
        total_expense: 0,
        total: 0,
        revenue_overview: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { t } = useTranslation(['revenueOverview', 'common']);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('revenueOverview:title')));
    }, [dispatch, t]);

    useEffect(() => {
        fetchAnalytics();
        fetchChartsData();
    }, []);

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
            setError(t('revenueOverview:error.message'));
        } finally {
            setLoading(false);
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
                <p className="font-semibold">{t('revenueOverview:error.title')}</p>
                <p className="text-sm">{error}</p>
                <button
                    onClick={() => {
                        fetchChartsData();
                        fetchAnalytics();
                    }}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    {t('revenueOverview:error.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-white rounded-lg p-4 lg:p-8">
            {/* Stats Cards Section */}
            <div className="mb-8">
                <div className="grid grid-cols-3 gap-4">
                    {/* Total Income */}
                    <StatCard
                        title={t('revenueOverview:stats.totalIncome')}
                        value={analytics.total_income}
                        percentChange={analytics.total_income > 0 ? 12.5 : 0}
                        icon={FaArrowUp}
                        iconColor="text-green-600"
                    />

                    {/* Total Expense */}
                    <StatCard
                        title={t('revenueOverview:stats.totalExpense')}
                        value={analytics.total_expense}
                        percentChange={analytics.total_expense > 0 ? -8.2 : 0}
                        icon={FaArrowDown}
                        iconColor="text-red-600"
                    />

                    {/* Net Balance */}
                    <StatCard
                        title={t('revenueOverview:stats.netBalance')}
                        value={analytics.total}
                        percentChange={analytics.total > 0 ? 5.7 : -5.7}
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
                    title={t('revenueOverview:charts.monthlyRevenue')}
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
                    title={t('revenueOverview:charts.monthlyTransfers')}
                    showGrid={true}
                    showLegend={false}
                    showGradientFill={true}
                    gradientOpacity={0.3}
                    chartType="area"
                />
            </div>

            {/* Transactions Table Section */}
            <Transactions />
        </div>
    );
}

export default RevenueOverview;