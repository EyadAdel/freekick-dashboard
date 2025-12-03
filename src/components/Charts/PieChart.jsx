import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CustomPieChart = ({
                            data,
                            nameKey = 'name',
                            valueKey = 'value',
                            colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'],
                            height = 180,
                            title,
                            showLegend = true,
                            showCenterMetric = false, // NEW: Show metric in center of pie chart
                            centerMetricValue = '80%', // NEW: Metric value to show in center
                            centerMetricLabel = 'Clicks', // NEW: Metric label
                            showPercentage = true,
                        }) => {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            {/* Title at the top */}
            {title && (
                <h3 className="xl:text-xl font-bold text-gray-800 mb-2">{title}</h3>
            )}

            <div style={{ width: '100%', height: height, position: 'relative' }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={showPercentage ? ({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%` : false
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey={valueKey}
                            nameKey={nameKey}
                            innerRadius={60} // Makes it a donut chart
                            paddingAngle={2}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                    stroke="#fff"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value, name, props) => {
                                const percent = (value / data.reduce((sum, item) => sum + item[valueKey], 0) * 100).toFixed(1);
                                return [`${value} (${percent}%)`, props.payload[nameKey]];
                            }}
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center metric overlay - positioned absolutely in the center */}
                {showCenterMetric && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            pointerEvents: 'none',
                        }}
                    >
                        <div className="text-xl font-bold text-secondary-600">
                            {centerMetricValue}
                        </div>
                        <div className="text-sm  text-gray-700 mt-1">
                            {centerMetricLabel}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom legend at the bottom */}
            {showLegend && (
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                    {data.map((entry, index) => (
                        <div key={`legend-${index}`} className="flex items-center">
                            <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: colors[index % colors.length] }}
                            ></div>
                            <span className="text-sm font-medium text-gray-700">{entry[nameKey]}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomPieChart;