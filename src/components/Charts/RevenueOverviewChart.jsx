import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import analyticsService from '../../services/analyticsService.js';
import { Calendar } from 'lucide-react';

const RevenueOverviewChart = ({
                                  title = "revenueOverview:charts.monthlyRevenue",
                                  height = 300,
                                  className = ""
                              }) => {
    const [analytics, setAnalytics] = useState({
        total_income: 0,
        total_expense: 0,
        total: 0,
        revenue_overview: {}
    });
    const [isLoading, setIsLoading] = useState(true);

    const { t } = useTranslation(['revenueOverview', 'common']);

    // Fetch analytics data
    const fetchAnalytics = async () => {
        setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // Transform revenue overview data for chart
    const transformData = () => {
        const revenueData = analytics.revenue_overview;
        if (!revenueData || Object.keys(revenueData).length === 0) {
            return [];
        }
        // Currently using monthly as fallback
        return Object.entries(revenueData).map(([month, amount]) => ({
            month: month.substring(0, 3),
            revenue: amount || 0,
            fullMonth: month
        }));
    };

    const chartData = transformData();

    // Calculate total revenue from the data
    const totalRevenue = chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);

    // Calculate trend
    const calculateTrend = () => {
        const values = chartData.map(item => item.revenue);
        if (values.length < 2) return { value: 0, isPositive: true };

        const lastTwoMonths = values.slice(-2);
        if (lastTwoMonths[0] === 0 || lastTwoMonths[1] === 0) {
            return { value: 0, isPositive: true };
        }

        const trendPercentage = ((lastTwoMonths[1] - lastTwoMonths[0]) / lastTwoMonths[0]) * 100;
        return {
            value: Math.abs(Math.round(trendPercentage)),
            isPositive: trendPercentage >= 0
        };
    };

    const trend = calculateTrend();

    // Custom Tooltip component
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0]?.payload;
            return (
                <div className="bg-[#06B6D4] text-white text-sm p-3 rounded-lg shadow-lg">
                    <p className="font-semibold text-xs mb-1">
                        {data?.fullMonth || label}
                    </p>
                    <p className="font-bold text-xs">
                        ${payload[0]?.value?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }) || '0.00'}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom YAxis tick
    const CustomYAxisTick = ({ x, y, payload }) => {
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dx={-10}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize={12}
                    className="font-medium"
                >
                    ${payload.value >= 1000 ? `${(payload.value/1000).toFixed(0)}K` : payload.value.toFixed(0)}
                </text>
            </g>
        );
    };

    if (isLoading) {
        return (
            <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        );
    }

    // Find max value for YAxis domain
    const maxRevenue = Math.max(...chartData.map(item => item.revenue), 1);
    const yAxisMax = Math.ceil(maxRevenue / 1000) * 1000 || 1000;
    const yAxisTicks = Array.from({ length: 5 }, (_, i) => (yAxisMax / 4) * i);

    // Function to get bar color based on value
    const getBarColor = (value) => {
        if (value <= 0) return '#e2e8f0';
        if (value < maxRevenue * 0.33) return '#b3e6e6';
        if (value < maxRevenue * 0.66) return '#2ACEF2';
        return '#00bfbf';
    };

    // Determine bar width based on number of data points
    const getBarSize = () => {
        if (chartData.length <= 7) return 25;
        return 15;
    };

    return (
        <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
            {/* Header with title and stats */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="xl:text-xl font-bold text-gray-800 mb-2">
                        {typeof title === 'string' && title.includes(':') ? t(title) : title}
                    </h2>
                    <div className="flex items-center">
                        <span className="xl:text-xl font-bold text-gray-900">
                            ${totalRevenue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                        </span>
                        <div className={`ml-3 px-2 py-1 rounded-full flex items-center ${trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <span className="text-sm font-medium">
                                {trend.isPositive ? '+' : '-'}{trend.value}%
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        {t('revenueOverview:netBalance')}: ${analytics.total?.toFixed(2) || '0.00'}
                        ({t('revenueOverview:income')}: ${analytics.total_income?.toFixed(2) || '0.00'} | {t('revenueOverview:expense')}: ${analytics.total_expense?.toFixed(2) || '0.00'})
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-64">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 10,
                                right: 20,
                                left: 20,
                                bottom: 10,
                            }}
                            barSize={getBarSize()}
                            barGap={8}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                            />

                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                padding={{ left: 10, right: 10 }}
                                interval={0}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={<CustomYAxisTick />}
                                ticks={yAxisTicks}
                                domain={[0, yAxisMax]}
                            />

                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(203, 213, 225, 0.1)' }}
                            />

                            <Bar
                                dataKey="revenue"
                                radius={[4, 4, 0, 0]}
                                barSize={getBarSize()}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={getBarColor(entry.revenue)}
                                        className="hover:opacity-80 transition-opacity duration-200"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">{t('revenueOverview:noData')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bar chart legend */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-sm bg-[#b3e6e6] mr-2"></div>
                            <span className="text-xs text-gray-600">{t('revenueOverview:legend.lowRevenue')}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-sm bg-[#2ACEF2] mr-2"></div>
                            <span className="text-xs text-gray-600">{t('revenueOverview:legend.mediumRevenue')}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-sm bg-[#00bfbf] mr-2"></div>
                            <span className="text-xs text-gray-600">{t('revenueOverview:legend.highRevenue')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueOverviewChart;