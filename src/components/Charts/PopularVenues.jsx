import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next'; // Import translation hook
import { fetchPopularVenues } from '../../features/dashboard/analyticsSlice';
import stadiumIcon from '../../assets/stadiumIcon.svg';
import { daysOfWeekService } from "../../services/daysOfWeek/daysOfWeekService.js";
import { MapPin, ChevronDown } from 'lucide-react'; // Import icons

const COLORS = [
    '#22D3EE', // cyan
    '#475569',
    '#06B6D4', // darker cyan
    '#777777', // light slate
    '#4ADE80'  // green
];

const PopularVenues = () => {
    const { t } = useTranslation('popularVenues'); // Initialize translation
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const CITIES = useMemo(() => [
        { value: 'Abu Dhabi', label: t('cities.Abu Dhabi') },
        { value: 'Dubai', label: t('cities.Dubai') },
        { value: 'Sharjah', label: t('cities.Sharjah') },
        { value: 'Ajman', label: t('cities.Ajman') },
        { value: 'Ras Al Khaimah', label: t('cities.Ras Al Khaimah') },
        { value: 'Fujairah', label: t('cities.Fujairah') },
        { value: 'Umm Al Quwain', label: t('cities.Umm Al Quwain') }
    ], [t]);

    const [selectedCity, setSelectedCity] = useState('Abu Dhabi');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [centerContent, setCenterContent] = useState({
        type: 'image',
        imageUrl: stadiumIcon
    });

    const [daysList, setDaysList] = useState([]);

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

    // Calculate data for the chart
    const venuesWithData = useMemo(() => {
        return popularVenues?.map((venue, index) => ({
            id: venue.id,
            name: venue.translations?.name || t('venue.unknown'),
            min_price: venue.min_price,
            rate: venue.rate,
            venue_type: venue.venue_type,
            city: venue.city,
            color: COLORS[index % COLORS.length],
            bookingCount: venue.num_of_booking || 0,
            sports: venue.venue_play_type?.map(sport => sport.translations?.name).join(', ') || ''
        })) || [];
    }, [popularVenues, t]);

    // Calculate percentages
    const totalBookings = venuesWithData.reduce((sum, venue) => sum + venue.bookingCount, 0);

    const normalizedVenues = venuesWithData.map(venue => {
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

    const adjustPercentagesTo100 = (venues) => {
        const adjustedVenues = [...venues];
        const total = adjustedVenues.reduce((sum, venue) => sum + venue.percentage, 0);
        const difference = 100 - total;

        if (difference !== 0 && adjustedVenues.length > 0) {
            const highestBookingVenue = adjustedVenues.reduce((prev, current) =>
                (prev.bookingCount > current.bookingCount) ? prev : current
            );
            highestBookingVenue.percentage += difference;
            highestBookingVenue.value = highestBookingVenue.percentage;
        }
        return adjustedVenues;
    };

    const adjustedVenues = adjustPercentagesTo100(normalizedVenues);
    const sortedVenues = [...adjustedVenues].sort((a, b) => b.percentage - a.percentage);

    const calculateStrokeDasharray = (percentage) => {
        const circumference = 2 * Math.PI * 45;
        const dashLength = (percentage / 100) * circumference;
        return `${dashLength} ${circumference}`;
    };

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

    const totalVenueBookings = sortedVenues.reduce((sum, venue) => sum + venue.bookingCount, 0);

    const fetchFilterOptions = async () => {
        try {
            const daysRes = await daysOfWeekService.getAll({ all_languages: true });
            if (daysRes && daysRes.results) {
                setDaysList(daysRes.results);
            }
        } catch (error) {
            console.error("Failed to fetch filter options:", error);
        }
    };

    useEffect(() => {
        fetchFilterOptions()
    }, []);

    // Helper to get translated city label
    const getCityLabel = (cityValue) => {
        const city = CITIES.find(c => c.value === cityValue);
        return city ? city.label : cityValue;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="xl:text-lg font-bold text-gray-800">{t('title')}</h2>

                {/* Control buttons for center content */}
                <div className="flex items-center gap-2">
                    {/* City Dropdown */}
                    <div className="relative ml-2">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center whitespace-nowrap text-sm gap-2 px-2 py-2 text-secondary-600 focus:cursor bg-gradient-to-br from-[#84FAA4] via-primary-500 to-[#2ACEF2] rounded-lg transition-colors"
                        >
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{getCityLabel(selectedCity)}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                {CITIES.map((city) => (
                                    <button
                                        key={city.value}
                                        onClick={() => handleCityChange(city.value)}
                                        className={`w-full text-start px-4 py-2 hover:bg-gray-50 transition-colors ${
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
                    <p>{t('noData', { city: getCityLabel(selectedCity) })}</p>
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
                                            {t('chart.bookings', { count: totalVenueBookings })}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {t('chart.inCity', { city: getCityLabel(selectedCity) })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Legend with Venues Details */}
                    <div className="w-full space-y-4">
                        {sortedVenues.map((venue, index) => (
                            <div key={venue.id || index} className="flex items-start justify-between">
                                <div
                                    onClick={() => navigate('/venues/venue-details', {
                                        state: {
                                            venueId: venue.id,
                                            daysList: daysList
                                        }
                                    })}
                                    className="cursor-pointer flex items-start gap-2"
                                >
                                    {/* Color indicator */}
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="w-4 h-4 mt-1 rounded-sm flex-shrink-0"
                                            style={{ backgroundColor: venue.color }}
                                        ></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-800">
                                            {venue.name}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-sm items-center text-amber-500">
                                                {'★'.repeat(Math.floor(venue.rate || 0))}
                                                {'☆'.repeat(5 - Math.floor(venue.rate || 0))}
                                            </div>
                                            <span className="text-[10px] text-gray-500">
                                                {venue.venue_type === 'indoor' ? t('venue.indoor') : t('venue.outdoor')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold" style={{ color: venue.color }}>
                                        {venue.percentage}%
                                    </div>
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