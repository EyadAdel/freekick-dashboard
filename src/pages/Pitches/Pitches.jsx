import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux'; // 1. Import useDispatch

import MainTable from './../../components/MainTable';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { pitchesService } from '../../services/pitches/pitchesService.js';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import PitchesForm from "../../components/pitches/PitchesForm.jsx"; // 2. Import Action

const Pitches = () => {
    // --- Configuration ---
    const rowsPerPage = 10;
    // --- Redux Title Setter ---

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Pitches')); // 3. Set the title when component mounts
    }, [dispatch]);


    // --- State Management ---
    const [pitchesData, setPitchesData] = useState([]); // Raw data from API
    const [isLoading, setIsLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Filter State (Stores the values of our inputs)
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        type: '',
        pitcherName: '',
        globalSearch: '' // We will merge the main search bar here too
    });

    // --- 1. Fetch Data ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Ideally, you pass filters to the API here.
                // For this example, we fetch page 1 (or all) and filter client-side.
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
        fetchData();
    }, []); // Removed [currentPage] dependency to keep client-side filtering simple on loaded data

    // --- 2. Filtering Logic (The "Brain") ---
    const filteredData = useMemo(() => {
        return pitchesData.filter((item) => {
            // 1. Filter by Status (Dropdown)
            if (activeFilters.status && activeFilters.status !== 'all') {
                // Convert boolean is_active to string for comparison
                if (String(item.is_active) !== activeFilters.status) return false;
            }

            // 2. Filter by Type/Size (Dropdown)
            if (activeFilters.type && activeFilters.type !== 'all') {
                if (String(item.size) !== activeFilters.type) return false;
            }

            // 3. Filter by Pitcher Name (Text Input)
            if (activeFilters.pitcherName) {
                const name = item.translations?.name?.toLowerCase() || '';
                const searchTerm = activeFilters.pitcherName.toLowerCase();
                if (!name.includes(searchTerm)) return false;
            }

            // 4. Global Search (Top Search Bar)
            if (activeFilters.globalSearch) {
                const search = activeFilters.globalSearch.toLowerCase();
                const name = item.translations?.name?.toLowerCase() || '';
                const venue = String(item.venue);
                // Search in Name OR Venue ID
                if (!name.includes(search) && !venue.includes(search)) return false;
            }

            return true;
        });
    }, [pitchesData, activeFilters]);

    // --- 3. Handlers ---

    // Updates specific filters (from the dynamic inputs)
    const handleFilterChange = (newFilters) => {
        setActiveFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to page 1 when filtering
    };

    // Updates global search (from the main search bar)
    const handleSearch = (term) => {
        setActiveFilters(prev => ({ ...prev, globalSearch: term }));
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // --- 4. Configuration for Inputs ---
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
            type: 'text' // Text Input
        }
    ];

    // --- 5. Columns & Actions ---
    const StatusBadge = ({ isActive }) => {
        const style = isActive ? 'bg-green-400 text-white' : 'bg-gray-500 text-white';
        return <span className={`px-3 py-1 rounded-md text-xs font-medium ${style}`}>{isActive ? 'Active' : 'Hidden'}</span>;
    };

    const ActionButtons = () => (
        <div className="flex justify-center items-center gap-4">
            <button className="text-gray-500 hover:text-teal-600"><Eye size={18} /></button>
            <button className="text-gray-500 hover:text-blue-600"><Pencil size={18} /></button>
            <button className="text-gray-500 hover:text-red-600"><Trash2 size={18} /></button>
        </div>
    );

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
        { header: 'Venue Name', accessor: 'venue', render: (row) => <a href="#" className="text-blue-600 hover:underline">Venue #{row.venue}</a> },
        { header: 'Status', accessor: 'is_active', align: 'center', render: (row) => <StatusBadge isActive={row.is_active} /> },
        { header: 'Type', accessor: 'size', render: (row) => <span>{row.size} a side</span> },
        { header: 'Pricing/hour', accessor: 'price_per_hour', render: (row) => <span>AED {parseFloat(row.price_per_hour || 0).toLocaleString()}</span> },
        { header: 'Quick Actions', align: 'center', render: () => <ActionButtons /> }
    ];

    const topActions = [
        { label: 'Create Pitch', onClick: () => console.log('Create'), type: 'primary' }
    ];

    return (
        <div className="w-full">
            {/*<PitchesForm/>*/}
            {isLoading && pitchesData.length === 0 ? (
                <div className="p-10 text-center text-gray-500">Loading...</div>
            ) : (
                <MainTable
                    // Pass the FILTERED data, not raw data
                    data={filteredData}
                    columns={columns}

                    // Configuration
                    filters={filterConfig}
                    searchPlaceholder="Search Name or Venue ID"
                    topActions={topActions}

                    // Pagination based on FILTERED results
                    currentPage={currentPage}
                    // IMPORTANT: Total items is now the length of the filtered array
                    totalItems={filteredData.length}
                    itemsPerPage={rowsPerPage}

                    // Actions
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

export default Pitches;