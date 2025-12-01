import React from 'react';
import { TrendingUp } from 'lucide-react';

const BarChart = ({
                      data = {},
                      title = "Top Items",
                      subtitle = "This Week",
                      loading = false,
                      error = null,
                      onRetry,
                      className = "",
                      maxItems = 6,
                      colors = [
                          'bg-blue-500',
                          'bg-purple-500',
                          'bg-green-500',
                          'bg-yellow-500',
                          'bg-red-500',
                          'bg-indigo-500',
                          'bg-pink-500'
                      ],
                      // New props for customization
                      valueLabel = "Value",
                      totalLabel = "Total",
                      showIcon = true,
                      icon: Icon = TrendingUp,
                      iconColor = "text-blue-500",
                  }) => {
    // Transform API data to chart format
    const transformData = () => {
        if (!data || typeof data !== 'object') return [];

        return Object.entries(data)
            .map(([name, value]) => ({
                name,
                value: typeof value === 'number' ? value : parseInt(value) || 0
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, maxItems);
    };

    const chartData = transformData();

    // Calculate total for percentages
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    // Loading state
    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    </div>
                    {showIcon && <Icon className="text-gray-400" size={20} />}
                </div>
                <div className="space-y-4">
                    {[...Array(maxItems)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="flex justify-between mb-1">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    </div>
                    {showIcon && <Icon className="text-gray-400" size={20} />}
                </div>
                <div className="text-center py-8">
                    <div className="text-red-500 mb-2">Failed to load data</div>
                    <p className="text-sm text-gray-500 mb-4">{error}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // No data state
    if (chartData.length === 0) {
        return (
            <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    </div>
                    {showIcon && <Icon className="text-gray-400" size={20} />}
                </div>
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">No data available</div>
                    <p className="text-sm text-gray-500">No data to display</p>
                </div>
            </div>
        );
    }

    // Find max value for scaling
    const maxValue = Math.max(...chartData.map(item => item.value));

    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
                {showIcon && <Icon className={iconColor} size={20} />}
            </div>

            {/* Chart Items */}
            <div className="space-y-5">
                {chartData.map((item, index) => {
                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                    return (
                        <div key={item.name} className="space-y-1">
                            {/* Item name and percentage */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 ${colors[index % colors.length]} rounded-full mr-3`}></div>
                                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm font-semibold text-gray-900 mr-2">{item.value}</span>
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {percentage}%
                  </span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${colors[index % colors.length]} transition-all duration-500 ease-out`}
                                    style={{ width: `${barWidth}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Total summary */}
            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{totalLabel}</span>
                    <span className="text-lg font-bold text-gray-900">{total}</span>
                </div>
            </div>
        </div>
    );
};

export default BarChart;