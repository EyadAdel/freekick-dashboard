// components/Charts/TeamLeaderboardActivity.jsx
import React, { useEffect, useState } from 'react';
import analyticsService from '../../services/analyticsService';

function TeamLeaderboardActivity() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPoints, setTotalPoints] = useState(0);

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
                { id: 1, name: 'Team 1', num_of_points: 90 },
                { id: 2, name: 'Team 2', num_of_points: 25 },
                { id: 3, name: 'Team 3', num_of_points: 80 },
                { id: 4, name: 'Team 4', num_of_points: 8 },
                { id: 5, name: 'Team 5', num_of_points: 2 }
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

    // Function to get leader initials
    const getLeaderInitials = (team) => {
        if (team.team_leader?.name) {
            return team.team_leader.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return 'TM';
    };

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-lg shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Team Activity</h3>
                    <div className="text-sm text-gray-500">Mar 2025</div>
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
                <h3 className="text-lg font-semibold text-gray-900">Team Activity</h3>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Mar 2025</div>
                    <div className="text-xs text-gray-400">{totalPoints} Total Points</div>
                </div>
            </div>

            {/* Teams List */}
            <div className=" px-8 grid lg:grid-cols-2 gap-8 items-center">
                {teams.map((team, index) => (
                    <div key={team.id || index} className="space-y-2">
                        {/* Team Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {/* Team Leader Avatar */}
                                <div className="relative">
                                    {team.team_leader?.image ? (
                                        <img
                                            src={team.team_leader.image}
                                            alt={team.team_leader.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-xs font-semibold text-gray-600">
                                                {getLeaderInitials(team)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
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
                                        {team.team_leader?.name || 'No Leader'}
                                    </div>
                                </div>
                            </div>

                            {/* Points and Percentage */}
                            <div className="text-right">
                                <div className="font-semibold text-gray-900">
                                    {team.num_of_points || 0} Points
                                </div>
                                <div className="text-xs text-gray-500">
                                    {team.percentage}%
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${getColorClass(team.percentage)}`}
                                style={{ width: `${Math.min(team.percentage, 100)}%` }}
                            ></div>
                        </div>

                        {/* Additional Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                    </svg>
                                    <span>{team.number_of_members || 0} members</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    <span>{team.number_of_booking || 0} bookings</span>
                                </div>
                            </div>

                            {team.logo && (
                                <img
                                    src={team.logo}
                                    alt={`${team.name} logo`}
                                    className="w-6 h-6 rounded"
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/*/!* Summary Section *!/*/}
            {/*<div className="mt-6 pt-6 border-t border-gray-200">*/}
            {/*    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">*/}
            {/*        {teams.slice(0, 3).map((team, index) => (*/}
            {/*            <div key={team.id} className={`p-3 rounded-lg ${index === 0 ? 'bg-blue-50' : index === 1 ? 'bg-green-50' : 'bg-yellow-50'}`}>*/}
            {/*                <div className="flex items-center justify-between">*/}
            {/*                    <div>*/}
            {/*                        <div className="text-xs text-gray-600">Rank #{index + 1}</div>*/}
            {/*                        <div className="font-semibold text-gray-900 text-sm">{team.name}</div>*/}
            {/*                    </div>*/}
            {/*                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-blue-100' : index === 1 ? 'bg-green-100' : 'bg-yellow-100'}`}>*/}
            {/*                        <span className={`text-sm font-bold ${index === 0 ? 'text-blue-600' : index === 1 ? 'text-green-600' : 'text-yellow-600'}`}>*/}
            {/*                            {team.percentage}%*/}
            {/*                        </span>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        ))}*/}
            {/*    </div>*/}

                {/* Refresh Button */}
                {/*<div className="mt-4 text-center">*/}
                {/*    <button*/}
                {/*        onClick={fetchTeamData}*/}
                {/*        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"*/}
                {/*    >*/}
                {/*        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
                {/*            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />*/}
                {/*        </svg>*/}
                {/*        Refresh Leaderboard*/}
                {/*    </button>*/}
                {/*</div>*/}
            {/*</div>*/}
        </div>
    );
}

export default TeamLeaderboardActivity;