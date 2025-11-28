import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const MainTable = ({
                       columns = [],
                       data = [],
                       searchPlaceholder = "Search...",
                       filters = [],
                       currentPage = 1,
                       itemsPerPage = 10,
                       // Use data length if totalItems not explicitly passed
                       totalItems,
                       onSearch,
                       onFilterChange,
                       onPageChange,
                       topActions = []
                   }) => {

    const [searchTerm, setSearchTerm] = useState('');
    const [filterValues, setFilterValues] = useState({});

    // Handle Global Search
    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (onSearch) onSearch(val);
    };

    // Handle Specific Filters (Text or Select)
    const handleFilterInput = (key, value) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        if (onFilterChange) onFilterChange(newFilters);
    };

    // Pagination Calculations
    const finalTotalItems = totalItems !== undefined ? totalItems : data.length;
    const totalPages = Math.ceil(finalTotalItems / itemsPerPage);

    // Slicing Data for the current page
    // If data passed is already sliced (server-side), this logic might differ,
    // but for Client-Side filtering, we slice here:
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayData = data.length > itemsPerPage
        ? data.slice(startIndex, endIndex)
        : data;

    const startRange = finalTotalItems === 0 ? 0 : startIndex + 1;
    const endRange = Math.min(startIndex + itemsPerPage, finalTotalItems);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">

                {/* Dynamic Filters */}
                <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
                    {filters.map((filter, index) => (
                        <div key={index}>
                            {filter.type === 'text' ? (
                                <input
                                    type="text"
                                    placeholder={filter.label}
                                    className="border border-teal-500 text-teal-800 placeholder-teal-600 px-4 py-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 text-sm w-40"
                                    onChange={(e) => handleFilterInput(filter.key, e.target.value)}
                                />
                            ) : (
                                <div className="relative">
                                    <select
                                        className="appearance-none border border-teal-500 text-teal-800 px-4 py-2 pr-8 rounded bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 text-sm cursor-pointer"
                                        onChange={(e) => handleFilterInput(filter.key, e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled hidden>{filter.label}</option>
                                        <option value="all">All</option>
                                        {filter.options.map((opt, i) => (
                                            <option key={i} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-700 pointer-events-none" size={16} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Global Search & Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-64"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    {topActions.map((action, index) => (
                        <button key={index} onClick={action.onClick} className={`px-4 py-2 rounded-md font-medium ${action.type === 'primary' ? 'bg-teal-700 text-white' : 'border border-teal-600 text-teal-700'}`}>
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-900 font-semibold text-sm">
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index} className={`px-6 py-4 ${col.align === 'center' ? 'text-center' : 'text-left'}`}>{col.header}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                        {displayData.length > 0 ? (
                            displayData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50">
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className={`px-6 py-4 ${col.align === 'center' ? 'text-center' : 'text-left'}`}>
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={columns.length} className="text-center py-10 text-gray-500">No data found matching your filters.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {finalTotalItems > 0 && (
                    <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-t border-gray-100">
                        <span className="text-sm text-gray-500">Showing {startRange}-{endRange} of {finalTotalItems}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 disabled:text-gray-300"><ChevronLeft size={18} /></button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} onClick={() => onPageChange(page)} className={`w-8 h-8 rounded-full text-sm ${currentPage === page ? 'bg-teal-700 text-white' : 'hover:bg-gray-100'}`}>{page}</button>
                            ))}
                            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 disabled:text-gray-300"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainTable;