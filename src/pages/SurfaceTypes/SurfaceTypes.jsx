import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from "react-redux";
import { useTranslation } from 'react-i18next';
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import MainTable from '../../components/MainTable.jsx';
import SurfaceTypesForm from '../../components/SurfaceTypes/SurfaceTypesForm.jsx';
import { surfaceTypesService } from '../../services/surfaceTypes/surfaceTypesService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { IconButton } from '@mui/material';
import { toast } from 'react-toastify';

const SurfaceTypes = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation('surfaceTypesPage');
    const rowsPerPage = 10;

    // -- State Management --
    const [data, setData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
    });

    // View State (Table vs Form)
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // -- Title Update --
    useEffect(() => {
        dispatch(setPageTitle(t('title')));
    }, [dispatch, t]);

    // -- API Filters Memo --
    // This groups pagination and search into one object to trigger the useEffect
    const apiFilters = useMemo(() => ({
        page: currentPage,
        page_limit: rowsPerPage,
        search: filters.search,
    }), [currentPage, rowsPerPage, filters.search]);

    // -- API Actions --
    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await surfaceTypesService.getAllSurfaceTypes(apiFilters);

            // Handle both paginated response and array fallback
            if (result && result.results) {
                setData(result.results);
                setTotalItems(result.count || 0);
            } else if (Array.isArray(result)) {
                setData(result);
                setTotalItems(result.length);
            }
        } catch (error) {
            console.error("Failed to fetch surface types:", error);
            toast.error(t('messages.fetchError')); // Assuming you have this key
        } finally {
            setLoading(false);
        }
    };

    // Fetch data whenever apiFilters change
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiFilters]);

    // -- Handlers --
    const handleSearch = (term) => {
        setFilters(prev => ({ ...prev, search: term }));
        setCurrentPage(1); // Always reset to page 1 on new search
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleDelete = async (id) => {
        const isConfirmed = await showConfirm({
            title: t('delete.title'),
            text: t('delete.text')
        });

        if (isConfirmed) {
            try {
                await surfaceTypesService.deleteSurfaceType(id);

                // If deleting last item on current page, go back
                if (data.length === 1 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1);
                } else {
                    fetchData();
                }
            } catch (error) {
                // Error handled in service
            }
        }
    };

    const handleCreate = () => {
        setEditItem(null);
        setShowForm(true);
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditItem(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditItem(null);
        fetchData();
    };

    // -- Table Configuration --
    const columns = [
        {
            header: t('table.hash'),
            align: 'left',
            width: '80px',
            render: (row, index) => (
                <span className="text-gray-500 font-medium">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                </span>
            )
        },
        {
            header: t('table.nameEn'),
            align: 'center',
            render: (row) => (
                <span className="font-medium text-secondary-600">
                    {row.translations?.en?.name || '-'}
                </span>
            )
        },
        {
            header: t('table.nameAr'),
            align: 'center',
            render: (row) => (
                <span className="font-medium text-secondary-600">
                    {row.translations?.ar?.name || '-'}
                </span>
            )
        },
        {
            header: t('table.actions'),
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <IconButton
                        size="small"
                        onClick={() => handleEdit(row)}
                        className="text-blue-600 hover:bg-blue-50"
                        title={t('actions.edit')}
                    >
                        <Edit2 size={18} />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:bg-red-50"
                        title={t('actions.delete')}
                    >
                        <Trash2 size={18} />
                    </IconButton>
                </div>
            )
        }
    ];

    const topActions = [
        {
            label: (
                <div className="flex items-center gap-2">
                    <Plus size={18} />
                    <span>{t('actions.add')}</span>
                </div>
            ),
            type: 'primary',
            onClick: handleCreate
        }
    ];

    // -- Render --
    if (showForm) {
        return (
            <div className="p-4">
                <SurfaceTypesForm
                    initialData={editItem}
                    onCancel={handleCancelForm}
                    onSuccess={handleFormSuccess}
                />
            </div>
        );
    }

    return (
        <div className="p-4">
            <MainTable
                columns={columns}
                data={data}
                totalItems={totalItems}
                searchPlaceholder={t('actions.searchPlaceholder')}
                currentPage={currentPage}
                itemsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
                onSearch={handleSearch}
                topActions={topActions}
                isLoading={loading}
                filters={[]} // Ready for future expansion
            />
        </div>
    );
};

export default SurfaceTypes;