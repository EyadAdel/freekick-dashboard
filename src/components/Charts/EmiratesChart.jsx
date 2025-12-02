import React, {useEffect, useRef, useState} from 'react';
import { MapPin, Calendar, ChevronDown } from 'lucide-react';
import map_image from '../../assets/mapcity.svg';

const EmiratesChart = ({
                           data = {},
                           title = "Top Emirates",
                           subtitle = "This Week",
                           loading = false,
                           error = null,
                           onRetry,
                           className = "",
                           showIcon = true,
                           icon: Icon = MapPin,
                           iconColor = "text-blue-500",
                           // New props for period filtering
                           periodOptions = [
                               { value: 'this_week', label: 'This Week' },
                               { value: 'last_week', label: 'Last Week' },
                               { value: 'this_month', label: 'This Month' },
                               { value: 'last_month', label: 'Last Month' }
                           ],
                           currentPeriod = 'this_week',
                           onPeriodChange,
                           showPeriodFilter = true,
                       }) => {
    const EMIRATES = [
        'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
        'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'
    ];

    const emirateColors = {
        'Abu Dhabi': 'bg-cyan-400',
        'Dubai': 'bg-green-400',
        'Sharjah': 'bg-blue-300',
        'Ajman': 'bg-cyan-400',
        'Umm Al Quwain': 'bg-gray-400',
        'Ras Al Khaimah': 'bg-cyan-300',
        'Fujairah': 'bg-blue-600'
    };

    // State for dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const transformData = () => {
        if (!data || typeof data !== 'object') {
            return EMIRATES.map(emirate => ({
                name: emirate,
                value: 0
            }));
        }

        return EMIRATES.map(emirate => {
            let value = data[emirate] ||
                data[emirate.replace(/ /g, '_')] ||
                data[emirate.replace(/ /g, '-')] ||
                data[emirate.toLowerCase()] ||
                0;

            return {
                name: emirate,
                value: Number(value) || 0
            };
        }).sort((a, b) => b.value - a.value);
    };

    const chartData = transformData();
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const maxValue = Math.max(...chartData.map(item => item.value), 1);

    // Get current period label
    const currentPeriodLabel = periodOptions.find(p => p.value === currentPeriod)?.label || subtitle;

    // Handle period change
    const handlePeriodChange = (period) => {
        setIsDropdownOpen(false);
        if (onPeriodChange) {
            onPeriodChange(period);
        }
    };
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        // Add event listener when dropdown is open
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Clean up event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]); // Re-run when isDropdownOpen changes
    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 relative ${className}`}>
            {/* TRANSPARENT Loading Overlay - No background color */}
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <span className="text-sm text-gray-600">Loading data...</span>
                    </div>
                </div>
            )}

            {/* Header with period filter */}
            <div className="flex justify-between items-start mb-6">
                <div className={'flex justify-between   w-full'}>
                    <h3 className="text-xl font-bold flex  text-gray-900">{title}</h3>
                    <div className="flex items-center justify-between gap-2 mt-1">
                        {showPeriodFilter ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    disabled={loading}
                                    className={`flex items-center bg-gradient-to-br from-[#84FAA4] via-primary-500  to-[#2ACEF2] py-2 px-2   py-1   gap-1 text-sm px-2 py-1 rounded-md transition-colors ${
                                        loading
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-secondary-600 '
                                    }`}
                                >
                                    <Calendar size={14} className={'text-secondary-600'} />
                                    <span>{currentPeriodLabel}</span>
                                    <ChevronDown
                                        size={14}
                                        className={`transition-transform text-secondary-600 ${isDropdownOpen ? 'rotate-180' : ''} ${
                                            loading ? 'text-secondary-600' : ''
                                        }`}
                                    />
                                </button>

                                {isDropdownOpen && !loading && (
                                    <div className="absolute top-full left-0 mt-1  bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                        {periodOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    handlePeriodChange(option.value);
                                                    setIsDropdownOpen(false); // Close after selection
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                                    currentPeriod === option.value
                                                        ? 'text-primary-600 bg-blue-50'
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">{subtitle}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Error state */}
            {error && !loading && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-red-800 font-medium">Error loading data</h3>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                        {onRetry && (
                            <button
                                onClick={() => onRetry(currentPeriod)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                                disabled={loading}
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Simplified UAE Map Visualization */}
            <div className="mb-2  h-[22vh] rounded-lg  ">
                <img src={map_image} alt={'UAE Map'} className={'w-full h-full  object-contain'} />
            </div>

            {/* Chart Bars */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {chartData.map((item) => {
                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    const barWidth = (item.value / maxValue) * 100;

                    return (
                        <div key={item.name} className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {item.value}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-400">
                                        ({percentage}%)
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full ${emirateColors[item.name]} transition-all duration-500 ease-out`}
                                    style={{ width: `${barWidth}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>


        </div>
    );
};

export default EmiratesChart;