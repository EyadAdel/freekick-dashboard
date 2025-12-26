import React, { useState } from 'react';
import {
    LineChart,
    AreaChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { FaInfoCircle } from 'react-icons/fa';

const CustomTooltipComponent = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#00bfbf] text-white text-sm p-3 rounded-lg shadow-lg">
                <p className="font-semibold text-xs mb-1">Month: {label}</p>
                <p className="font-bold text-xs"> {payload[0]?.value || 0}</p>
            </div>
        );
    }
    return null;
};

const CustomLineChart = ({
                             data = [],
                             xAxisKey = 'month',
                             lineKeys = ['clicks'],
                             colors = ['#ffff'],
                             height = 180,
                             title,
                             description, // New prop for tooltip description
                             showGrid = true,
                             showLegend = false,
                             showGradientFill = true,
                             gradientOpacity = 0.3,
                             chartType = 'line' // 'line' or 'area'
                         }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    // Safety checks
    const safeData = Array.isArray(data) ? data : [];
    const safeLineKeys = Array.isArray(lineKeys) ? lineKeys : ['clicks'];

    const generateGradientId = (index) => `lineGradient_${index}`;
    const generateAreaGradientId = (index) => `areaGradient_${index}`;

    // If no data, show message
    if (safeData.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
                <div className="flex items-center justify-center" style={{ height }}>
                    <p className="text-gray-500">No data available</p>
                </div>
            </div>
        );
    }

    // Choose the appropriate chart component
    const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

    return (
        <div dir={'ltr'} className="bg-white rounded-lg shadow p-3 px-5">
            {title && (
                <div className="mb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                            {description && (
                                <div className="relative">
                                    <FaInfoCircle
                                        className="text-gray-400 hover:text-gray-600 cursor-help transition-colors duration-200"
                                        size={14}
                                        onMouseEnter={() => setShowTooltip(true)}
                                        onMouseLeave={() => setShowTooltip(false)}
                                    />
                                    {showTooltip && (
                                        <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl rtl:right-0 rtl:left-auto">
                                            <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 transform rotate-45 rtl:left-auto rtl:right-2"></div>
                                            {description}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center mt-1">
                        <div className="h-1 w-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-500">Monthly trend</span>
                    </div>
                </div>
            )}

            <div style={{ width: '100%', height: height }}>
                <ResponsiveContainer>
                    <ChartComponent
                        data={safeData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 10,
                        }}
                    >
                        <defs>
                            <linearGradient id="chartBackground" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ffff" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#eeee" stopOpacity={0.2}/>
                            </linearGradient>

                            {safeLineKeys.map((_, index) => (
                                <React.Fragment key={`gradient_${index}`}>
                                    <linearGradient
                                        id={generateGradientId(index)}
                                        x1="0"
                                        y1="0"
                                        x2="1"
                                        y2="0"
                                    >
                                        <stop offset="0%" stopColor="#84FAA4" stopOpacity={1} />
                                        <stop offset="50%" stopColor="#2ACEF2" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#2ACEF2" stopOpacity={1} />
                                    </linearGradient>

                                    <linearGradient
                                        id={generateAreaGradientId(index)}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="0%" stopColor="#2ACEF2" stopOpacity={gradientOpacity} />
                                        <stop offset="100%" stopColor="#2ACEF2" stopOpacity={0} />
                                    </linearGradient>
                                </React.Fragment>
                            ))}
                        </defs>

                        <rect
                            x={0}
                            y={0}
                            width="100%"
                            height="100%"
                            fill="url(#chartBackground)"
                        />

                        {showGrid && (
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#cbd5e1"
                                strokeOpacity={0.5}
                                vertical={false}
                            />
                        )}

                        <XAxis
                            dataKey={xAxisKey}
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                            axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                            tickLine={false}
                            padding={{ left: 10, right: 10 }}
                            tickMargin={8}
                        />

                        <YAxis
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                            axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                            tickLine={false}
                            tickMargin={8}
                            width={45}
                            domain={['dataMin - 10', 'dataMax + 10']}
                        />

                        <Tooltip content={<CustomTooltipComponent/>} />

                        {showLegend && (
                            <Legend
                                verticalAlign="top"
                                height={10}
                                wrapperStyle={{
                                    paddingBottom: '10px'
                                }}
                                formatter={(value) => (
                                    <span className="text-sm font-medium text-gray-700">{value}</span>
                                )}
                            />
                        )}

                        {chartType === 'area' ? (
                            // Area Chart rendering
                            safeLineKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={`url(#${generateGradientId(index)})`}
                                    strokeWidth={3}
                                    fill={showGradientFill ? `url(#${generateAreaGradientId(index)})` : 'transparent'}
                                    fillOpacity={1}
                                    dot={false}
                                    activeDot={false}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    connectNulls={true}
                                />
                            ))
                        ) : (
                            // Line Chart rendering
                            safeLineKeys.map((key, index) => (
                                <React.Fragment key={key}>
                                    {showGradientFill && (
                                        <Area
                                            type="monotone"
                                            dataKey={key}
                                            stroke="transparent"
                                            fill={`url(#${generateAreaGradientId(index)})`}
                                            fillOpacity={1}
                                        />
                                    )}

                                    <Line
                                        type="monotone"
                                        dataKey={key}
                                        stroke={`url(#${generateGradientId(index)})`}
                                        strokeWidth={4}
                                        dot={{
                                            r: 6,
                                            fill: '#ffff',
                                            stroke: '#2ACEF2',
                                            strokeWidth: 2.5,
                                            className: 'shadow-sm'
                                        }}
                                        activeDot={{
                                            r: 9,
                                            fill: '#2ACEF2',
                                            stroke: 'white',
                                            strokeWidth: 3,
                                            className: 'shadow-md'
                                        }}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        connectNulls={true}
                                    />
                                </React.Fragment>
                            ))
                        )}
                    </ChartComponent>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CustomLineChart;