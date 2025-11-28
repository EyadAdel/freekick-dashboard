import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import MainTable from './../../components/MainTable';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import PitchesForm from "../../components/pitches/PitchesForm.jsx";

// 👇 1. Import your Service and the Confirm Utility
import { pitchesService } from '../../services/pitches/pitchesService.js';
import { venuesService } from '../../services/venues/venuesService.js';
import { showConfirm } from '../../components/showConfirm.jsx';

const Pitches = () => {
    const rowsPerPage = 10;
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Pitches'));
    }, [dispatch]);

    // State Management
    // State Management
    const [pitchesData, setPitchesData] = useState([]);
    const [venuesData, setVenuesData] = useState([]); // 👈 Added venues state
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        type: '',
        pitcherName: '',
        globalSearch: ''
    });

    // Fetch Pitches Data
    const fetchPitchesData = async () => {
        setIsLoading(true);
        try {
            const response = await pitchesService.getAllPitchess(currentPage);
            if (response) {
                if (response.results) setPitchesData(response.results);
            }
        } catch (error) {
            console.error("Failed to fetch pitches:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 👇 2. Fetch Venues Data
    const fetchVenuesData = async () => {
        try {
            const response = await venuesService.getAllVenues();
            if (response && response.results) {
                setVenuesData(response.results);
            }
        } catch (error) {
            console.error("Failed to fetch venues:", error);
        }
    };

    // 👇 3. Combined data fetching
    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([fetchPitchesData(), fetchVenuesData()]);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);
    // 👇 2. Updated Delete Handler
    const handleDeletePitch = async (id, pitchName) => {
        // Call the smooth confirm popup
        const isConfirmed = await showConfirm({
            title: `Delete "${pitchName}"?`,
            text: "This action cannot be undone. The pitch will be permanently removed.",
            confirmButtonText: 'Yes, Delete it'
        });

        // Stop here if user clicked "Cancel"
        if (!isConfirmed) return;

        try {
            // Call API
            await pitchesService.deletePitch(id);

            // Remove from UI immediately (Optimistic update)
            setPitchesData(prev => prev.filter(pitch => pitch.id !== id));

            // Note: We don't need toast.success here because
            // `pitchesService.deletePitch` already handles the Success Toast!
        } catch (error) {
            console.error("Failed to delete pitch:", error);
            // Service handles the Error Toast too
        }
    };

    // Filtering Logic
    const filteredData = useMemo(() => {
        return pitchesData.filter((item) => {
            if (activeFilters.status && activeFilters.status !== 'all') {
                if (String(item.is_active) !== activeFilters.status) return false;
            }

            if (activeFilters.type && activeFilters.type !== 'all') {
                if (String(item.size) !== activeFilters.type) return false;
            }

            if (activeFilters.pitcherName) {
                const name = item.translations?.name?.toLowerCase() || '';
                const searchTerm = activeFilters.pitcherName.toLowerCase();
                if (!name.includes(searchTerm)) return false;
            }

            if (activeFilters.globalSearch) {
                const search = activeFilters.globalSearch.toLowerCase();
                const name = item.translations?.name?.toLowerCase() || '';
                const venue = String(item.venue);
                if (!name.includes(search) && !venue.includes(search)) return false;
            }

            return true;
        });
    }, [pitchesData, activeFilters]);

    // Handlers
    const handleFilterChange = (newFilters) => {
        setActiveFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handleSearch = (term) => {
        setActiveFilters(prev => ({ ...prev, globalSearch: term }));
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Action Buttons Component
    const ActionButtons = ({ pitch }) => (
        <div className="flex justify-center items-center gap-4">
            <button
                className="text-gray-500 hover:text-teal-600"
                title="View Pitch"
            >
                <Eye size={18} />
            </button>
            <button
                className="text-gray-500 hover:text-blue-600"
                title="Edit Pitch"
            >
                <Pencil size={18} />
            </button>
            <button
                className="text-gray-500 hover:text-red-600"
                // 👇 Pass the specific name to the handler for the popup message
                onClick={() => handleDeletePitch(pitch.id, pitch.translations?.name || `Pitch ${pitch.id}`)}
                title="Delete Pitch"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );

    // Configuration
    const filterConfig = [
        {
            key: 'status',
            label: 'Filter Status',
            type: 'select',
            options: [
                { label: 'Active', value: 'true' },
                { label: 'Hidden', value: 'false' }
            ]
        },
        {
            key: 'type',
            label: 'Pitch Type',
            type: 'select',
            options: [
                { label: '5 a side', value: '5' },
                { label: '7 a side', value: '7' }
            ]
        },
        {
            key: 'pitcherName',
            label: 'Pitcher Name...',
            type: 'text'
        }
    ];

    const columns = [
        {
            header: 'Pitch Name/ID',
            accessor: 'id',
            render: (row) => (
                <div className="font-medium text-gray-700">
                    {row.translations?.name || `Pitch ${row.id}`}
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-gray-500">#{row.id}</span>
                </div>
            )
        },
        {
            header: 'Venue Name',
            accessor: 'venue',
            render: (row) => <a href="#" className="text-blue-600 hover:underline">Venue #{row.venue}</a>
        },
        {
            header: 'Status',
            accessor: 'is_active',
            align: 'center',
            render: (row) => <StatusBadge isActive={row.is_active} />
        },
        {
            header: 'Type',
            accessor: 'size',
            render: (row) => <span>{row.size} a side</span>
        },
        {
            header: 'Pricing/hour',
            accessor: 'price_per_hour',
            render: (row) => <span>AED {parseFloat(row.price_per_hour || 0).toLocaleString()}</span>
        },
        {
            header: 'Quick Actions',
            align: 'center',
            render: (row) => <ActionButtons pitch={row} />
        }
    ];

    const topActions = [
        { label: 'Create Pitch', onClick: () => console.log('Create'), type: 'primary' }
    ];

    return (
        <div className="w-full">
            {isLoading && pitchesData.length === 0 ? (
                <div className="p-10 text-center text-gray-500">Loading...</div>
            ) : (
                <MainTable
                    data={filteredData}
                    columns={columns}
                    filters={filterConfig}
                    searchPlaceholder="Search Name or Venue ID"
                    topActions={topActions}
                    currentPage={currentPage}
                    totalItems={filteredData.length}
                    itemsPerPage={rowsPerPage}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

const StatusBadge = ({ isActive }) => {
    const style = isActive ? 'bg-green-400 text-white' : 'bg-gray-500 text-white';
    return <span className={`px-3 py-1 rounded-md text-xs font-medium ${style}`}>{isActive ? 'Active' : 'Hidden'}</span>;
};

export default Pitches;