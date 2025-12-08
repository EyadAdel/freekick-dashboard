// pages/teams/TeamPointsTab.jsx
import React, { useState, useEffect } from 'react';
import MainTable from '../../components/MainTable';
import { teamService } from '../../services/Teams/TeamService.js';
import { Plus } from 'lucide-react';
import Swal from 'sweetalert2';

const TeamPointsTab = ({ teamId }) => {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPointData, setNewPointData] = useState({
        points: '',
        reason: '',
        kind: 'addition',
        is_active: true
    });
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

    const itemsPerPage = 10;

    // Fetch points data
    const fetchPoints = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                page_limit: itemsPerPage,
                search: searchTerm,
                team_id: teamId,
                ordering: sortConfig.direction === 'desc' ? `-${sortConfig.key}` : sortConfig.key,
                ...filters
            };

            const response = await teamService.getTeamPoints(params);
            setPoints(response.results || []);
            setTotalItems(response.count || 0);
        } catch (error) {
            console.error('Error fetching points:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load team points',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, [currentPage, searchTerm, filters, sortConfig, teamId]);

    // Handle create point
    const handleCreatePoint = async () => {
        // Validation
        if (!newPointData.points || !newPointData.reason) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please fill in all required fields',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }

        // Check if teamId exists
        if (!teamId) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Team ID is missing',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }
        console.log(teamId,'kkk')

        try {
            // Send team in the payload (based on API schema)
            if(teamId){
                const payload = {
                    team: parseInt(teamId),
                    points: parseInt(newPointData.points),
                    reason: newPointData.reason,
                    kind: newPointData.kind,
                    is_active: newPointData.is_active
                };

                console.log('Creating point with payload:', payload);
                await teamService.createTeamPoints(payload);

                Swal.fire({
                    icon: 'success',
                    title: 'Created!',
                    text: 'Points created successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });

                setShowCreateModal(false);
                setNewPointData({
                    points: '',
                    reason: '',
                    kind: 'addition',
                    is_active: true
                });
            }

            fetchPoints();
        } catch (error) {
            console.error('Error creating points:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to create points',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    };

    // Handle input change for new point
    const handleNewPointChange = (field, value) => {
        setNewPointData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Define table columns
    const columns = [
        {
            header: 'Reason',
            accessor: 'reason',
            align: 'left',
            render: (row) => row.reason || '-'
        },
        {
            header: 'Points',
            accessor: 'points',
            sortable: true,
            sortKey: 'points',
            align: 'center',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full font-semibold ${
                    row.points >= 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {row.points}
                </span>
            )
        },
        {
            header: 'Type',
            accessor: 'kind',
            align: 'center',
            render: (row) => (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium capitalize">
                    {row.kind || 'N/A'}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: 'is_active',
            align: 'center',
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        }
    ];

    // Define filters
    const tableFilters = [
        {
            type: 'number',
            label: 'Min Points',
            key: 'points__gte',
            step: '1'
        },
        {
            type: 'number',
            label: 'Max Points',
            key: 'points__lte',
            step: '1'
        }
    ];

    return (
        <div className="p-6 bg-white rounded-lg border border-gray-100">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="xl:text-2xl font-bold text-gray-800">Team Points</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex text-xs lg:text-base items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    Create New Point
                </button>
            </div>

            {loading && points.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <MainTable
                    columns={columns}
                    data={points}
                    searchPlaceholder="Search by reason..."
                    filters={tableFilters}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onSearch={setSearchTerm}
                    onFilterChange={setFilters}
                    onPageChange={setCurrentPage}
                    sortConfig={sortConfig}
                    onSort={setSortConfig}
                />
            )}

            {/* Create Point Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Point</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newPointData.reason}
                                    onChange={(e) => handleNewPointChange('reason', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Enter reason"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Points <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={newPointData.points}
                                    onChange={(e) => handleNewPointChange('points', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Enter points"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newPointData.kind}
                                    onChange={(e) => handleNewPointChange('kind', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="addition">Addition</option>
                                    <option value="deduction">Deduction</option>
                                    <option value="bonus">Bonus</option>
                                    <option value="penalty">Penalty</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={newPointData.is_active}
                                    onChange={(e) => handleNewPointChange('is_active', e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewPointData({
                                        points: '',
                                        reason: '',
                                        kind: 'addition',
                                        is_active: true
                                    });
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePoint}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                            >
                                Create Point
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPointsTab;