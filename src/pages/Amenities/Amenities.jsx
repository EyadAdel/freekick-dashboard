import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import MainTable from './../../components/MainTable';
import AmenitiesForm from './../../components/amenities/AmenitiesForm.jsx';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import { amenitiesService } from '../../services/amenities/amenitiesService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import logo from "./../../assets/logo.svg"

const Amenities = () => {
    const rowsPerPage = 10;
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Amenities'));
    }, [dispatch]);

    // State Management
    const [amenitiesData, setAmenitiesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Form & Edit States
    const [showForm, setShowForm] = useState(false);
    const [selectedAmenity, setSelectedAmenity] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch All Data
    const fetchAmenitiesData = async () => {
        setIsLoading(true);
        try {
            const response = await amenitiesService.getAllAmenities();
            if (response && response.results) {
                setAmenitiesData(response.results);
            } else if (Array.isArray(response)) {
                setAmenitiesData(response);
            }
        } catch (error) {
            console.error("Failed to fetch amenities:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch Single Amenity Data
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
    }, []);

    // Form Handlers
    const handleCreateAmenities = () => {
        setSelectedAmenity(null);
        setIsEditing(false);
        setShowForm(true);
    };

    const handleEditAmenity = async (amenity) => {
        try {
            setIsEditing(true);
            // Show loading state or form immediately
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Fetch the latest data for this amenity
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
            title: `Delete "${amenityName}"?`,
            text: "This action cannot be undone. The amenity will be permanently removed.",
            confirmButtonText: 'Yes, Delete it'
        });

        if (!isConfirmed) return;

        try {
            await amenitiesService.deleteAmenity(id);
            fetchAmenitiesData();
        } catch (error) {
            console.error("Failed to delete amenity:", error);
        }
    };

    // Enhanced Filter Logic
    const filteredData = useMemo(() => {
        if (!amenitiesData || amenitiesData.length === 0) return [];

        if (!searchTerm.trim()) return amenitiesData;

        const term = searchTerm.toLowerCase().trim();

        return amenitiesData.filter((item) => {
            // Check all possible name locations
            const nameEn = item.translations?.en?.name?.toLowerCase() || '';
            const nameAr = item.translations?.ar?.name?.toLowerCase() || '';
            const name = item.translations?.name?.toLowerCase() || '';
            const directName = item.name?.toLowerCase() || '';

            // Check all possible name fields
            return nameEn.includes(term) ||
                nameAr.includes(term) ||
                name.includes(term) ||
                directName.includes(term);
        });
    }, [amenitiesData, searchTerm]);

    // Handlers
    const handleSearch = (term) => {
        setSearchTerm(term);
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    // Calculate paginated data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage]);

    // Function to get display name (for table and search)
    const getDisplayName = (row) => {
        // Try different possible name locations
        return row.translations?.name ||
            row.translations?.en?.name ||
            row.name ||
            `Amenity ${row.id}`;
    };

    // Action Buttons
    const ActionButtons = ({ amenity }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button
                className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
                title="Edit Amenity"
                onClick={() => handleEditAmenity(amenity)}
            >
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
                onClick={() => handleDeleteAmenity(amenity.id, getDisplayName(amenity))}
                title="Delete Amenity"
            >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
        </div>
    );

    const columns = [
        {
            header: 'Sr.No',
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
            header: 'Icon',
            accessor: 'icon',
            align: 'center',
            width: '80px',
            render: (row) => (
                <div className="flex justify-center">
                    {!row.icon ? (
                        <div
                            className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                            <img src={logo} alt="Default Logo" className="w-8 h-8"/>

                        </div>
                    ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg">
                            <span className="text-lg">
                                <img src={logo} alt="Default Logo" className="w-8 h-8" />
                            </span>
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Amenity Name',
            accessor: 'name_en',
            align: 'center',
            width: '150px',
            render: (row) => (
                <div className="font-medium text-gray-900 text-sm">
                    {getDisplayName(row)}
                </div>
            )
        },

        {
            header: 'Actions',
            align: 'right',
            width: '100px',
            render: (row) => <ActionButtons amenity={row} />
        }
    ];

    const topActions = [
        {
            label: 'Create Amenity',
            onClick: handleCreateAmenities,
            type: 'primary',
            icon: <Plus size={18} />
        }
    ];

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8">
            {/* Form Section */}
            {showForm && (
                <AmenitiesForm
                    onCancel={handleCancelForm}
                    onSuccess={handleFormSuccess}
                    initialData={selectedAmenity}
                    isEditing={isEditing}
                    isLoading={isEditing && !selectedAmenity}
                />
            )}

            {/* Main Table Section */}
            {isLoading && amenitiesData.length === 0 ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                </div>
            ) : (
                <MainTable
                    data={paginatedData}
                    columns={columns}
                    filters={[]}
                    searchPlaceholder="Search amenities by name..."
                    topActions={topActions}
                    currentPage={currentPage}
                    totalItems={filteredData.length}
                    itemsPerPage={rowsPerPage}
                    onSearch={handleSearch}
                    onFilterChange={() => {}}
                    onPageChange={handlePageChange}
                    hideFilterBar={true}
                    emptyStateMessage={
                        searchTerm ?
                            `No amenities found matching "${searchTerm}"` :
                            "No amenities available. Create your first amenity!"
                    }
                />
            )}
        </div>
    );
};

export default Amenities;