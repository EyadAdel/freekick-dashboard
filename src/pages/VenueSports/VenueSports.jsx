import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next'; // Import translation hook
import MainTable from './../../components/MainTable';
import { Pencil, Trash2, Activity, Plus } from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import VenueSportsForm from './../../components/venueSports/VenueSportsForm.jsx';
import { venueSportsService } from '../../services/venueSports/venueSportsService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import { getImageUrl } from '../../utils/imageUtils';

// --- Safe Image Component ---
const VenueTypeImage = ({ src }) => {
    const [hasError, setHasError] = useState(false);

    // Use the utility to get the full URL
    const fullSrc = getImageUrl(src);

    // If no source or if an error occurred, show the fallback icon
    if (!fullSrc || hasError) {
        return (
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-400">
                <Activity size={20} />
            </div>
        );
    }

    return (
        <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 border border-gray-200">
            <img
                src={fullSrc}
                alt="icon"
                className="w-full h-full object-contain"
                onError={() => setHasError(true)}
            />
        </div>
    );
};

const VenueSports = () => {
    const rowsPerPage = 10;
    const dispatch = useDispatch();
    const { t } = useTranslation('venueSportsPage'); // Initialize translation

    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);

    // --- STATE ---
    const [venueData, setVenueData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Form & Edit States
    const [showForm, setShowForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Filter State
    const [activeFilters, setActiveFilters] = useState({
        globalSearch: ''
    });

    // --- FETCH DATA ---
    const fetchVenueData = async () => {
        setIsLoading(true);
        try {
            const response = await venueSportsService.getAll({ page: currentPage });

            if (response && response.results) {
                setVenueData(response.results);
                setTotalCount(response.count);
            } else if (Array.isArray(response)) {
                setVenueData(response);
                setTotalCount(response.length);
            }
        } catch (error) {
            console.error("Failed to fetch venue types:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVenueData();
    }, [currentPage]);

    // --- CRUD HANDLERS ---
    const handleCreate = () => {
        setSelectedItem(null);
        setShowForm(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id, name) => {
        const isConfirmed = await showConfirm({
            title: t('deleteModal.title', { name: name }),
            text: t('deleteModal.text'),
            confirmButtonText: t('deleteModal.confirmButton')
        });

        if (!isConfirmed) return;

        try {
            await venueSportsService.delete(id);
            setVenueData(prev => prev.filter(item => item.id !== id));
            setTotalCount(prev => prev - 1);
        } catch (error) {
            console.error("Failed to delete venue type:", error);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setSelectedItem(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedItem(null);
        fetchVenueData();
    };

    // --- FILTER LOGIC ---
    const filteredData = useMemo(() => {
        if (!venueData) return [];

        return venueData.filter((item) => {
            if (activeFilters.globalSearch) {
                const search = activeFilters.globalSearch.toLowerCase();
                const nameEn = item.translations?.en?.name?.toLowerCase() || '';
                const nameAr = item.translations?.ar?.name?.toLowerCase() || '';

                if (!nameEn.includes(search) && !nameAr.includes(search)) return false;
            }
            return true;
        });
    }, [venueData, activeFilters]);

    const handleSearch = (term) => {
        setActiveFilters(prev => ({ ...prev, globalSearch: term }));
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    // --- TABLE CONFIG ---
    const ActionButtons = ({ item }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button
                className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
                title={t('actions.editTooltip')}
                onClick={() => handleEdit(item)}
            >
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
                onClick={() => handleDelete(item.id, item.translations?.en?.name || t('deleteModal.fallbackItem'))}
                title={t('actions.deleteTooltip')}
            >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
        </div>
    );

    const columns = [
        {
            header: t('table.srNo'),
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
            header: t('table.icon'),
            accessor: 'icon',
            align: 'center',
            width: '100px',
            render: (row) => (
                <div className="flex justify-center">
                    <VenueTypeImage src={row.icon} />
                </div>
            )
        },
        {
            header: t('table.nameEn'),
            accessor: 'name_en',
            align: 'center',
            render: (row) => (
                <span className="font-medium text-gray-900 text-sm">
                    {row.translations?.en?.name || '-'}
                </span>
            )
        },
        {
            header: t('table.nameAr'),
            accessor: 'name_ar',
            align: 'center',
            render: (row) => (
                <span className="font-medium text-gray-900 text-sm" style={{direction: 'rtl'}}>
                    {row.translations?.ar?.name || '-'}
                </span>
            )
        },
        {
            header: t('table.quickActions'),
            align: 'right',
            render: (row) => <ActionButtons item={row} />
        }
    ];

    const topActions = [
        {
            label: t('createButton'),
            onClick: handleCreate,
            type: 'primary',
            icon: <Plus size={18} />
        }
    ];

    return (
        <div className="w-full p-4">
            {showForm ? (
                // --- SHOW ONLY FORM IF ACTIVE ---
                <div className='mb-6 sm:mb-8'>
                    <VenueSportsForm
                        initialData={selectedItem}
                        onCancel={handleCancelForm}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            ) : (
                // --- SHOW ONLY TABLE IF FORM IS INACTIVE ---
                <MainTable
                    data={filteredData}
                    columns={columns}
                    filters={[]}
                    searchPlaceholder={t('searchPlaceholder')}
                    topActions={topActions}
                    currentPage={currentPage}
                    totalItems={totalCount}
                    itemsPerPage={rowsPerPage}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default VenueSports;