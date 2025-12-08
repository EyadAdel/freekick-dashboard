import React, { useState, useEffect } from 'react';
import analyticsService from "../../services/analyticsService.js";
import stadiumIcon from "../../assets/stadiumIcon.svg";

const COLORS = [
    '#22D3EE', // cyan
    '#475569',
    '#06B6D4', // darker cyan
    '#777777', // light slate
    '#4ADE80'  // green
];

const CITIES = [
    { value: 'All Cities', label: 'All Cities' },
    { value: 'Abu Dhabi', label: 'Abu Dhabi' },
    { value: 'Dubai', label: 'Dubai' },
    { value: 'Sharjah', label: 'Sharjah' }
];

const PopularVenues = () => {
    const [venuesData, setVenuesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedCity, setSelectedCity] = useState('All Cities');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [centerContent, setCenterContent] = useState({ type: 'image', imageUrl: stadiumIcon });

    useEffect(() => {
        fetchVenuesAnalytics();
    }, [year]);

    const fetchVenuesAnalytics = async () => {
        try {
            setLoading(true);

            const response = await analyticsService.getPopularVenuesAnalytics(year);

            // Extract venues from response
            const venuesList = response.data || response.results || response || [];

            const processedData = venuesList.slice(0, 5).map((venue, index) => {
                // Extract name from translations (prefer English, fallback to Arabic)
                const venueName = venue.translations?.en?.name ||
                    venue.translations?.ar?.name ||
                    venue.name ||
                    'Unknown Venue';

                // IMPORTANT: If your API doesn't return booking counts,
                // you'll need to add this field to your backend response
                // For now, using equal distribution as fallback
                const bookingsCount = venue.number_of_bookings ||
                    venue.total_bookings ||
                    venue.bookings_count ||
                    venue.bookings ||
                    100; // Fallback value for demo

                // Extract sports from venue_play_type
                const sports = venue.venue_play_type?.map(sport =>
                    sport.translations?.en?.name || sport.translations?.ar?.name
                ).filter(Boolean).join(', ') || '';

                return {
                    id: venue.id,
                    name: venueName,
                    bookings: bookingsCount,
                    city: venue.city || 'N/A',
                    color: COLORS[index % COLORS.length],
                    venue_type: venue.venue_type,
                    min_price: venue.min_price,
                    rate: venue.rate,
                    sports: sports
                };
            });

            setVenuesData(processedData);
        } catch (error) {
            console.error('Error fetching venues analytics:', error);
            setVenuesData([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter venues by selected city
    const filteredVenues = selectedCity === 'All Cities'
        ? venuesData
        : venuesData.filter(venue => venue.city === selectedCity);

    // Calculate percentages based on bookings
    const calculatePercentages = () => {
        if (filteredVenues.length === 0) return [];

        const totalBookings = filteredVenues.reduce((sum, venue) => sum + venue.bookings, 0);

        return filteredVenues.map((venue) => {
            const percentage = totalBookings > 0
                ? Math.round((venue.bookings / totalBookings) * 100)
                : 0;

            return {
                ...venue,
                percentage,
                displayValue: venue.bookings
            };
        });
    };

    const venuesWithPercentages = calculatePercentages();

    // Calculate stroke dash array for donut chart
    const calculateStrokeDasharray = (percentage) => {
        const circumference = 2 * Math.PI * 45;
        const dashLength = (percentage / 100) * circumference;
        return `${dashLength} ${circumference}`;
    };

    let cumulativePercentage = 0;
    const chartSegments = venuesWithPercentages.map((venue) => {
        const rotation = (cumulativePercentage / 100) * 360 - 90;
        cumulativePercentage += venue.percentage;

        return {
            ...venue,
            rotation,
            dashArray: calculateStrokeDasharray(venue.percentage)
        };
    });

    // Get years for dropdown (current year and previous 5 years)
    const getYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = 0; i < 6; i++) {
            years.push(currentYear - i);
        }
        return years;
    };

    const handleCityChange = (city) => {
        setSelectedCity(city);
        setIsDropdownOpen(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header with Year Selector and City Filter */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="xl:text-lg font-bold text-gray-800">Popular Venues</h2>

                <div className="flex items-center gap-4">
                    {/* Year Selector */}
                    <div className="flex items-center gap-2">
                        {/*<span className="text-sm text-gray-600">Year:</span>*/}
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {getYearOptions().map((yearOption) => (
                                <option key={yearOption} value={yearOption}>
                                   year {yearOption}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                </div>
            )}

            {/* No Data State */}
            {!loading && venuesWithPercentages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-400">No venue data available</p>
                    <p className="text-sm text-gray-400 mt-2">
                        {selectedCity === 'All Cities'
                            ? `No data for ${year}`
                            : `No venues found in ${selectedCity} for ${year}`
                        }
                    </p>
                </div>
            )}

            {/* Chart and Legend */}
            {!loading && venuesWithPercentages.length > 0 && (
                <div className="flex flex-col items-center">
                    {/* Donut Chart with Center Content */}
                    <div className="relative w-44 h-44 mb-8 xl:w-56 xl:h-56">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#F1F5F9"
                                strokeWidth="10"
                            />

                            {/* Chart segments */}
                            {chartSegments.map((segment, index) => (
                                <circle
                                    key={segment.id || index}
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke={segment.color}
                                    strokeWidth="10"
                                    strokeDasharray={segment.dashArray}
                                    strokeDashoffset="0"
                                    transform={`rotate(${segment.rotation} 50 50)`}
                                    style={{
                                        transition: 'all 0.3s ease-in-out'
                                    }}
                                />
                            ))}
                        </svg>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-sm">
                                {centerContent.type === 'image' && centerContent.imageUrl ? (
                                    <div className="w-20 h-20 rounded-full">
                                        <img
                                            src={stadiumIcon}
                                            alt="Venue Chart Center"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="px-2">
                                        <div className="text-lg font-bold text-gray-800 leading-tight">
                                            {venuesWithPercentages.length}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Venues
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Legend with Venue Details */}
                    <div className="w-full space-y-4">
                        {venuesWithPercentages.map((venue, index) => (
                            <div key={venue.id || index} className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-4 h-4 rounded-sm flex-shrink-0 mt-1"
                                        style={{ backgroundColor: venue.color }}
                                    ></div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">
                                            {venue.name}
                                        </div>
                                        {/*<div className="text-xs text-gray-500">*/}
                                        {/*    {venue.sports}*/}
                                        {/*</div>*/}
                                        {/*<div className="flex items-center gap-2 mt-1">*/}
                                        {/*    <div className="flex items-center text-amber-500 text-xs">*/}
                                        {/*        {'★'.repeat(Math.floor(venue.rate || 0))}*/}
                                        {/*        {'☆'.repeat(5 - Math.floor(venue.rate || 0))}*/}
                                        {/*    </div>*/}
                                        {/*    <span className="text-xs text-gray-500">*/}
                                        {/*        {venue.venue_type === 'indoor' ? '🏠 Indoor' : '🌳 Outdoor'}*/}
                                        {/*    </span>*/}
                                        {/*</div>*/}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold" style={{ color: venue.color }}>
                                        {venue.percentage}%
                                    </div>
                                    {/*<div className="text-xs text-gray-500">*/}
                                    {/*    {venue.bookings} bookings*/}
                                    {/*</div>*/}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PopularVenues;