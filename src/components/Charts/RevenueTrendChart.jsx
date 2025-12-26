import React, { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp, ChevronDown, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAnalytics from "../../hooks/useAnalytics.js";

const RevenueTrendChart = ({
                               title = "Revenue Trend",
                               height = 350,
                               showPeriodSelector = true,
                               className = ""
                           }) => {
    const { t } = useTranslation('revenueTrendChart');
    const { revenueTrend, isRevenueTrendLoading, error, getRevenueTrend } = useAnalytics();
    const [period, setPeriod] = useState('this_week');
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [trend, setTrend] = useState({ value: 12, isPositive: true });

    const formatLabel = (key, selectedPeriod) => {
        const normalizedKey = key.toLowerCase().trim();

        if (selectedPeriod.includes('week')) {
            const dayMap = {
                'sunday': { short: t('sunday'), full: t('sundayFull') },
                'monday': { short: t('monday'), full: t('mondayFull') },
                'tuesday': { short: t('tuesday'), full: t('tuesdayFull') },
                'wednesday': { short: t('wednesday'), full: t('wednesdayFull') },
                'thursday': { short: t('thursday'), full: t('thursdayFull') },
                'friday': { short: t('friday'), full: t('fridayFull') },
                'saturday': { short: t('saturday'), full: t('saturdayFull') },
                'mon': { short: t('monday'), full: t('mondayFull') },
                'tue': { short: t('tuesday'), full: t('tuesdayFull') },
                'wed': { short: t('wednesday'), full: t('wednesdayFull') },
                'thu': { short: t('thursday'), full: t('thursdayFull') },
                'fri': { short: t('friday'), full: t('fridayFull') },
                'sat': { short: t('saturday'), full: t('saturdayFull') },
                'sun': { short: t('sunday'), full: t('sundayFull') }
            };

            return dayMap[normalizedKey] || {
                short: key.length > 3 ? key.substring(0, 3) : key,
                full: key
            };
        }

        if (selectedPeriod.includes('month')) {
            if (normalizedKey.includes('week')) {
                const weekNum = normalizedKey.replace('week', '').replace('_', '').replace('wk', '').trim();
                const weekKey = `week_${weekNum}`;
                const fullWeekKey = `week${weekNum}Full`;

                return {
                    short: t(weekKey) || `Wk ${weekNum}`,
                    full: t(fullWeekKey) || `Week ${weekNum}`
                };
            }
            return {
                short: key,
                full: key
            };
        }

        return { short: key, full: key };
    };

    const periodOptions = [
        { value: 'this_week', label: t('thisWeek') },
        { value: 'last_week', label: t('lastWeek') },
        { value: 'this_month', label: t('thisMonth') },
        { value: 'last_month', label: t('lastMonth') },
    ];

    useEffect(() => {
        getRevenueTrend(period);
    }, [period, getRevenueTrend]);

    useEffect(() => {
        if (revenueTrend) {
            const total = Object.values(revenueTrend).reduce(
                (sum, value) => sum + (Number(value) || 0),
                0
            );
            setTotalRevenue(total);

            const mockTrend = Math.floor(Math.random() * 30) - 10;
            setTrend({
                value: Math.abs(mockTrend),
                isPositive: mockTrend >= 0
            });
        }
    }, [revenueTrend]);

    const formatChartData = (apiData) => {
        if (!apiData) return [];

        return Object.entries(apiData).map(([key, value]) => {
            const labelInfo = formatLabel(key, period);
            return {
                name: labelInfo.short,
                revenue: Number(value) || 0,
                fullName: labelInfo.full,
                period: period.includes('month') ? labelInfo.full : labelInfo.short
            };
        });
    };

    const data = formatChartData(revenueTrend);

    const handlePeriodChange = (e) => {
        setPeriod(e.target.value);
    };

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
                    {payload.value >= 1000 ? `${(payload.value/1000).toFixed(0)}K` : payload.value}
                </text>
            </g>
        );
    };

    const CustomTooltip = ({ active, payload, coordinate }) => {
        if (active && payload && payload.length) {
            const data = payload[0]?.payload;
            const dotX = coordinate?.x || 0;
            const dotY = coordinate?.y || 0;

            const tooltipHeight = 70;

            return (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        left: dotX,
                        top: dotY - tooltipHeight,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <div className="relative">
                        <div
                            className="absolute z-50 border-[#06B6D4] left-1/2 bottom-0 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px]"
                            style={{
                                transform: 'translate(-50%, 100%)',
                                borderLeftColor: 'transparent',
                                borderRightColor: 'transparent',
                                borderBottomColor: '#06B6D4'
                            }}
                        ></div>

                        <div className="bg-[#06B6D4] text-white text-sm p-3 rounded-lg shadow-lg whitespace-nowrap mb-1">
                            <p className="font-semibold text-xs mb-1">
                                {data?.fullName || data?.name}
                            </p>
                            <p className="font-bold text-xs">
                                {payload[0]?.value?.toLocaleString() || '0'} <span className={'text-[10px] text-gray-300'}>AED</span>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (isRevenueTrendLoading) {
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

    const maxRevenue = Math.max(...data.map(item => item.revenue), 1);
    const yAxisMax = Math.ceil(maxRevenue / 1000) * 1000 || 5000;
    const yAxisTicks = Array.from({ length: 5 }, (_, i) => (yAxisMax / 4) * i);

    return (
        <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="xl:text-xl font-bold text-gray-800 mb-2">{t('revenueTrend')}</h2>
                    <div className="flex items-center">
                        <span className="xl:text-xl font-bold text-gray-900">
                            ${totalRevenue.toLocaleString()}
                        </span>
                        <div className={`ml-3 px-2 py-1 rounded-full flex items-center ${
                            trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                            {trend.isPositive ? (
                                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                            ) : (
                                <ChevronDown className="w-3 h-3 mr-1 text-red-600" />
                            )}
                            <span className="text-sm font-medium">
                                {trend.isPositive ? '+' : '-'}{trend.value}%
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{t('totalRevenue')}</p>
                </div>

                {showPeriodSelector && (
                    <div className="lg:mt-0">
                        <div className="relative">
                            <select
                                value={period}
                                onChange={handlePeriodChange}
                                className="appearance-none text-secondary-600 bg-gradient-to-br from-[#84FAA4] cursor via-primary-500 to-[#2ACEF2] py-2 px-2 border border-gray-300 rounded-lg px-4 pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {periodOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-600" />
                            <svg
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-64">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                        >
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                            />

                            <XAxis
                                dataKey="name"
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
                                position={{ x: 0, y: 0 }}
                                cursor={{ stroke: '#06B6D4', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />

                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#06B6D4"
                                strokeWidth={2}
                                fill="url(#revenueGradient)"
                                animationDuration={1000}
                                dot={{
                                    stroke: '#06B6D4',
                                    strokeWidth: 2,
                                    fill: 'white',
                                    r: 4
                                }}
                                activeDot={{
                                    stroke: '#06B6D4',
                                    strokeWidth: 2,
                                    fill: 'white',
                                    r: 6,
                                    className: "active-dot"
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg
                                className="w-12 h-12 text-gray-400 mx-auto mb-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-gray-500">{t('noRevenueData')}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-6 h-2 rounded-sm bg-gradient-to-r from-[#06B6D4]/80 to-[#06B6D4]/20 mr-2"></div>
                        <span className="text-xs text-gray-600">{t('revenueTrendLegend')}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                        {t('hoverForDetails')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueTrendChart;