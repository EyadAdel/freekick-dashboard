import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import MainTable from './../../components/MainTable';
import AmenitiesForm from './../../components/amenities/AmenitiesForm.jsx';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import { amenitiesService } from '../../services/amenities/amenitiesService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import logo from "./../../assets/logo.svg";
// Updated import
import { getImageUrl } from '../../utils/imageUtils.js';
import { useTranslation } from 'react-i18next'; // Import translation hook

// --- Helper: Image Component for Amenities ---
const AmenityIcon = ({ iconPath, alt }) => {
    const [hasError, setHasError] = useState(false);

    // Use the utility function to determine the correct URL
    const imageUrl = getImageUrl(iconPath);

    if (!imageUrl || hasError) {
        return (
            <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <img src={logo} alt="Default Logo" className="w-8 h-8 opacity-50" />
            </div>
        );
    }

    return (
        <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <img
                src={imageUrl}
                alt={alt}
                className="w-full h-full object-cover"
                onError={() => setHasError(true)}
            />
        </div>
    );
};

const Amenities = () => {
    const { t } = useTranslation('amenitiesPage'); // Initialize translation
    const rowsPerPage = 10;
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);

    // ================= STATE MANAGEMENT =================

    // 1. Table Data
    const [amenitiesData, setAmenitiesData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // 2. Filters
    const [filters, setFilters] = useState({
        search: '',
    });

    // 3. Form & Edit States
    const [showForm, setShowForm] = useState(false);
    const [selectedAmenity, setSelectedAmenity] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // ================= API CALLS =================

    const apiFilters = useMemo(() => ({
        page: currentPage,
        page_limit: rowsPerPage,
        search: filters.search,
    }), [currentPage, rowsPerPage, filters]);

    const fetchAmenitiesData = async () => {
        setIsLoading(true);
        try {
            const response = await amenitiesService.getAllAmenities(apiFilters);

            if (response && response.results) {
                setAmenitiesData(response.results);
                setTotalItems(response.count || 0);
            } else if (Array.isArray(response)) {
                setAmenitiesData(response);
                setTotalItems(response.length);
            }
        } catch (error) {
            console.error("Failed to fetch amenities:", error);
            setAmenitiesData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAmenityData = async (id) => {
        try {
            const response = await amenitiesService.getAmenityById(id);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch amenity details:", error);
            throw error;
        }
    };

    useEffect(() => {
        fetchAmenitiesData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiFilters]);

    // ================= HANDLERS =================

    const handleSearch = (term) => {
        setFilters(prev => ({ ...prev, search: term }));
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const handleCreateAmenities = () => {
        setSelectedAmenity(null);
        setIsEditing(false);
        setShowForm(true);
    };

    const handleEditAmenity = async (amenity) => {
        try {
            setIsEditing(true);
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            const amenityData = await fetchAmenityData(amenity.id);
            setSelectedAmenity(amenityData);
        } catch (error) {
            console.error("Failed to load amenity for editing:", error);
            setIsEditing(false);
            setShowForm(false);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setSelectedAmenity(null);
        setIsEditing(false);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedAmenity(null);
        setIsEditing(false);
        fetchAmenitiesData();
    };

    const handleDeleteAmenity = async (id, amenityName) => {
        const isConfirmed = await showConfirm({
            title: t('dialogs.deleteTitle', { name: amenityName }),
            text: t('dialogs.deleteText'),
            confirmButtonText: t('dialogs.confirmButton')
        });

        if (!isConfirmed) return;

        try {
            await amenitiesService.deleteAmenity(id);
            if (amenitiesData.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchAmenitiesData();
            }
        } catch (error) {
            console.error("Failed to delete amenity:", error);
        }
    };

    const getDisplayName = (row) => {
        return row.translations?.name ||
            row.translations?.en?.name ||
            row.name ||
            `Amenity ${row.id}`;
    };

    // ================= TABLE CONFIG =================

    const ActionButtons = ({ amenity }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button
                className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
                title={t('actions.edit')}
                onClick={() => handleEditAmenity(amenity)}
            >
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
                onClick={() => handleDeleteAmenity(amenity.id, getDisplayName(amenity))}
                title={t('actions.delete')}
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
            render: (row, index) => {
                const currentIndex = (currentPage - 1) * rowsPerPage + index + 1;
                return (
                    <div className="text-gray-600 font-medium text-sm">
                        {currentIndex}
                    </div>
                )
            }
        },
        {
            header: t('table.icon'),
            accessor: 'icon',
            align: 'center',
            width: '100px',
            render: (row) => (
                <div className="flex justify-center">
                    <AmenityIcon
                        iconPath={row.icon}
                        alt={getDisplayName(row)}
                    />
                </div>
            )
        },
        {
            header: t('table.name'),
            accessor: 'name',
            align: 'center',
            render: (row) => (
                <div className="font-medium text-gray-900 text-sm">
                    {getDisplayName(row)}
                </div>
            )
        },
        {
            header: t('table.actions'),
            align: 'right',
            width: '100px',
            render: (row) => <ActionButtons amenity={row} />
        }
    ];

    const topActions = [
        {
            label: t('actions.create'),
            onClick: handleCreateAmenities,
            type: 'primary',
            icon: <Plus size={18} />
        }
    ];

    // ================= CONDITIONAL RENDER =================

    // 1. If showing form, return ONLY the form
    if (showForm) {
        return (
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <AmenitiesForm
                    onCancel={handleCancelForm}
                    onSuccess={handleFormSuccess}
                    initialData={selectedAmenity}
                    isEditing={isEditing}
                    isLoading={isEditing && !selectedAmenity}
                />
            </div>
        );
    }

    // 2. Otherwise, show the table
    return (
        <div className="w-full px-4 sm:px-6 lg:px-8">
            {isLoading && amenitiesData.length === 0 ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                    <p className="mt-4 text-gray-500">{t('messages.loading')}</p>
                </div>
            ) : (
                <MainTable
                    data={amenitiesData}
                    columns={columns}
                    filters={[]}
                    searchPlaceholder={t('messages.searchPlaceholder')}
                    topActions={topActions}
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={rowsPerPage}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                    emptyStateMessage={
                        filters.search ?
                            t('messages.noResults', { search: filters.search }) :
                            t('messages.noData')
                    }
                />
            )}
        </div>
    );
};

export default Amenities;