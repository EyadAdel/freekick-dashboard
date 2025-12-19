// components/charts/BookingChart.jsx
import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, ChevronDown } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import useAnalytics from '../../hooks/useAnalytics';

const BookingChart = ({
                          title = "Total Bookings",
                          height = 300,
                          showPeriodSelector = true,
                          className = ""
                      }) => {
    const {
        bookingChartData,
        currentBookingPeriod,
        isBookingChartLoading,
        getBookingChartAnalytics,
        clearError,
        error
    } = useAnalytics();

    const [totalBookings, setTotalBookings] = useState(0);
    const [trend, setTrend] = useState({ value: 12, isPositive: true });

    const periodOptions = [
        { value: 'this_week', label: 'This Week' },
        { value: 'last_week', label: 'Last Week' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
    ];

    useEffect(() => {
        getBookingChartAnalytics(currentBookingPeriod);
    }, [currentBookingPeriod, getBookingChartAnalytics]);

    useEffect(() => {
        if (bookingChartData?.data) {
            const total = Object.values(bookingChartData.data).reduce(
                (sum, value) => sum + (Number(value) || 0),
                0
            );
            setTotalBookings(total);

            const mockTrend = Math.floor(Math.random() * 30) - 10;
            setTrend({
                value: Math.abs(mockTrend),
                isPositive: mockTrend >= 0
            });
        }
    }, [bookingChartData]);

    const handlePeriodChange = (newPeriod) => {
        getBookingChartAnalytics(newPeriod);
    };

    // Function to get short day name
    const getShortDayName = (dayString) => {
        const dayMapping = {
            'monday': 'Mon',
            'tuesday': 'Tue',
            'wednesday': 'Wed',
            'thursday': 'Thu',
            'friday': 'Fri',
            'saturday': 'Sat',
            'sunday': 'Sun',
            'mon': 'Mon',
            'tue': 'Tue',
            'wed': 'Wed',
            'thu': 'Thu',
            'fri': 'Fri',
            'sat': 'Sat',
            'sun': 'Sun',
            'week_1': 'Wk 1',
            'week_2': 'Wk 2',
            'week_3': 'Wk 3',
            'week_4': 'Wk 4',
            'week_5': 'Wk 5'
        };

        // Convert to lowercase and remove any whitespace
        const key = dayString.toLowerCase().trim().replace(/\s+/g, '_');
        return dayMapping[key] || dayString.substring(0, 3); // Fallback: first 3 chars
    };

    const transformData = () => {
        if (!bookingChartData?.data) {
            console.log('No valid booking chart data found:', bookingChartData);
            return [];
        }

        const isMonthly = currentBookingPeriod.includes('month');
        const data = bookingChartData.data;

        if (isMonthly) {
            // For monthly view - show weeks
            return Object.entries(data).map(([key, value]) => ({
                period: key,
                bookings: Number(value) || 0,
                day: getShortDayName(key), // Use short names for weeks
                fullDay: key.replace('_', ' ').replace('week', 'Week ') // Full name for tooltip
            }));
        } else {
            // For weekly view - show days
            return Object.entries(data).map(([key, value]) => ({
                period: key,
                bookings: Number(value) || 0,
                day: getShortDayName(key), // Short day name for X-axis
                fullDay: key.charAt(0).toUpperCase() + key.slice(1) // Full day name for tooltip
            }));
        }
    };

    const chartData = transformData();
    console.log('Transformed Chart Data:', chartData);

    // Rest of your component remains the same...

    const CustomTooltip = ({ active, payload, coordinate }) => {
        if (active && payload && payload.length) {
            const data = payload[0]?.payload;
            const dotX = coordinate?.x || 0;
            const dotY = coordinate?.y || 0;

            // Calculate tooltip position to start from the dot
            const dotRadius = 6; // Active dot radius
            const tooltipHeight = 70; // Approximate height of your tooltip
            const pointerHeight = 8; // Height of the triangle pointer

            return (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        left: dotX,
                        top: dotY - tooltipHeight, // Position above so dot is at bottom of tooltip
                        transform: 'translateX(-50%)',
                    }}
                >
                    <div className="relative">
                        {/* Triangle pointer pointing down to the dot */}
                        <div
                            className="absolute z-50 border-[#06B6D4] left-1/2 bottom-0 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px]"
                            style={{
                                transform: 'translate(-50%, 100%)',
                                borderLeftColor: 'transparent',
                                borderRightColor: 'transparent',
                                borderBottomColor: '#06B6D4'
                            }}
                        ></div>

                        {/* Tooltip content */}
                        <div className="bg-[#06B6D4] text-white text-sm p-3 rounded-lg shadow-lg whitespace-nowrap mb-1">
                            <p className="font-semibold text-xs mb-1">
                                {data?.fullDay || data?.day}
                            </p>
                            <p className="font-bold text-xs">
                                {payload[0]?.value?.toLocaleString() || '0'} bookings
                            </p>
                        </div>
                    </div>
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
                    {payload.value >= 1000 ? `${payload.value/1000}K` : payload.value}
                </text>
            </g>
        );
    };

    if (isBookingChartLoading) {
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
    const maxBookings = Math.max(...chartData.map(item => item.bookings), 1);

    // Calculate dynamic Y-axis max that's close to the largest value
    // Add 20% padding above the max value for better visualization
    const padding = maxBookings * 0.2;
    const rawMax = maxBookings + padding;

    // Round to a nice number based on the scale
    let yAxisMax;
    if (rawMax <= 10) {
        yAxisMax = Math.ceil(rawMax);
    } else if (rawMax <= 100) {
        yAxisMax = Math.ceil(rawMax / 10) * 10;
    } else if (rawMax <= 1000) {
        yAxisMax = Math.ceil(rawMax / 100) * 100;
    } else {
        yAxisMax = Math.ceil(rawMax / 1000) * 1000;
    }

    const yAxisTicks = Array.from({ length: 5 }, (_, i) => (yAxisMax / 4) * i);

    // Function to get bar color based on value
    const getBarColor = (value) => {
        if (value < maxBookings * 0.33) return '#b3e6e6';
        if (value < maxBookings * 0.66) return '#2ACEF2';
        if (value > maxBookings * 0.66) return '#00bfbf';

        // return '#00bfbf';
    };

    // Determine bar width based on number of data points
    const getBarSize = () => {
        if (chartData.length <= 7) return 25; // Week view
        return 20; // Month view (more data points)
    };

    return (
        <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
            {/* Header with title and stats */}
            <div className="flex  items-start justify-between mb-4">
                <div>
                    <h2 className="xl:text-xl font-bold text-gray-800 mb-2">{title}</h2>
                    <div className="flex items-center">
                        <span className="xl:text-xl font-bold text-gray-900">{totalBookings.toLocaleString()}</span>
                        <div className={`ml-3 px-2 py-1 rounded-full flex items-center ${trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <TrendingUp className={`w-3 h-3 mr-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`} />
                            <span className="text-sm font-medium">
                                {trend.isPositive ? '+' : '-'}{trend.value}%
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Match played</p>
                </div>

                {showPeriodSelector && (
                    <div className=" lg:mt-0">
                        <div className="relative">
                            <select
                                value={currentBookingPeriod}
                                onChange={(e) => handlePeriodChange(e.target.value)}
                                className="appearance-none text-secondary-600 focus:cursor bg-gradient-to-br from-[#84FAA4] via-primary-500 to-[#2ACEF2] py-2 px-2 border border-gray-300 rounded-lg px-4 pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {periodOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-600" />
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-600" />
                        </div>
                    </div>
                )}
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
                                dataKey="day"  // Use the 'day' field which contains short names
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
                                dataKey="bookings"
                                radius={[4, 4, 0, 0]}
                                barSize={getBarSize()}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={getBarColor(entry.bookings)}
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
                            <p className="text-gray-500">No chart data available</p>
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
                            <span className="text-xs text-gray-600">Low bookings</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-sm bg-[#2ACEF2] mr-2"></div>
                            <span className="text-xs text-gray-600">Medium bookings</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-sm bg-[#00bfbf] mr-2"></div>
                            <span className="text-xs text-gray-600">High bookings</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingChart;