import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import MainTable from './../../components/MainTable';
import { Pencil, Trash2, Puzzle, Plus } from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import AddonsForm from '../../components/addons/AddonsForm.jsx';
import { addonsService } from '../../services/addons/addonsService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import { toast } from 'react-toastify';
// Import the utility function
import { getImageUrl } from '../../utils/imageUtils';

// --- Safe Image Component ---
const AddonImage = ({ src }) => {
    const [hasError, setHasError] = useState(false);

    // Convert the raw filename/path to a full URL using the utility
    const fullImageUrl = getImageUrl(src);

    // If no source or if an error occurred, show the fallback icon
    if (!fullImageUrl || hasError) {
        return (
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                <Puzzle size={20} />
            </div>
        );
    }

    return (
        <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 border border-gray-200">
            <img
                src={fullImageUrl}
                alt="icon"
                className="w-full h-full object-contain"
                onError={() => setHasError(true)}
            />
        </div>
    );
};

const AddOns = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation('addOnsPage'); // Initialize translation hook with namespace
    const rowsPerPage = 10;

    // Update page title when language changes
    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);

    // ================= STATE MANAGEMENT =================

    // 1. Table Data
    const [addonsData, setAddonsData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // 2. Form & Selection
    const [showForm, setShowForm] = useState(false);
    const [selectedAddon, setSelectedAddon] = useState(null);

    // 3. Filters
    const [filters, setFilters] = useState({
        search: '',
        // Add specific filters here if needed later (e.g., status: 'all')
    });

    // ================= API CALLS =================

    // Construct API params like in Pitches
    const apiFilters = useMemo(() => ({
        page: currentPage,
        page_limit: rowsPerPage, // Ensure your backend accepts this or 'limit'
        search: filters.search,
    }), [currentPage, rowsPerPage, filters]);

    const fetchAddonsData = async () => {
        setIsLoading(true);
        try {
            const response = await addonsService.getAll(apiFilters);

            if (response && response.results) {
                setAddonsData(response.results);
                setTotalItems(response.count);
            } else if (Array.isArray(response)) {
                // Fallback if API doesn't return pagination object
                setAddonsData(response);
                setTotalItems(response.length);
            }
        } catch (error) {
            console.error("Failed to fetch addons:", error);
            toast.error(t('messages.fetchError'));
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data whenever apiFilters change
    useEffect(() => {
        fetchAddonsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiFilters]);

    // ================= HANDLERS =================

    const handleSearch = (term) => {
        setFilters(prev => ({ ...prev, search: term }));
        setCurrentPage(1); // Reset to page 1 on search
    };

    // Generic filter handler matching Pitches structure
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const handleCreateAddon = () => {
        setSelectedAddon(null);
        setShowForm(true);
    };

    const handleEditAddon = (addon) => {
        setSelectedAddon(addon);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteAddon = async (id, name) => {
        const isConfirmed = await showConfirm({
            title: t('messages.deleteConfirm.title', { name: name }),
            text: t('messages.deleteConfirm.text'),
            confirmButtonText: t('messages.deleteConfirm.confirmButton')
        });

        if (!isConfirmed) return;

        try {
            await addonsService.delete(id);
            // If deleting the last item on a page > 1, go back a page
            if (addonsData.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchAddonsData();
            }
        } catch (error) {
            console.error("Failed to delete addon:", error);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setSelectedAddon(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedAddon(null);
        fetchAddonsData();
    };

    // ================= TABLE CONFIG =================

    // Define filters configuration (currently empty, but structure is ready for expansion)
    const filterConfig = [];

    const ActionButtons = ({ addon }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button
                className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
                title={t('actions.editTooltip')}
                onClick={() => handleEditAddon(addon)}
            >
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
                onClick={() => handleDeleteAddon(addon.id, addon.translations?.en?.name || t('messages.deleteConfirm.fallbackItemName'))}
                title={t('actions.deleteTooltip')}
            >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
        </div>
    );

    const columns = [
        {
            header: t('table.headers.srNo'),
            accessor: 'id',
            align: 'left',
            width: '80px',
            render: (row, index) => (
                <div className="text-gray-600 font-medium text-sm">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                </div>
            )
        },
        {
            header: t('table.headers.icon'),
            accessor: 'icon',
            align: 'center',
            width: '100px',
            render: (row) => (
                <div className="flex justify-center">
                    <AddonImage src={row.icon} />
                </div>
            )
        },
        {
            header: t('table.headers.nameEn'),
            accessor: 'name_en',
            align: 'center',
            render: (row) => (
                <span className="font-medium text-gray-900 text-sm">
                    {row.translations?.en?.name || '-'}
                </span>
            )
        },
        {
            header: t('table.headers.nameAr'),
            accessor: 'name_ar',
            align: 'center',
            render: (row) => (
                <span className="font-medium text-gray-900 text-sm" style={{direction: 'rtl'}}>
                    {row.translations?.ar?.name || '-'}
                </span>
            )
        },
        {
            header: t('table.headers.actions'),
            align: 'right',
            render: (row) => <ActionButtons addon={row} />
        }
    ];

    const topActions = [
        {
            label: t('actions.create'),
            onClick: handleCreateAddon,
            type: 'primary',
            icon: <Plus size={18} />
        }
    ];

    // ================= RENDER =================

    if (showForm) {
        return (
            <div className="w-full p-4 mb-6 sm:mb-8">
                <AddonsForm
                    initialData={selectedAddon}
                    onCancel={handleCancelForm}
                    onSuccess={handleFormSuccess}
                />
            </div>
        );
    }

    return (
        <div className="w-full p-4">
            <MainTable
                data={addonsData}
                columns={columns}
                filters={filterConfig}
                searchPlaceholder={t('table.searchPlaceholder')}
                topActions={topActions}
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={rowsPerPage}
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                onPageChange={handlePageChange}
                isLoading={isLoading}
            />
        </div>
    );
};

export default AddOns;