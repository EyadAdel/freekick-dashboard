import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import analyticsService from '../../services/analyticsService';
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUtils.js";

function TeamLeaderboardActivity() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPoints, setTotalPoints] = useState(0);
    const navigate = useNavigate();
    const { t } = useTranslation(['teamActivity', 'common']);

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        try {
            setLoading(true);
            const response = await analyticsService.getTopTeams();
            const teamsData = response.results || [];

            // Calculate total points from all teams
            const total = teamsData.reduce((sum, team) => sum + (team.num_of_points || 0), 0);

            // Calculate percentage for each team
            const teamsWithPercentage = teamsData.map(team => ({
                ...team,
                percentage: total > 0 ? ((team.num_of_points || 0) / total * 100).toFixed(1) : 0
            }));

            // Sort by points (highest first) and take top 5
            const topTeams = teamsWithPercentage
                .sort((a, b) => (b.num_of_points || 0) - (a.num_of_points || 0))
                .slice(0, 6);

            setTeams(topTeams);
            setTotalPoints(total);
        } catch (err) {
            console.error('Error fetching team data:', err);
            // Fallback data matching your image
            setTeams([
                {
                    id: 1,
                    name: 'Team 1',
                    num_of_points: 90,
                    logo: '/team-logos/team1.png'
                },
                {
                    id: 2,
                    name: 'Team 2',
                    num_of_points: 25,
                    logo: '/team-logos/team2.png'
                },
                {
                    id: 3,
                    name: 'Team 3',
                    num_of_points: 80,
                    logo: '/team-logos/team3.png'
                },
                {
                    id: 4,
                    name: 'Team 4',
                    num_of_points: 8,
                    logo: '/team-logos/team4.png'
                },
                {
                    id: 5,
                    name: 'Team 5',
                    num_of_points: 2,
                    logo: '/team-logos/team5.png'
                }
            ].map((team, index, arr) => {
                const total = arr.reduce((sum, t) => sum + t.num_of_points, 0);
                return {
                    ...team,
                    percentage: total > 0 ? (team.num_of_points / total * 100).toFixed(1) : 0
                };
            }));
            setTotalPoints(205);
        } finally {
            setLoading(false);
        }
    };

    // Function to get color based on percentage
    const getColorClass = (percentage) => {
        if (percentage >= 40) return 'bg-blue-600';
        if (percentage >= 25) return 'bg-green-600';
        if (percentage >= 15) return 'bg-yellow-600';
        if (percentage >= 5) return 'bg-orange-600';
        return 'bg-red-600';
    };

    // Function to get team initials from team name
    const getTeamInitials = (teamName) => {
        if (!teamName) return t('teamActivity:fallbackInitials');
        return teamName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Function to handle image click navigation
    const handleImageClick = (team) => {
        navigate('/teams/team-profile', { state: { team } });
    };

    // Function to handle logo error
    const handleLogoError = (e) => {
        e.target.style.display = 'none';
        const parent = e.target.parentElement;
        if (parent) {
            const fallbackElement = parent.querySelector('.logo-fallback');
            if (fallbackElement) {
                fallbackElement.style.display = 'flex';
            }
        }
    };

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-lg shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {t('teamActivity:title')}
                    </h3>
                </div>

                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    {t('teamActivity:title')}
                </h3>
                <div className="text-right">
                    <div className="text-xs text-gray-400">
                        {totalPoints} {t('teamActivity:totalPoints')}
                    </div>
                </div>
            </div>

            {/* Teams List */}
            <div className="px-8 grid lg:grid-cols-2 gap-8 items-center">
                {teams.map((team, index) => {
                    // Get team logo URL using the utility function
                    const logoUrl = getImageUrl(team.logo);

                    return (
                        <div key={team.id || index} className="space-y-2">
                            {/* Team Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 items-center space-x-3">
                                    {/* Team Logo */}
                                    <div className="relative">
                                        {logoUrl ? (
                                            <img
                                                onClick={() => handleImageClick(team)}
                                                src={logoUrl}
                                                alt={`${team.name} logo`}
                                                className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                                                onError={handleLogoError}
                                            />
                                        ) : null}

                                        {/* Fallback logo/initials */}
                                        <div
                                            className={`logo-fallback font-bold w-10 h-10 rounded-lg flex items-center justify-center border border-gray-200 ${logoUrl ? 'hidden' : 'flex'}`}
                                            style={{
                                                backgroundColor: index % 2 === 0 ? '#3B82F6' : '#10B981',
                                            }}
                                        >
                                            <span className="text-xs font-semibold text-white">
                                                {getTeamInitials(team.name)}
                                            </span>
                                        </div>

                                        {/* Rank badge */}
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                                            <span className="text-[10px] font-bold text-gray-700">
                                                {index + 1}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Team Name and Leader */}
                                    <div>
                                        <div className="font-medium text-gray-900 text-sm">
                                            {team.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            <span className="flex items-center space-x-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                </svg>
                                                <span>
                                                    {t('teamActivity:leader')}: {team.team_leader?.name || t('teamActivity:noLeader')}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Points and Percentage */}
                                <div className="text-right">
                                    <div className="font-semibold text-gray-900 text-sm">
                                        {team.num_of_points || 0} {t('teamActivity:points')}
                                    </div>
                                    <div className="text-xs font-bold text-gray-700">
                                        {team.percentage} {t('teamActivity:percentageOfTotal')}
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className={`h-2 font-bold rounded-full ${getColorClass(team.percentage)}`}
                                    style={{ width: `${Math.min(team.percentage, 100)}%` }}
                                ></div>
                            </div>

                            {/* Additional Stats */}
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        <span>
                                            {team.number_of_members || 0} {t('teamActivity:members')}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        <span>
                                            {team.number_of_booking || 0} {t('teamActivity:bookings')}
                                        </span>
                                    </div>
                                </div>

                                {/* Leader name can be shown here if you still want it */}
                                {team.team_leader?.name && (
                                    <div className="text-xs text-gray-500 truncate max-w-[100px]">
                                        {team.team_leader.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TeamLeaderboardActivity;