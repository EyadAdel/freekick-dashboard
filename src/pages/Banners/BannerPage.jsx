import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBanners } from '../../hooks/useBanners';
import BannerSlider from '../../components/banners/BannerSlider.jsx';
import MainTable from '../../components/MainTable';
import BannerForm from '../../components/banners/BannerForm.jsx';
import { Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import ArrowIcon from "../../components/common/ArrowIcon.jsx";
import {showConfirm} from "../../components/showConfirm.jsx";
import {useDispatch} from "react-redux";
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";
import { getImageUrl, extractFilename } from '../../utils/imageUtils.js';

const BannerPage = () => {
    const { t, i18n } = useTranslation('bannersPage');
    const {
        banners,
        loading,
        error,
        currentBanner,
        totalCount,
        getBanners,
        getBanner,
        addBanner,
        editBanner,
        removeBanner,
        clearBanner,
    } = useBanners();

    const [viewMode, setViewMode] = useState('slider'); // 'slider', 'list', 'form'
    const [editingBanner, setEditingBanner] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const itemsPerPage = 10;
    const dispatch = useDispatch();
    const isRTL = i18n.language === 'ar';

    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);

    // Fetch banners with pagination
    useEffect(() => {
        const params = {
            page: currentPage,
            page_limit: itemsPerPage,
            search: searchTerm || undefined,
            type: filters.type || undefined,
            ordering: sortConfig.direction === 'desc' ? `-${sortConfig.key}` : sortConfig.key,
        };

        getBanners(params);
    }, [currentPage, searchTerm, filters, sortConfig]);

    const handleCreate = () => {
        setEditingBanner(null);
        setViewMode('form');
    };

    const handleEdit = (banner) => {
        setEditingBanner(banner);
        setViewMode('form');
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm({
            title: t('confirm.delete.title'),
            text: t('confirm.delete.text'),
            confirmButtonText: t('confirm.delete.confirmButton'),
            cancelButtonText: t('confirm.delete.cancelButton'),
            icon: "warning"
        });

        if (confirmed) {
            await removeBanner(id);
            toast.success(t('messages.success.deleted'));

            // If we deleted the last item on the page and it's not page 1, go to previous page
            if (banners.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            const submitData = {
                image: formData.image,
                type: formData.type,
                value: formData.value,
                is_active: formData.is_active
            };

            if (editingBanner) {
                await editBanner(editingBanner.id, submitData);
                toast.success(t('messages.success.updated'));
            } else {
                await addBanner(submitData);
                toast.success(t('messages.success.created'));
            }

            setViewMode('list');
            setEditingBanner(null);
            clearBanner();
        } catch (error) {
            toast.error(editingBanner ? t('messages.error.updateFailed') : t('messages.error.createFailed'));
        }
    };

    const handleFormCancel = () => {
        setViewMode('list');
        setEditingBanner(null);
    };

    const handleBannerClick = (banner) => {
        switch (banner.type) {
            case 'link':
                window.open(banner.value, '_blank');
                break;
            case 'venue':
                console.log('Navigate to venue:', banner.value);
                break;
            case 'tournaments':
                console.log('Navigate to tournament:', banner.value);
                break;
            default:
                break;
        }
    };

    const handleImageError = (e) => {
        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48"><rect fill="%234F46E5" width="80" height="48"/><text x="50%" y="50%" fill="white" font-size="12" text-anchor="middle" dy=".3em">IMG</text></svg>';
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        setCurrentPage(1); // Reset to first page on sort change
    };

    // Table columns configuration
    const columns = [
        {
            header: t('table.columns.id'),
            accessor: 'id',
            align: 'left',
            sortable: true,
            sortKey: 'id',
            render: (row) => <span className="font-semibold">#{row.id}</span>
        },
        {
            header: t('table.columns.image'),
            accessor: 'image',
            align: 'left',
            render: (row) => {
                const imageUrl = getImageUrl(row.image);
                return (
                    <img
                        src={imageUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48"><rect fill="%234F46E5" width="80" height="48"/><text x="50%" y="50%" fill="white" font-size="12" text-anchor="middle" dy=".3em">IMG</text></svg>'}
                        alt={`Banner ${row.id}`}
                        className="w-14 h-8 object-cover rounded"
                        onError={handleImageError}
                    />
                );
            }
        },
        {
            header: t('table.columns.type'),
            accessor: 'type',
            align: 'left',
            sortable: true,
            sortKey: 'type',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    row.type === 'venue' ? 'bg-purple-100 text-purple-800' :
                        row.type === 'link' ? 'bg-blue-100 text-blue-800' :
                            row.type === 'tournaments' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                }`}>
                    {t(`table.types.${row.type}`) || row.type}
                </span>
            )
        },
        {
            header: t('table.columns.value'),
            accessor: 'value',
            align: 'left',
            render: (row) => (
                <span className="text-sm text-gray-600 max-w-md truncate block">
                    {row.value}
                </span>
            )
        },
        {
            header: t('table.columns.status'),
            accessor: 'is_active',
            align: 'center',
            sortable: true,
            sortKey: 'is_active',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {row.is_active ? t('table.status.active') : t('table.status.inactive')}
                </span>
            )
        },
        {
            header: t('table.columns.quickActions'),
            accessor: 'actions',
            align: 'center',
            render: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title={t('table.actions.edit')}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 text-gray-600 hover:bg-gray-500 rounded transition-colors"
                        title={t('table.actions.delete')}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    // Filter configuration
    const tableFilters = [
        {
            type: 'select',
            label: t('table.filters.type.label'),
            key: 'type',
            options: [
                { label: t('table.filters.type.options.venue'), value: 'venue' },
                { label: t('table.filters.type.options.text'), value: 'text' },
                { label: t('table.filters.type.options.link'), value: 'link' },
                { label: t('table.filters.type.options.tournaments'), value: 'tournaments' }
            ]
        }
    ];

    // Top actions for table view
    const topActions = [
        {
            label: t('actions.createBanner'),
            type: 'primary',
            onClick: handleCreate
        }
    ];

    // Render content based on view mode
    const renderContent = () => {
        switch (viewMode) {
            case 'form':
                return (
                    <div className="min-h-screen bg-gray-50">
                        <div className="container mx-auto px-6 ">
                            <div className="">
                                <BannerForm
                                    editingBanner={editingBanner}
                                    onSubmit={handleFormSubmit}
                                    onCancel={handleFormCancel}
                                    isLoading={loading}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'list':
                return (
                    <div className="min-h-screen bg-gray-50">
                        <div className="container mx-auto px-6">
                            <div className="flex items-center justify-between lg:mb-6  ">
                                <button
                                    onClick={() => setViewMode('slider')}
                                    className="flex items-center gap-2 text-xl bg-white p-5 py-3 rounded-lg w-full text-gray-600 hover:text-gray-900 lg:mb-4 transition-colors"
                                >
                                    <ArrowIcon size={'xl'} direction={isRTL ? 'right' : 'left'} />

                                    <span className="font-medium">{t('view.list.backToBanners')}</span>
                                </button>
                            </div>

                            <MainTable
                                columns={columns}
                                data={banners}
                                searchPlaceholder={t('table.searchPlaceholder')}
                                filters={tableFilters}
                                currentPage={currentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={totalCount}
                                onSearch={handleSearch}
                                onFilterChange={handleFilterChange}
                                onPageChange={handlePageChange}
                                topActions={topActions}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                            />
                        </div>
                    </div>
                );

            case 'slider':
            default:
                return (
                    <div className="min-h-screen bg-gray-50">
                        <div className="container mx-auto lg:px-4 px-2 md:px-8 pb-4">
                            {/* Banner Slider Section */}
                            <div className="bg-white shadow-sm p-4 rounded-lg border-b">
                                <div className="flex bg-white  lg:p-3 rounded-lg justify-between items-center mb-2">
                                    <h2 className="lg:text-xl   font-bold text-primary-600">{t('view.slider.uploadedBanners')}</h2>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className="lg:text-base  font-bold flex gap-2 items-center text-primary-700 hover:text-primary-600 "
                                    >
                                        {t('view.slider.seeAll')}
                                        <ArrowIcon direction={isRTL ? 'left' : 'right'}  size={'md'}/>
                                    </button>
                                </div>
                                <BannerSlider
                                    banners={banners.filter(b => b.is_active)}
                                    onBannerClick={handleBannerClick}
                                />

                                <button
                                    onClick={handleCreate}
                                    className="w-full mt-8 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="text-xl">+</span>
                                    {t('view.slider.uploadNew')}
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return renderContent();
};

export default BannerPage;