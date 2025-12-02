import React, { useEffect, useState } from 'react';
import { FaUsers, FaCalendar, FaBook, FaChartBar } from 'react-icons/fa';
import {TrendingUp, ChevronDown, Calendar} from 'lucide-react';
import useAnalytics from '../../hooks/useAnalytics.js';

const TopTeamsChart = ({
                           title = "Top 5 Teams",
                           subtitle = "Here are the venues that were booked the most",
                           height = 400,
                           showPeriodSelector = true,
                           className = "",
                           limit = 5
                       }) => {
    const { topTeams, isTopTeamsLoading, error, getTopTeams } = useAnalytics();
    const [period, setPeriod] = useState('this_week');

    const periodOptions = [
        { value: 'this_week', label: 'This Week' },
        { value: 'last_week', label: 'Last Week' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
    ];

    useEffect(() => {
        getTopTeams({ period, limit });
    }, [period, limit, getTopTeams]);

    const handlePeriodChange = (e) => {
        setPeriod(e.target.value);
    };

    // Generate mock rating (since it's not in API response)
    const generateRating = (team) => {
        const bookings = team.number_of_booking || 0;

        if (bookings === 0) return 0;
        if (bookings <= 5) return 3.5 + (bookings * 0.3);
        if (bookings <= 10) return 4.0 + (Math.min(bookings - 5, 5) * 0.2);
        return 4.5 + Math.min(bookings - 10, 5) * 0.1;
    };

    if (isTopTeamsLoading) {
        return (
            <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center py-3">
                                <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
                    {/*<p className="text-sm text-gray-500">{subtitle}</p>*/}
                </div>

                {showPeriodSelector && (
                    <div className="relative">
                        <select
                            value={period}
                            onChange={handlePeriodChange}
                            className="appearance-none text-secondary-600 bg-gradient-to-br from-[#84FAA4] cursor  via-primary-500 to-[#2ACEF2] py-2 px-2 border border-gray-300 rounded-lg px-4 pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                )}
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 pb-3 mb-2 border-b border-gray-200">
                <div className="col-span-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Name
                </div>
                <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    Players
                </div>
                <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    Matches played
                </div>
                <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    Rating
                </div>
            </div>

            {/* Teams List */}
            <div className="space-y-0">
                {topTeams?.results && topTeams.results.length > 0 ? (
                    topTeams?.results.slice(0, limit).map((team, index) => (
                        <div
                            key={team.id}
                            className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 transition-colors duration-150 items-center"
                        >
                            {/* Team Name */}
                            <div className="col-span-4 flex items-center">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 mr-3 flex-shrink-0">
                                    {team.logo ? (
                                        <img
                                            src={ 'https://img.freepik.com/premium-vector/sports-team-logo-design-with-shield-stars_339976-60246.jpg'}
                                            alt={team.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <FaUsers className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                                <span className="font-medium text-gray-700 text-sm truncate">
                                    {team.name}
                                </span>
                            </div>

                            {/* Players (Members with avatars) */}
                            <div className="col-span-3 flex justify-center">
                                <div className="flex items-center -space-x-2">
                                    {team.team_leader?.image ? (
                                        <img
                                            src={team.team_leader.image}
                                            alt={team.team_leader.name}
                                            className="w-7 h-7 rounded-full border-2 border-white object-cover"
                                        />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                                            <span className="text-xs text-gray-600">
                                                {team.team_leader?.name?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                    )}
                                    {team.number_of_members > 1 && (
                                        <>
                                            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200"></div>
                                            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200"></div>
                                        </>
                                    )}
                                    {team.number_of_members > 3 && (
                                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-800 flex items-center justify-center">
                                            <span className="text-xs text-white font-medium">
                                                +{team.number_of_members - 3}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Matches played */}
                            <div className="col-span-3 text-center">
                                <span className="text-sm font-medium text-gray-900">
                                    {team.number_of_booking || 0}
                                </span>
                            </div>

                            {/* Rating */}
                            <div className="col-span-2 flex justify-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                                    {generateRating(team)} stars
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <FaChartBar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No team data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopTeamsChart;