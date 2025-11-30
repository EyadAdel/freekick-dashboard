import React, { useState } from 'react';
import SortableTableHeader from '../components/common/SortableTableHeader.jsx';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { TextField, MenuItem, InputAdornment } from '@mui/material';

/**
 * MainTable Component - Enhanced with Optional Sorting
 *
 * @param {Array} columns - Table columns configuration
 *   - header: string (column title)
 *   - accessor: string (data key)
 *   - render: function (custom render function)
 *   - align: 'left' | 'center' | 'right'
 *   - sortable: boolean (optional - enables sorting for this column)
 *   - sortKey: string (optional - key used for sorting, required if sortable is true)
 *
 * @param {Array} data - Table data
 * @param {string} searchPlaceholder - Placeholder for search input
 * @param {Array} filters - Filter configurations
 * @param {number} currentPage - Current page number
 * @param {number} itemsPerPage - Items per page
 * @param {number} totalItems - Total items count
 * @param {function} onSearch - Search callback
 * @param {function} onFilterChange - Filter change callback
 * @param {function} onPageChange - Page change callback
 * @param {Array} topActions - Action buttons configuration
 * @param {object} sortConfig - Sort configuration { key: string, order: 'asc' | 'desc' } (optional)
 * @param {function} onSort - Sort callback (optional)
 */
const MainTable = ({
                       columns = [],
                       data = [],
                       searchPlaceholder = "Search...",
                       filters = [],
                       currentPage = 1,
                       itemsPerPage = 10,
                       totalItems,
                       onSearch,
                       onFilterChange,
                       onPageChange,
                       topActions = [],
                       sortConfig = null,
                       onSort = null
                   }) => {

    const [searchTerm, setSearchTerm] = useState('');
    const [filterValues, setFilterValues] = useState({});

    // Handle Global Search
    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (onSearch) onSearch(val);
    };

    // Handle Specific Filters
    const handleFilterInput = (key, value) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        if (onFilterChange) onFilterChange(newFilters);
    };

    // Pagination Calculations
    const finalTotalItems = totalItems !== undefined ? totalItems : data.length;
    const totalPages = Math.ceil(finalTotalItems / itemsPerPage);

    // For server-side pagination: use data as-is (already paginated)
    // For client-side pagination: slice the data
    const isServerSidePagination = totalItems !== undefined && totalItems !== data.length;
    const displayData = isServerSidePagination ? data : data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const startRange = finalTotalItems === 0 ? 0 : startIndex + 1;
    const endRange = Math.min(startIndex + displayData.length, finalTotalItems);

    // Check if sorting is enabled (at least one column is sortable)
    const isSortingEnabled = sortConfig !== null && onSort !== null;

    // Common styling
    const muiInputStyles = {
        width: 180,
        backgroundColor: 'white',
        '& .MuiOutlinedInput-root': {
            borderRadius: '6px',
            color: 'inherit',
            '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover fieldset': {
                borderColor: 'var(--color-primary-500, #3b82f6)',
            },
            '&.Mui-focused fieldset': {
                borderColor: 'var(--color-primary-500, #3b82f6)',
                borderWidth: '2px',
            },
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: 'var(--color-primary-600, #2563eb)',
        }
    };

    return (
        <div className="py-6 bg-gray-50 min-h-screen font-sans text-secondary-600">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 px-2">

                {/* Dynamic Filters */}
                <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
                    {filters.map((filter, index) => (
                        <div key={index}>
                            {/* CASE 1: SELECT DROPDOWN */}
                            {filter.type === 'select' ? (
                                <TextField
                                    select
                                    variant="outlined"
                                    size="small"
                                    label={filter.label}
                                    value={filterValues[filter.key] || ''}
                                    onChange={(e) => handleFilterInput(filter.key, e.target.value)}
                                    sx={muiInputStyles}
                                    className="text-secondary-600"
                                >
                                    <MenuItem value="">
                                        <span className="text-gray-400">All</span>
                                    </MenuItem>
                                    {filter?.options?.map((opt, i) => (
                                        <MenuItem key={i} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                /* CASE 2: NUMBER INPUT (Added this block) */
                            ) : filter.type === 'number' ? (
                                <TextField
                                    type="number"
                                    variant="outlined"
                                    size="small"
                                    label={filter.label}
                                    value={filterValues[filter.key] || ''}
                                    onChange={(e) => handleFilterInput(filter.key, e.target.value)}
                                    sx={muiInputStyles}
                                    className="text-secondary-600"
                                    // Optional: Pass min/max/step if defined in your filter config
                                    InputProps={{
                                        inputProps: {
                                            min: filter.min,
                                            max: filter.max,
                                            step: filter.step || "any"
                                        }
                                    }}
                                />

                                /* CASE 3: TEXT INPUT (Default) */
                            ) : (
                                <TextField
                                    variant="outlined"
                                    size="small"
                                    label={filter.label}
                                    value={filterValues[filter.key] || ''}
                                    onChange={(e) => handleFilterInput(filter.key, e.target.value)}
                                    sx={muiInputStyles}
                                    className="text-secondary-600"
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Global Search & Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={handleSearch}
                        sx={{
                            ...muiInputStyles,
                            width: { xs: '100%', md: 280 }
                        }}
                        className="text-secondary-600"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} className="text-gray-400" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {topActions.map((action, index) => (

                        <button
                            key={index}
                            onClick={action.onClick}
                            className={`px-4 py-2 rounded-md font-medium transition-all h-10 ${
                                action.type === 'primary'
                                    ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg'
                                    : 'border border-primary-500 text-primary-600 hover:bg-primary-50'
                            }`}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Structure */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mx-2">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-primary-50 text-secondary-600 font-semibold text-sm">
                        <tr>
                            {columns.map((col, index) => (
                                <React.Fragment key={index}>
                                    {/* Use SortableTableHeader if column is sortable AND sorting is enabled */}
                                    {col.sortable && isSortingEnabled ? (
                                        <SortableTableHeader
                                            label={col.header}
                                            sortKey={col.sortKey}
                                            currentSortKey={sortConfig?.key}
                                            currentSortOrder={sortConfig?.order}
                                            onSort={onSort}
                                            align={col.align || 'left'}
                                        />
                                    ) : (
                                        <th
                                            className={`px-6 py-4 ${
                                                col.align === 'center'
                                                    ? 'text-center'
                                                    : col.align === 'right'
                                                        ? 'text-right'
                                                        : 'text-left'
                                            }`}
                                        >
                                            {col.header}
                                        </th>
                                    )}
                                </React.Fragment>

                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                        {displayData.length > 0 ? (
                            displayData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-primary-25 transition-colors">
                                    {columns.map((col, colIndex) => (
                                        <td
                                            key={colIndex}
                                            className={`px-6 py-4 ${
                                                col.align === 'center'
                                                    ? 'text-center'
                                                    : col.align === 'right'
                                                        ? 'text-right'
                                                        : 'text-left'
                                            }`}
                                        >
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (

                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="text-center py-10 text-gray-500"
                                >
                                    No data found matching your filters.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {finalTotalItems > 0 && (
                    <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 gap-4">
                        <span className="text-sm text-gray-500">
                            Showing {startRange}-{endRange} of {finalTotalItems}
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 disabled:text-gray-300 hover:bg-gray-100 rounded transition-colors disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (

                                <button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    className={`w-8 h-8 rounded-full text-sm transition-all ${
                                        currentPage === page
                                            ? 'bg-primary-500 text-white shadow-md'
                                            : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-600'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}


                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainTable;
