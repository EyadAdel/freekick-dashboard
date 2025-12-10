import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MainTable from './../../components/MainTable';
import StatCard from './../../components/Charts/StatCards.jsx';
import { venuesEditRequestsService } from '../../services/venuesEditRequests/venuesEditRequestsService.js';
import { showConfirm } from '../../components/showConfirm';
import { toast } from 'react-toastify';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import { IMAGE_BASE_URL } from '../../utils/ImageBaseURL.js';

import {
    Eye,
    CheckCircle,
    XCircle,
    MapPin,
    FileText,
    Calendar,
    Clock,
    Phone,
    Mail,
    Check
} from 'lucide-react';

// --- HELPER COMPONENT: VENUE AVATAR ---
const VenueAvatar = ({ images, name }) => {
    // Attempt to get the first image filename from the array
    const imageFilename = images && images.length > 0 ? images[0].image : null;

    const imageSrc = imageFilename ? `${IMAGE_BASE_URL}${imageFilename}` : null;

    if (imageSrc) {
        return (
            <div className="w-12 h-12 min-w-[48px] rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <img
                    src={imageSrc}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>
        );
    }

    // Fallback if no image
    return (
        <div className="w-12 h-12 min-w-[48px] rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 border border-indigo-100">
            <FileText size={20} />
        </div>
    );
};

// --- HELPER COMPONENT: TYPE BADGE ---
const TypeBadge = ({ type }) => {
    const isIndoor = type === 'indoor';
    const style = isIndoor
        ? 'bg-purple-100 text-purple-800 border border-purple-200'
        : 'bg-orange-100 text-orange-800 border border-orange-200';

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${style}`}>
            {type}
        </span>
    );
};

// --- MAIN COMPONENT ---
const VenueEditRequests = () => {
    const rowsPerPage = 10;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle('Venues Update Requests'));
    }, [dispatch]);

    // --- STATE MANAGEMENT ---
    const [requestsData, setRequestsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Filter State
    const [activeFilters, setActiveFilters] = useState({
        search: ''
    });

    // --- FETCH DATA ---
    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await venuesEditRequestsService.getAllRequests({
                page: currentPage
            });

            if (response && response.results) {
                setRequestsData(response.results);
                setTotalCount(response.count);
            } else if (Array.isArray(response)) {
                setRequestsData(response);
                setTotalCount(response.length);
            } else {
                setRequestsData([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error("Failed to fetch requests:", error);
            toast.error("Failed to load requests");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [currentPage]);

    // --- HANDLERS ---

    // 1. View Details (UPDATED LOGIC HERE)
    const handleViewRequest = async (row) => {
        try {
            // Call the API to get the specific details
            const response = await venuesEditRequestsService.getRequestById(row.id);

            // Navigate and pass the FRESH response data
            navigate(`/venue-edit-requests/venue-request-details`, {
                state: { requestData: response }
            });
        } catch (error) {
            console.error("Error fetching request details:", error);
            // Error toast is already handled in venuesEditRequestsService
        }
    };

    // 2. Approve Request (Accept)
    const handleApprove = async (id, name) => {
        const isConfirmed = await showConfirm({
            title: `Approve updates for "${name}"?`,
            text: "This will apply the changes to the live venue.",
            confirmButtonText: 'Yes, Approve',
            icon: 'question'
        });

        if (!isConfirmed) return;

        try {
            await venuesEditRequestsService.acceptRequest(id);
            // Refresh the list to update the status to "Approved"
            fetchRequests();
        } catch (error) {
            // Error handling is done in the service (toast)
        }
    };

    // 3. Reject Request (Delete)
    const handleReject = async (id, name) => {
        const isConfirmed = await showConfirm({
            title: `Reject updates for "${name}"?`,
            text: "This request will be permanently deleted.",
            confirmButtonText: 'Yes, Reject',
            confirmButtonColor: '#d33'
        });

        if (!isConfirmed) return;

        try {
            await venuesEditRequestsService.deleteRequest(id);
            // Optimistically remove from the UI
            setRequestsData(prev => prev.filter(item => item.id !== id));
            setTotalCount(prev => prev - 1);
        } catch (error) {
            // Error handling is done in the service
        }
    };

    const handleSearch = (term) => {
        setActiveFilters(prev => ({ ...prev, search: term }));
        setCurrentPage(1);
    };

    // --- FILTERING ---
    const filteredData = useMemo(() => {
        if (!requestsData) return [];

        let filtered = requestsData;

        // Apply Search
        if (activeFilters.search) {
            const search = activeFilters.search.toLowerCase();
            filtered = filtered.filter((item) => {
                const name = (item.translations?.en?.name || '').toLowerCase();
                const contact = (item.contact_name || '').toLowerCase();
                const email = (item.email || '').toLowerCase();
                const city = (item.city || '').toLowerCase();

                return name.includes(search) ||
                    contact.includes(search) ||
                    email.includes(search) ||
                    city.includes(search);
            });
        }

        return filtered;
    }, [requestsData, activeFilters]);

    // --- STATS CALCULATION ---
    const stats = useMemo(() => {
        return {
            total: totalCount,
            // Calculate pending based on current page data (approximate for UI)
            pending: requestsData.filter(r => r.accepted !== true).length,
            approved: requestsData.filter(r => r.accepted === true).length
        };
    }, [totalCount, requestsData]);

    // --- TABLE COLUMNS ---
    const columns = [
        {
            header: 'ID',
            accessor: 'id',
            width: '60px',
            render: (row) => <span className="text-gray-500 text-xs">#{row.id}</span>
        },
        {
            header: 'Venues Info',
            accessor: 'name',
            width: '250px',
            render: (row) => {
                const name = row.translations?.en?.name || "Untitled Venues";
                const address = row.translations?.en?.address || "No Address";
                return (
                    <div className="flex items-start gap-3">
                        <VenueAvatar images={row.images_request} name={name} />
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-semibold text-sm line-clamp-1" title={name}>
                                {name}
                            </span>
                            <span className="text-gray-500 text-xs flex items-center gap-1 mt-0.5 line-clamp-1" title={address}>
                                <MapPin size={10} />
                                {address}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Contact',
            accessor: 'contact',
            render: (row) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                        <span className="capitalize">{row.contact_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone size={12} /> {row.phone_number}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail size={12} /> {row.email}
                    </div>
                </div>
            )
        },
        {
            header: 'Details',
            accessor: 'details',
            render: (row) => (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <TypeBadge type={row.venue_type} />
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {row.city}
                        </span>
                    </div>
                    <div className="text-xs font-mono text-gray-600">
                        <span className="font-bold text-gray-800">{parseFloat(row.price_per_hour).toFixed(0)}</span> AED/hr
                    </div>
                </div>
            )
        },
        {
            header: 'Submitted',
            accessor: 'created_at',
            render: (row) => {
                const dateObj = new Date(row.created_at);
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-gray-700 text-xs font-medium">
                            <Calendar size={12} />
                            {dateObj.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                            <Clock size={12} />
                            {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Actions',
            align: 'right',
            width: '180px', // Slightly wider for the text buttons
            render: (row) => {
                const name = row.translations?.en?.name;
                const isApproved = row.accepted === true;

                return (
                    <div className="flex justify-end items-center gap-2">
                        {/* Always show View Button */}
                        <button
                            onClick={() => handleViewRequest(row)}
                            className="text-gray-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            title="View Full Details"
                        >
                            <Eye size={18} />
                        </button>

                        {/* Logic: If accepted show Label, else show Buttons */}
                        {isApproved ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 select-none">
                                <CheckCircle size={14} />
                                <span className="text-xs font-semibold">Approved</span>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleApprove(row.id, name)}
                                    className="flex items-center justify-center gap-[2px] border border-green-200 text-green-600 hover:text-green-700 px-2 py-1 rounded-md bg-green-50 hover:bg-green-100 transition-colors text-xs font-medium"
                                    title="Approve Request"
                                >
                                    <Check size={14} strokeWidth={2.5} />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(row.id, name)}
                                    className="flex items-center justify-center gap-[2px] border border-red-200 text-red-600 hover:text-red-700 px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 transition-colors text-xs font-medium"
                                    title="Reject Request"
                                >
                                    <XCircle size={14} strokeWidth={2.5} />
                                    Reject
                                </button>
                            </>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="w-full px-2 sm:px-0">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 my-6">
                <StatCard
                    title="Total Requests"
                    value={stats.total}
                    icon={FileText}
                    iconColor="text-white"
                />
                <StatCard
                    title="Pending Action"
                    value={stats.pending}
                    icon={Clock}
                    iconColor="text-white"
                />
                <StatCard
                    title="Approved Requests"
                    value={stats.approved}
                    icon={CheckCircle}
                    iconColor="text-white"
                />
            </div>

            {/* Table Container */}
            <div className='bg-white rounded-lg shadow-sm'>
                {isLoading && requestsData.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">Loading Requests...</div>
                ) : (
                    <MainTable
                        data={filteredData}
                        columns={columns}
                        filters={[]}
                        searchPlaceholder="Search venue, contact, email..."
                        topActions={[]}
                        currentPage={currentPage}
                        totalItems={totalCount}
                        itemsPerPage={rowsPerPage}
                        onSearch={handleSearch}
                        onFilterChange={() => {}}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                )}
            </div>
        </div>
    );
};

export default VenueEditRequests;