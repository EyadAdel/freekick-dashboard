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

            // Extract venues from response based on your API structure
            const venuesList = response || [];

            const processedData = venuesList.slice(0, 5).map((venue, index) => {
                // Extract name from translations (prefer English, fallback to Arabic)
                const venueName = venue.translations?.en?.name ||
                    venue.translations?.ar?.name ||
                    venue.name ||
                    'Unknown Venues';

                // Get booking count from API response - using num_of_booking field
                const bookingsCount = venue.num_of_booking || 0;

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
                    sports: sports,
                    address: venue.address,
                    phone_number: venue.phone_number,
                    images: venue.images,
                    owner_info: venue.owner_info
                };
            }).filter(venue => venue.bookings > 0); // Filter out venues with 0 bookings

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

        // Sort by bookings in descending order
        const sortedVenues = [...filteredVenues].sort((a, b) => b.bookings - a.bookings);

        const totalBookings = sortedVenues.reduce((sum, venue) => sum + venue.bookings, 0);

        // If no bookings, return equal percentages
        if (totalBookings === 0) {
            const equalPercentage = Math.round(100 / sortedVenues.length);
            return sortedVenues.map((venue, index) => ({
                ...venue,
                percentage: equalPercentage,
                displayValue: venue.bookings,
                rank: index + 1
            }));
        }

        // Calculate percentages with exact values
        const venuesWithExactPercentages = sortedVenues.map((venue) => {
            const exactPercentage = (venue.bookings / totalBookings) * 100;
            return {
                ...venue,
                exactPercentage,
                roundedPercentage: Math.round(exactPercentage),
                displayValue: venue.bookings,
                rank: 0 // Will be set after sorting
            };
        });

        // Sort by exact percentage in descending order for ranking
        venuesWithExactPercentages.sort((a, b) => b.exactPercentage - a.exactPercentage);

        // Assign ranks
        venuesWithExactPercentages.forEach((venue, index) => {
            venue.rank = index + 1;
        });

        // Adjust percentages to ensure they sum to 100%
        const adjustPercentages = (venues) => {
            const totalRounded = venues.reduce((sum, venue) => sum + venue.roundedPercentage, 0);
            const difference = 100 - totalRounded;

            if (difference !== 0) {
                // Sort by rounding error to adjust the most appropriate items
                const sortedByError = [...venues].sort((a, b) => {
                    const errorA = a.exactPercentage - a.roundedPercentage;
                    const errorB = b.exactPercentage - b.roundedPercentage;
                    return difference > 0 ? errorB - errorA : errorA - errorB;
                });

                // Adjust the items with the largest rounding errors
                for (let i = 0; i < Math.abs(difference); i++) {
                    if (i < sortedByError.length) {
                        sortedByError[i].roundedPercentage += difference > 0 ? 1 : -1;
                    }
                }
            }

            return venues.map(venue => ({
                ...venue,
                percentage: venue.roundedPercentage
            }));
        };

        return adjustPercentages(venuesWithExactPercentages);
    };

    const venuesWithPercentages = calculatePercentages();

    // Calculate stroke dash array for donut chart
    const calculateStrokeDasharray = (percentage) => {
        const circumference = 2 * Math.PI * 45;
        const dashLength = (percentage / 100) * circumference;
        return `${dashLength} ${circumference}`;
    };

    // Calculate donut chart segments
    const calculateChartSegments = () => {
        if (venuesWithPercentages.length === 0) return [];

        let cumulativePercentage = 0;
        return venuesWithPercentages.map((venue) => {
            const rotation = (cumulativePercentage / 100) * 360 - 90;
            cumulativePercentage += venue.percentage;

            return {
                ...venue,
                rotation,
                dashArray: calculateStrokeDasharray(venue.percentage)
            };
        });
    };

    const chartSegments = calculateChartSegments();

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

    // Calculate total bookings for display
    const totalBookings = venuesWithPercentages.reduce((sum, venue) => sum + venue.bookings, 0);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header with Year Selector and City Filter */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="xl:text-lg font-bold text-gray-800">Popular Venues</h2>

                <div className="flex items-center gap-4">
                    {/* City Filter Dropdown */}

                    {/* Year Selector */}
                    {/* Year Selector */}
                    <div className="relative flex items-center gap-2">
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="appearance-none flex items-center pl-3 pr-10 whitespace-nowrap text-sm gap-2 py-2 text-secondary-600 bg-gradient-to-br from-[#84FAA4] via-primary-500 to-[#2ACEF2] rounded-lg transition-colors cursor-pointer"
                        >
                            {getYearOptions().map((yearOption) => (
                                <option key={yearOption} value={yearOption}>
                                    Year {yearOption}
                                </option>
                            ))}
                        </select>
                        {/* Custom Arrow */}
                        <svg
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-secondary-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
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
                            <div className="text-center w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
                                {centerContent.type === 'image' && centerContent.imageUrl ? (
                                    <div className="w-20 h-20 rounded-full overflow-hidden">
                                        <img
                                            src={stadiumIcon}
                                            alt="Venue Chart Center"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="px-2">
                                        <div className="text-lg font-bold text-gray-800 leading-tight">
                                            {totalBookings}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Total Bookings
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Legend with Venues Details */}
                    <div className="w-full ">
                        {venuesWithPercentages.map((venue, index) => (
                            <div key={venue.id || index} className="flex items-start justify-between px-3 py-1 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                                <div className="flex items-start gap-2">
                                    {/* Rank badge */}
                                    {/*<div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">*/}
                                    {/*    <span className="text-sm font-semibold" style={{ color: venue.color }}>*/}
                                    {/*        #{venue.rank}*/}
                                    {/*    </span>*/}
                                    {/*</div>*/}

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                                style={{ backgroundColor: venue.color }}
                                            ></div>
                                            <div className="text-sm font-medium text-gray-800">
                                                {venue.name}
                                            </div>
                                        </div>
                                    {/*    <div className="flex items-center gap-3 mt-1">*/}
                                    {/*        <div className="text-xs text-gray-500">*/}
                                    {/*            {venue.bookings} bookings*/}
                                    {/*        </div>*/}
                                    {/*        <div className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">*/}
                                    {/*            {venue.city}*/}
                                    {/*        </div>*/}
                                    {/*        /!*<div className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">*!/*/}
                                    {/*        /!*    {venue.venue_type === 'indoor' ? '🏠 Indoor' : '🌳 Outdoor'}*!/*/}
                                    {/*        /!*</div>*!/*/}
                                    {/*    </div>*/}
                                    {/*    /!*{venue.sports && (*!/*/}
                                    {/*    /!*    <div className="text-xs text-gray-500 mt-1">*!/*/}
                                    {/*    /!*        Sports: {venue.sports}*!/*/}
                                    {/*    /!*    </div>*!/*/}
                                    {/*    /!*)}*!/*/}
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <div className="text-lg font-bold" style={{ color: venue.color }}>
                                        {venue.percentage}%
                                    </div>
                                    {/*<div className="text-xs text-gray-500 mt-1">*/}
                                    {/*    of total bookings*/}
                                    {/*</div>*/}
                                </div>
                            </div>
                        ))}
                    </div>

                {/*    /!* Stats Summary *!/*/}
                {/*    <div className="mt-6 pt-4 border-t border-gray-200 w-full">*/}
                {/*        <div className="grid grid-cols-2 gap-4 text-center">*/}
                {/*            <div className="p-3 bg-gray-50 rounded-lg">*/}
                {/*                <div className="text-2xl font-bold text-gray-800">{venuesWithPercentages.length}</div>*/}
                {/*                <div className="text-xs text-gray-500">Total Venues</div>*/}
                {/*            </div>*/}
                {/*            <div className="p-3 bg-gray-50 rounded-lg">*/}
                {/*                <div className="text-2xl font-bold text-gray-800">{totalBookings}</div>*/}
                {/*                <div className="text-xs text-gray-500">Total Bookings</div>*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                </div>
            )}
        </div>
    );
};

export default PopularVenues;