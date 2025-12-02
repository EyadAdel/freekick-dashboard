import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import MainTable from './../../components/MainTable';
import { Pencil, Trash2, Puzzle, Plus } from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import AddonsForm from '../../components/addons/AddonsForm.jsx';
import { addonsService } from '../../services/addons/addonsService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import { toast } from 'react-toastify';

// --- CRITICAL FIX: Safe Image Component ---
// This prevents the "removeChild" crash by using State instead of direct DOM manipulation
const AddonImage = ({ src }) => {
    const [hasError, setHasError] = useState(false);

    // If no source or if an error occurred, show the fallback icon
    if (!src || hasError) {
        return (
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                <Puzzle size={20} />
            </div>
        );
    }

    return (
        <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 border border-gray-200">
            <img
                src={src}
                alt="icon"
                className="w-full h-full object-contain"
                onError={() => setHasError(true)}
            />
        </div>
    );
};

const AddOns = () => {
    const rowsPerPage = 10;
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Add Ons'));
    }, [dispatch]);

    // --- STATE ---
    const [addonsData, setAddonsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Form & Edit States
    const [showForm, setShowForm] = useState(false);
    const [selectedAddon, setSelectedAddon] = useState(null);

    // Filter State
    const [activeFilters, setActiveFilters] = useState({
        globalSearch: ''
    });

    // --- FETCH DATA ---
    const fetchAddonsData = async () => {
        setIsLoading(true);
        try {
            const response = await addonsService.getAll({ page: currentPage });

            if (response && response.results) {
                setAddonsData(response.results);
                setTotalCount(response.count);
            } else if (Array.isArray(response)) {
                setAddonsData(response);
                setTotalCount(response.length);
            }
        } catch (error) {
            console.error("Failed to fetch addons:", error);
            toast.error("Failed to load addons data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAddonsData();
    }, [currentPage]);

    // --- CRUD HANDLERS ---
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
            title: `Delete "${name}"?`,
            text: "This action cannot be undone. The addon will be permanently removed.",
            confirmButtonText: 'Yes, Delete it'
        });

        if (!isConfirmed) return;

        try {
            await addonsService.delete(id);
            setAddonsData(prev => prev.filter(item => item.id !== id));
            setTotalCount(prev => prev - 1);
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

    // --- FILTER LOGIC ---
    const filteredData = useMemo(() => {
        if (!addonsData) return [];

        return addonsData.filter((item) => {
            if (activeFilters.globalSearch) {
                const search = activeFilters.globalSearch.toLowerCase();
                const nameEn = item.translations?.en?.name?.toLowerCase() || '';
                const nameAr = item.translations?.ar?.name?.toLowerCase() || '';

                if (!nameEn.includes(search) && !nameAr.includes(search)) return false;
            }
            return true;
        });
    }, [addonsData, activeFilters]);

    const handleSearch = (term) => {
        setActiveFilters(prev => ({ ...prev, globalSearch: term }));
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const stats = useMemo(() => {
        return {
            total: totalCount,
        };
    }, [totalCount]);

    // --- TABLE CONFIG ---
    const ActionButtons = ({ addon }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button
                className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
                title="Edit Addon"
                onClick={() => handleEditAddon(addon)}
            >
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
                onClick={() => handleDeleteAddon(addon.id, addon.translations?.en?.name || "this item")}
                title="Delete Addon"
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
            render: (row, index) => (
                <div className="text-gray-600 font-medium text-sm">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                </div>
            )
        },
        {
            header: 'Icon',
            accessor: 'icon',
            align: 'center',
            width: '100px',
            render: (row) => (
                <div className="flex justify-center">
                    {/* Using the safe AddonImage component with direct row.icon */}
                    <AddonImage src={row.icon} />
                </div>
            )
        },
        {
            header: 'Name (EN)',
            accessor: 'name_en',
            align: 'center',
            render: (row) => (
                <span className="font-medium text-gray-900 text-sm">
                    {row.translations?.en?.name || '-'}
                </span>
            )
        },
        {
            header: 'Name (AR)',
            accessor: 'name_ar',
            align: 'center',
            render: (row) => (
                <span className="font-medium text-gray-900 text-sm" style={{direction: 'rtl'}}>
                    {row.translations?.ar?.name || '-'}
                </span>
            )
        },
        {
            header: 'Quick Actions',
            align: 'right',
            render: (row) => <ActionButtons addon={row} />
        }
    ];

    const topActions = [
        {
            label: '+ Create Addon',
            onClick: handleCreateAddon,
            type: 'primary',
            icon: <Plus size={18} />
        }
    ];


    return (
        <div className="w-full p-4 ">


            {/* Form Section */}
            {showForm && (
                <div className='mb-6 sm:mb-8'>
                    <AddonsForm
                        initialData={selectedAddon}
                        onCancel={handleCancelForm}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            )}

            {/* Main Table Section */}
            <MainTable
                data={filteredData}
                columns={columns}
                filters={[]}
                searchPlaceholder="Search by name..."
                topActions={topActions}
                currentPage={currentPage}
                totalItems={totalCount}
                itemsPerPage={rowsPerPage}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                isLoading={isLoading}
            />
        </div>
    );
};

export default AddOns;