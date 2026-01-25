import React, { useEffect, useState } from 'react';
import { FaUsers, FaCalendar, FaBook, FaChartBar } from 'react-icons/fa';
import { TrendingUp, ChevronDown, Calendar } from 'lucide-react';
import useAnalytics from '../../hooks/useAnalytics.js';
import { useNavigate } from "react-router-dom";
import { getImageUrl, extractFilename } from "../../utils/imageUtils.js";
import { useTranslation } from 'react-i18next'; // Add this import

const TopTeamsChart = ({
                           title = "topTeams.title",
                           subtitle = "topTeams.subtitle",
                           height = 400,
                           showPeriodSelector = true,
                           className = "",
                           limit = 5
                       }) => {
    const { t } = useTranslation('topTeams'); // Initialize translation hook
    const { topTeams, isTopTeamsLoading, error, getTopTeams } = useAnalytics();
    const [period, setPeriod] = useState('this_week');
    const navigate = useNavigate();


    useEffect(() => {
        getTopTeams({ period, limit });
    }, [period, limit, getTopTeams]);



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
                    <h2 className="xl:text-xl font-bold text-gray-900 mb-1">{t(title)}</h2>
                    <p className="text-sm text-gray-500">{t(subtitle)}</p>
                </div>


            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 pb-3 mb-2 border-b border-gray-200">
                <div className="col-span-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('topTeams.tableHeaders.teamName')}
                </div>
                <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    {t('topTeams.tableHeaders.players')}
                </div>
                <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    {t('topTeams.tableHeaders.matchesPlayed')}
                </div>
                <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    {t('topTeams.tableHeaders.points')}
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
                                <div
                                    onClick={() => navigate(`/teams/team-profile/${team.id}`)}
                                    className="flex cursor-pointer items-center justify-center w-8 h-8 rounded-full bg-gray-100 mr-3 flex-shrink-0"
                                    title={t('topTeams.viewProfile')}
                                >
                                    {team.logo ? (
                                        <img
                                            src={getImageUrl(team.logo)}
                                            alt={team.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML =
                                                    '<FaUsers className="w-4 h-4 text-gray-400" />';
                                            }}
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
                                            src={getImageUrl(team.team_leader.image)}
                                            alt={team.team_leader.name || t('topTeams.teamLeader')}
                                            className="w-7 h-7 rounded-full border-2 border-white object-cover"
                                            title={team.team_leader.name || t('topTeams.teamLeader')}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML =
                                                    `<div class="w-7 h-7 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                            <span class="text-xs text-gray-600">
                              ${(team.team_leader?.name?.charAt(0) || '?')}
                            </span>
                          </div>`;
                                            }}
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

                            {/* Points */}
                            <div className="col-span-2 flex justify-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-cyan-800">
                  {team.num_of_points}
                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <FaChartBar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">{t('topTeams.noData')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopTeamsChart;