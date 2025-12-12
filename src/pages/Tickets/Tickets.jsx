import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MainTable from '../../components/MainTable.jsx';
import { useTickets } from '../../hooks/useTickets.js';
import {Edit, Trash2, Eye, ExternalLink, Edit2} from 'lucide-react';
import { toast } from 'react-toastify';
import CustomPieChart from "../../components/Charts/PieChart.jsx";
import CustomLineChart from "../../components/Charts/LineChart.jsx";
import CreateTicket from "../../components/Tickets/CreateTicket.jsx";
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";
import {useDispatch} from "react-redux";
import {showConfirm} from "../../components/showConfirm.jsx";
import NotificationDebugger from "../../components/NotificationDebugger.jsx";

function Tickets() {
    const { t, i18n } = useTranslation(['ticketsPage', 'common']);
    const {
        tickets,
        pagination,
        loading,
        error,
        success,
        filters,
        handleSearch,
        handleFilterChange,
        handlePageChange,
        handleSort,
        removeTicket,
        recordClick,
        resetError,
        resetSuccess,
    } = useTickets();

    // View state management
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'create' or 'edit'
    const [editingTicket, setEditingTicket] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);
    // Handle toast notifications
    useEffect(() => {
        if (error) {
            toast.error(error);
            resetError();
        }
        if (success) {
            resetSuccess();
        }
    }, [error, success, resetError, resetSuccess]);

    // Table columns configuration
    const columns = [
        // {
        //     header: t('table.columns.id'),
        //     accessor: 'id',
        //     align: 'left',
        //     sortable: true,
        //     sortKey: 'id',
        // },
        {
            header: t('table.columns.name'),
            accessor: 'name',
            align: 'left',
            sortable: true,
            sortKey: 'name',
            render: (row) => (
                <div className="font-medium text-gray-900">{row.name}</div>
            ),
        },
        {
            header: t('table.columns.date'),
            accessor: 'date',
            align: 'left',
            sortable: true,
            sortKey: 'date',
            render: (row) => (
                <div className="text-gray-600">
                    {new Date(row.date).toLocaleDateString(i18n.language, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </div>
            ),
        },
        {
            header: t('table.columns.city'),
            accessor: 'city',
            align: 'left',
            sortable: true,
            sortKey: 'city',
        },
        {
            header: t('table.columns.place'),
            accessor: 'place',
            align: 'left',
        },
        {
            header: t('table.columns.price'),
            accessor: 'price',
            align: 'right',
            sortable: true,
            sortKey: 'price',
            render: (row) => (
                <div className="font-semibold text-green-600">
                    ${parseFloat(row.price).toFixed(2)}
                </div>
            ),
        },
        {
            header: t('table.columns.clicks'),
            accessor: 'number_of_clicks',
            align: 'center',
            sortable: true,
            sortKey: 'number_of_clicks',
            render: (row) => (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {row.number_of_clicks || 0}
                </div>
            ),
        },
        {
            header: t('table.columns.status'),
            accessor: 'is_active',
            align: 'center',
            sortable: true,
            sortKey: 'is_active',
            render: (row) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                >
                    {row.is_active ? t('table.status.active') : t('table.status.inactive')}
                </span>
            ),
        },
        {
            header: t('table.columns.actions'),
            accessor: 'actions',
            align: 'center',
            render: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleEditClick(row)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title={t('actions.edit')}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title={t('actions.delete')}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ];

    // Action buttons
    const handleAddTicket = () => {
        setEditingTicket(null);
        setCurrentView('create');
    };
    const topActions = [
        {
            label: t('actions.addTicket'),
            type: 'primary',
            onClick: handleAddTicket,
        },
    ];

    const handleEditClick = (ticket) => {
        setEditingTicket(ticket);
        setCurrentView('edit');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setEditingTicket(null);
        handlePageChange(filters.page);
    };

    const handleDelete = async (id) => {
        const ticketToDelete = tickets.find(t => t.id === id);
        const ticketName = ticketToDelete?.name || 'this ticket';

        const isConfirmed = await showConfirm({
            title: t('confirm.delete.title'),
            text: t('confirm.delete.text', { name: ticketName }),
            confirmButtonText: t('confirm.delete.confirmButton'),
            cancelButtonText: t('confirm.delete.cancelButton'),
            icon: 'warning'
        });
        if(isConfirmed){
            const result = await removeTicket(id);
            if (result.type.includes('fulfilled')) {
                toast.success(t('messages.success.deleted'));
            }
        }
    };

    const onSort = (sortKey, sortDirection) => {
        const newConfig = {
            key: sortKey,
            direction: sortDirection
        };
        setSortConfig(newConfig);
        handleSort(sortKey, sortDirection);
    };

    // Render Create/Edit view
    if (currentView === 'create' || currentView === 'edit') {
        return (
            <CreateTicket
                onBack={handleBackToList}
                editTicket={editingTicket}
            />
        );
    }

    // Render List view
    return (
        <div className="container mx-auto px-4 py-6">
            {loading && tickets.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <MainTable
                    columns={columns}
                    data={tickets}
                    searchPlaceholder={t('table.searchPlaceholder')}
                    currentPage={filters.page}
                    itemsPerPage={filters.page_limit}
                    totalItems={pagination.count}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                    topActions={topActions}
                    sortConfig={sortConfig}
                    onSort={onSort}
                />
            )}
        </div>
    );
}

export default Tickets;