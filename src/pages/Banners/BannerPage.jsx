import React, { useEffect, useState } from 'react';
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
import  {IMAGE_BASE_URL} from '../../utils/ImageBaseURL.js'
const BannerPage = () => {
    const {
        banners,
        loading,
        error,
        currentBanner,
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

    useEffect(() => {
        dispatch(setPageTitle('Banners'));
    }, [dispatch]);
    useEffect(() => {
        getBanners({
            search: searchTerm || undefined,
            type: filters.type || undefined,
        });
    }, [searchTerm, filters]);

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
            title: "Delete Banner",
            text: "Are you sure you want to delete this banner? This action cannot be undone.",
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "No, keep it",
            icon: "warning"
        });

        if (confirmed) {
            await removeBanner(id)
                toast.success('banner deleted successfully')
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
                toast.success('Banner updated successfully');
            } else {
                await addBanner(submitData);
                toast.success('Banner created successfully');
            }

            setViewMode('list'); // Go back to list view after successful save
            setEditingBanner(null);
            clearBanner();
        } catch (error) {
            toast.error('Failed to save banner');
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

    // Table columns configuration
    const columns = [
        {
            header: 'ID',
            accessor: 'id',
            align: 'left',
            sortable: true,
            sortKey: 'id',
            render: (row) => <span className="font-semibold">#{row.id}</span>
        },
        {
            header: 'Image',
            accessor: 'image',
            align: 'left',
            render: (row) => (
                <img src={IMAGE_BASE_URL + row.image}
                    alt={`Banner ${row.id}`}
                    className="w-14 h-8 object-cover rounded"
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48"><rect fill="%234F46E5" width="80" height="48"/><text x="50%" y="50%" fill="white" font-size="12" text-anchor="middle" dy=".3em">IMG</text></svg>';
                    }}
                />
            )
        },
        {
            header: 'Type',
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
                    {row.type}
                </span>
            )
        },
        {
            header: 'Value',
            accessor: 'value',
            align: 'left',
            render: (row) => (
                <span className="text-sm text-gray-600 max-w-md truncate block">
                    {row.value}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: 'is_active',
            align: 'center',
            sortable: true,
            sortKey: 'is_active',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            header: 'Quick Actions',
            accessor: 'actions',
            align: 'center',
            render: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 text-gray-600 hover:bg-gray-500 rounded transition-colors"
                        title="Delete"
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
            label: 'Type',
            key: 'type',
            options: [
                { label: 'Venues', value: 'venue' },
                { label: 'Text', value: 'text' },
                { label: 'Link', value: 'link' },
                { label: 'Tournaments', value: 'tournaments' }
            ]
        }
    ];

    // Top actions for table view
    const topActions = [
        {
            label: '+ Create Banner',
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
                                    <ArrowIcon size={'xl'} direction={'left'} />
                                    <span className="font-medium">Back to Banners</span>
                                </button>

                            </div>

                            <MainTable
                                columns={columns}
                                data={banners}
                                searchPlaceholder="Search banners..."
                                filters={tableFilters}
                                currentPage={currentPage}
                                itemsPerPage={itemsPerPage}
                                onSearch={setSearchTerm}
                                onFilterChange={setFilters}
                                onPageChange={setCurrentPage}
                                topActions={topActions}
                                sortConfig={sortConfig}
                                onSort={(key) => {
                                    setSortConfig(prev => ({
                                        key,
                                        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
                                    }));
                                }}
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
                                <h2 className="lg:text-xl   font-bold text-primary-600">Uploaded Banners</h2>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className="lg:text-base  font-bold flex gap-2 items-center text-primary-700 hover:text-primary-600 font-medium"
                                >
                                    See all
                                    <ArrowIcon direction={'right'} size={'md'}/>
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
                                    Upload New Banner
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