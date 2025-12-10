import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPopularVenues } from '../../features/dashboard/analyticsSlice';
import stadiumIcon from '../../assets/stadiumIcon.svg'

const CITIES = [
    { value: 'Abu Dhabi', label: 'Abu Dhabi' },
    { value: 'Dubai', label: 'Dubai' },
    { value: 'Sharjah', label: 'Sharjah' },
    { value: 'Ajman', label: 'Ajman' },
    { value: 'Ras Al Khaimah', label: 'Ras Al Khaimah' },
    { value: 'Fujairah', label: 'Fujairah' },
    { value: 'Umm Al Quwain', label: 'Umm Al Quwain' }
];

const COLORS = [
    '#22D3EE', // cyan
    '#475569',
    '#06B6D4', // darker cyan
    '#777777', // light slate
    '#4ADE80'  // green
];

const PopularVenues = () => {
    const dispatch = useDispatch();
    const [selectedCity, setSelectedCity] = useState('Abu Dhabi');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [centerContent, setCenterContent] = useState({
        type: 'image',
        imageUrl: stadiumIcon
    });

    const { popularVenues, loading } = useSelector((state) => ({
        popularVenues: state.analytics.popularVenues?.results || [],
        loading: state.analytics.loading.popularVenues
    }));

    useEffect(() => {
        if (selectedCity) {
            dispatch(fetchPopularVenues({
                city: selectedCity,
                ordering: '-num_of_booking',
                is_active: true,
                page_limit: 5
            }));
        }
    }, [selectedCity, dispatch]);

    const handleCityChange = (city) => {
        setSelectedCity(city);
        setIsDropdownOpen(false);
    };

    // Function to handle sending chart image
    const handleSendImage = () => {
        alert(`Sending popular venues chart for ${selectedCity} to popular venues...`);
    };

    const handleSetImageCenter = (imageUrl) => {
        setCenterContent({
            type: 'image',
            value: 'Chart',
            imageUrl: imageUrl
        });
    };

    const handleSetTextCenter = () => {
        setCenterContent({
            type: 'text',
            value: `${sortedVenues.length} Venues`,
            imageUrl: null
        });
    };

    // Calculate data for the chart based on actual booking numbers
    const venuesWithData = popularVenues?.map((venue, index) => {
        return {
            id: venue.id,
            name: venue.translations?.name || 'Unknown Venues',
            min_price: venue.min_price,
            rate: venue.rate,
            venue_type: venue.venue_type,
            city: venue.city,
            color: COLORS[index % COLORS.length],
            bookingCount: venue.num_of_booking || 0,
            sports: venue.venue_play_type?.map(sport => sport.translations?.name).join(', ') || ''
        };
    }) || [];

    // Calculate percentages based on booking counts
    const totalBookings = venuesWithData.reduce((sum, venue) => sum + venue.bookingCount, 0);

    // Normalize percentages based on booking counts
    const normalizedVenues = venuesWithData.map(venue => {
        // If there are no bookings for any venue, distribute equally
        let percentage;
        if (totalBookings === 0) {
            percentage = 100 / venuesWithData.length;
        } else {
            percentage = (venue.bookingCount / totalBookings) * 100;
        }

        return {
            ...venue,
            percentage: Math.round(percentage),
            value: Math.round(percentage)
        };
    });

    // Adjust percentages to ensure they sum to 100%
    const adjustPercentagesTo100 = (venues) => {
        const adjustedVenues = [...venues];
        const total = adjustedVenues.reduce((sum, venue) => sum + venue.percentage, 0);
        const difference = 100 - total;

        if (difference !== 0 && adjustedVenues.length > 0) {
            // Add the difference to the venue with the highest booking count
            const highestBookingVenue = adjustedVenues.reduce((prev, current) =>
                (prev.bookingCount > current.bookingCount) ? prev : current
            );
            highestBookingVenue.percentage += difference;
            highestBookingVenue.value = highestBookingVenue.percentage;
        }

        return adjustedVenues;
    };

    const adjustedVenues = adjustPercentagesTo100(normalizedVenues);

    // Sort venues by percentage in descending order (highest to lowest)
    const sortedVenues = [...adjustedVenues].sort((a, b) => b.percentage - a.percentage);

    // Calculate stroke dash array for donut chart
    const calculateStrokeDasharray = (percentage) => {
        const circumference = 2 * Math.PI * 45;
        const dashLength = (percentage / 100) * circumference;
        return `${dashLength} ${circumference}`;
    };

    // Recalculate chart segments based on sorted order
    let cumulativePercentage = 0;
    const chartSegments = sortedVenues.map((venue, index) => {
        const rotation = (cumulativePercentage / 100) * 360 - 90;
        cumulativePercentage += venue.percentage;

        return {
            ...venue,
            rotation,
            dashArray: calculateStrokeDasharray(venue.percentage)
        };
    });

    // Calculate total bookings for display
    const totalVenueBookings = sortedVenues.reduce((sum, venue) => sum + venue.bookingCount, 0);

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="xl:text-lg font-bold text-gray-800">Popular Venues</h2>

                {/* Control buttons for center content */}
                <div className="flex items-center gap-2">
                    {/* City Dropdown */}
                    <div className="relative ml-2">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center whitespace-nowrap text-sm gap-2 px-2 py-2 text-secondary-600 focus:cursor bg-gradient-to-br from-[#84FAA4] via-primary-500 to-[#2ACEF2] rounded-lg transition-colors"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            <span className="text-sm">{selectedCity}</span>
                            <svg
                                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                {CITIES.map((city) => (
                                    <button
                                        key={city.value}
                                        onClick={() => handleCityChange(city.value)}
                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                                            selectedCity === city.value ? 'bg-cyan-50 text-cyan-600' : 'text-gray-700'
                                        }`}
                                    >
                                        {city.label}
                                    </button>
                                ))}
                            </div>
                        )}
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
            {!loading && sortedVenues.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p>No venues found in {selectedCity}</p>
                </div>
            )}

            {/* Chart and Legend */}
            {!loading && sortedVenues.length > 0 && (
                <div className="flex flex-col items-center">
                    {/* Donut Chart with Center Content */}
                    <div id="venue-donut-chart" className="relative w-44 h-44 mb-8 xl:w-56 xl:h-56">
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

                            {/* Chart segments - already sorted by percentage */}
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

                        {/* Center Content - Text or Image */}
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
                                            {totalVenueBookings} Bookings
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            in {selectedCity}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Legend with Venues Details - Arranged from top (highest) to bottom (lowest) */}
                    <div className="w-full space-y-4">
                        {sortedVenues.map((venue, index) => (
                            <div key={venue.id || index} className="flex items-start justify-between">
                                <div className="flex items-start it gap-2">
                                    {/* Color indicator and rank number */}
                                    <div className="flex flex-col items-center">
                                        {/*<div className="text-xs font-semibold text-gray-500 mb-1">*/}
                                        {/*    #{index + 1}*/}
                                        {/*</div>*/}
                                        <div
                                            className="w-4 h-4 mt-1 rounded-sm flex-shrink-0"
                                            style={{ backgroundColor: venue.color }}
                                        ></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm   font-medium text-gray-800">
                                            {venue.name}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-sm items-center  text-amber-500">
                                                {'★'.repeat(Math.floor(venue.rate || 0))}
                                                {'☆'.repeat(5 - Math.floor(venue.rate || 0))}
                                            </div>
                                            <span className="text-[10px] text-gray-500">
                                                {venue.venue_type === 'indoor' ? '🏠 Indoor' : '🌳 Outdoor'}
                                            </span>
                                        </div>
                                        {/*<div className="text-xs text-gray-500 mt-1">*/}
                                        {/*    {venue.bookingCount} {venue.bookingCount === 1 ? 'booking' : 'bookings'}*/}
                                        {/*</div>*/}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold" style={{ color: venue.color }}>
                                        {venue.percentage}%
                                    </div>
                                    {/*<div className="text-xs text-gray-500 mt-1">*/}
                                    {/*    of total*/}
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