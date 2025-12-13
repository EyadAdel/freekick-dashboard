import React, {useEffect, useState} from 'react';
import {playerService} from "../../services/players/playerService.js";
import Swal from "sweetalert2";
import {Plus, Trophy} from "lucide-react";
import MainTable from "../../components/MainTable.jsx";
import { useTranslation } from 'react-i18next';

const PlayerPoints = ({ playerId }) => {
    const { t } = useTranslation('players');
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
                search: searchTerm,
                user__id: playerId,
                ...filters
            };

            const response = await playerService.getPlayerPoints(params);
            setPoints(response.results || []);
            setTotalItems(response.count || 0);
        } catch (error) {
            console.error(t('playerPoints.modal.error'), error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, [currentPage, searchTerm, filters, sortConfig, playerId]);

    // Handle create point
    const handleCreatePoint = async () => {
        // Validation
        if (!newPointData.points || !newPointData.reason) {
            Swal.fire({
                icon: 'warning',
                title: t('playerPoints.modal.validation.missingInfo'),
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }

        // Check if playerId exists
        if (!playerId) {
            Swal.fire({
                icon: 'error',
                title: t('playerPoints.modal.validation.missingPlayerId'),
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }

        try {
            if(playerId){
                const payload = {
                    user: parseInt(playerId),
                    points: parseInt(newPointData.points),
                    reason: newPointData.reason,
                    kind: newPointData.kind,
                    is_active: newPointData.is_active
                };

                await playerService.createPlayerPoints(payload);

                Swal.fire({
                    icon: 'success',
                    title: t('playerPoints.modal.success'),
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
            console.error(t('playerPoints.modal.error'), error);
            Swal.fire({
                icon: 'error',
                title: t('playerPoints.modal.error'),
                text: error.message || t('playerPoints.modal.error'),
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
            header: t('playerPoints.reason'),
            accessor: 'reason',
            align: 'left',
            render: (row) => row.reason || '-'
        },
        {
            header: t('playerPoints.points'),
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
            header: t('playerPoints.type'),
            accessor: 'kind',
            align: 'center',
            render: (row) => (
                <span className={` ${row.kind === 'subtraction'?'bg-red-50 text-red-800':'bg-primary-50 text-primary-600'} px-2 py-1  rounded-xl text-xs font-medium capitalize`}>
                    {t(`playerPoints.${row.kind}`) || t('playerPoints.modal.fields.type.options.addition')}
                </span>
            )
        },
        {
            header: t('playerPoints.status'),
            accessor: 'is_active',
            align: 'center',
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {row.is_active ? t('playerPoints.active') : t('playerPoints.inactive')}
                </span>
            )
        }
    ];

    // Define filters
    const tableFilters = [
        {
            type: 'number',
            label: t('playerPoints.filters.minPoints'),
            key: 'points__gte',
            step: '1'
        },
        {
            type: 'number',
            label: t('playerPoints.filters.maxPoints'),
            key: 'points__lte',
            step: '1'
        }
    ];

    return (
        <div className="p-6 bg-white rounded-lg border border-gray-100">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="xl:text-2xl font-bold text-gray-800">{t('playerPoints.title')}</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex text-xs lg:text-base items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    {t('playerPoints.createPointButton')}
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    <span className="mt-3">{t('playerPoints.loading')}</span>
                </div>
            ) :  points.length > 0 ?
                <MainTable
                    columns={columns}
                    data={points}
                    searchPlaceholder={t('playerPoints.searchPlaceholder')}
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
                :
                <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{t('playerPoints.emptyState.title')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('playerPoints.emptyState.description')}</p>
                </div>
            }

            {/* Create Point Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{t('playerPoints.modal.title')}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('playerPoints.modal.fields.reason.label')} <span className="text-red-500">{t('playerPoints.required')}</span>
                                </label>
                                <input
                                    type="text"
                                    value={newPointData.reason}
                                    onChange={(e) => handleNewPointChange('reason', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder={t('playerPoints.modal.fields.reason.placeholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('playerPoints.modal.fields.points.label')} <span className="text-red-500">{t('playerPoints.required')}</span>
                                </label>
                                <input
                                    type="number"
                                    value={newPointData.points}
                                    onChange={(e) => handleNewPointChange('points', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder={t('playerPoints.modal.fields.points.placeholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('playerPoints.modal.fields.type.label')} <span className="text-red-500">{t('playerPoints.required')}</span>
                                </label>
                                <select
                                    value={newPointData.kind}
                                    onChange={(e) => handleNewPointChange('kind', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="addition">{t('playerPoints.modal.fields.type.options.addition')}</option>
                                    <option value="subtraction">{t('playerPoints.modal.fields.type.options.subtraction')}</option>
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
                                    {t('playerPoints.modal.fields.isActive')}
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
                                {t('playerPoints.modal.cancel')}
                            </button>
                            <button
                                onClick={handleCreatePoint}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                            >
                                {t('playerPoints.modal.create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerPoints;