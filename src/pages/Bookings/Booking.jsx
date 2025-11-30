import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useBookings, useBookingAnalytics } from '../../hooks/useBookings';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import {
    Clock, MapPin, DollarSign,
    CheckCircle, XCircle, ArrowLeft
} from 'lucide-react';

// Import your reusable components
import MainTable from '../../components/MainTable';
import BookingDetailView from "./BookingDetailView.jsx";
import ArrowIcon from "../../components/common/ArrowIcon.jsx";

// Main Bookings Component with Server-Side Sorting
const Bookings = () => {
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        order: 'asc'
    });
    const [filters, setFilters] = useState({});

    const itemsPerPage = 10;

    // Build API filters with pagination and sorting
    const apiFilters = {
        page: currentPage,
        page_limit: itemsPerPage,
        ...filters,
        // Add ordering parameter for server-side sorting
        ...(sortConfig.key && {
            ordering: getOrderingParam(sortConfig.key, sortConfig.order)
        })
    };

    // Debug: Log API filters whenever they change
    useEffect(() => {
        console.log('🔍 API Filters:', apiFilters);
    }, [JSON.stringify(apiFilters)]);

    // Fetch bookings with filters
    const { bookings, isLoading, error, refetch } = useBookings(apiFilters);

    // Fetch analytics for stats cards
    const { analytics, isLoading: analyticsLoading } = useBookingAnalytics();

    useEffect(() => {
        dispatch(setPageTitle('Bookings'));
    }, [dispatch]);

    // Convert our sort keys to API ordering field names
    function getOrderingParam(key, order) {
        const orderingMap = {
            'name': 'pitch__translations__name',
            'id': 'id',
            'customer': 'user_info__name',
            'status': 'status',
            'amount': 'total_price',
            'created_at': 'created_at'
        };

        const field = orderingMap[key] || key;
        return order === 'desc' ? `-${field}` : field;
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
            confirmed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
        };

        const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon size={14} />
                {status}
            </span>
        );
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setViewMode('detail');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedBooking(null);
    };

    // Server-side sorting - just update sort config, API will handle it
    const handleSort = (key) => {
        console.log('🔄 Sort clicked:', key);
        let order = 'asc';

        if (sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }

        setSortConfig({ key, order });
        setCurrentPage(1); // Reset to first page when sorting
    };


    const columns = [
        {
            header: 'Pitch Name',
            accessor: 'pitch',
            sortable: true,
            sortKey: 'name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {row.pitch?.image ? (
                        <img
                            src={row.pitch.image}
                            alt="Pitch"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <MapPin size={18} className="text-teal-600" />
                        </div>
                    )}
                    <span className="font-medium text-gray-900">
                        {row.pitch?.translations?.name || 'Pitch ' + row.id}
                    </span>
                </div>
            )
        },
        {
            header: 'ID',
            accessor: 'id',
            sortable: true,
            sortKey: 'id',
            render: (row) => (
                <span className="font-mono text-xs text-gray-500">
                    VN{String(row.id).padStart(5, '0')}
                </span>
            )
        },
        {
            header: 'Customer',
            accessor: 'user_info',
            sortable: true,
            sortKey: 'customer',
            render: (row) => (
                <span className="text-gray-900">{row.user_info?.name || 'Unknown'}</span>
            )
        },
        {
            header: 'Payment type',
            accessor: 'split_payment',
            sortable: false,
            render: (row) => (
                <span className="text-gray-600">{row.split_payment ? 'Split' : 'Solo'}</span>
            )
        },
        {
            header: 'Date added',
            accessor: 'created_at',
            sortable: true,
            sortKey: 'created_at',
            render: (row) => (
                <span className="text-gray-600">{formatDateTime(row.created_at)}</span>
            )
        },
        {
            header: 'Amount',
            accessor: 'total_price',
            sortable: true,
            sortKey: 'amount',
            render: (row) => (
                <span className="font-medium text-gray-900">
                    {parseFloat(row.total_price || 0).toFixed(0)} AED
                </span>
            )
        },
        {
            header: 'STATUS',
            accessor: 'status',
            sortable: true,
            sortKey: 'status',
            render: (row) => getStatusBadge(row.status)
        },
        {
            header: '',
            accessor: 'actions',
            align: 'center',
            sortable: false,
            render: (row) => (
                <button
                    onClick={() => handleViewBooking(row)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="View booking details"
                >
                    <ArrowLeft size={18} className="rotate-180" />
                    {/*<ArrowIcon direction="right" size="md" />*/}

                </button>
            )
        }
    ];

    const handleSearch = (searchTerm) => {
        console.log('🔎 Search term:', searchTerm);
        setFilters(prev => ({ ...prev, search: searchTerm }));
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters) => {
        console.log('🎯 Filter changed:', newFilters);
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        console.log('📄 Page changed to:', page);
        setCurrentPage(page);
    };

    const handleRefresh = () => {
        console.log('🔄 Refreshing data...');
        refetch();
    };

    // Server returns paginated data directly - no client-side sorting needed
    const bookingData = bookings?.results || [];

    // Debug: Log data received
    useEffect(() => {
        if (bookings) {
            console.log('📊 Bookings received:', {
                count: bookings.count,
                results: bookings.results?.length,
                page: currentPage
            });
        }
    }, [bookings]);

// Get analytics data with fallback values
    const cardAnalytics = analytics?.cardAnalytics || {};

// Map API fields to what we need
    const confirmedCount = cardAnalytics.complete_booking || 0;  // "Confirmed" = completed bookings
    const cancelledCount = cardAnalytics.cancelled_bookings || 0;
    const paidCount = cardAnalytics.complete_booking || 0;       // Paid = completed bookings

// Calculate pending from total bookings (since API doesn't provide it)
    const totalItems = bookings?.count || 0;
    const pendingCount = totalItems - confirmedCount - cancelledCount;

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">Error loading bookings</p>
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-2 text-sm underline hover:no-underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // Show detail view if a booking is selected
    if (viewMode === 'detail' && selectedBooking) {
        return (
            <BookingDetailView
                booking={selectedBooking}
                onBack={handleBackToList}
                onRefresh={handleRefresh}
            />
        );
    }

    // Show list view
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Stats Cards */}
            <div className="px-4 pb-0">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl: gap-8 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {analyticsLoading ? '...' : confirmedCount}
                                </div>
                                <div className="text-sm text-gray-500">Confirmed</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Clock className="text-yellow-600" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {analyticsLoading ? '...' : pendingCount}
                                </div>
                                <div className="text-sm text-gray-500">Pending</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <XCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {analyticsLoading ? '...' : cancelledCount}
                                </div>
                                <div className="text-sm text-gray-500">Cancelled</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {analyticsLoading ? '...' : paidCount}
                                </div>
                                <div className="text-sm text-gray-500">Paid</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


<h1 className={'px-8 text-primary-700 lg:-mb-14 lg:text-xl lg:mt-8 font-bold'}>Bookings list</h1>
            <MainTable
                columns={columns}
                data={bookingData}
                searchPlaceholder="Search player, ID, venue, etc"
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                onPageChange={handlePageChange}
                sortConfig={sortConfig}
                onSort={handleSort}
            />
        </div>
    );
};

export default Bookings;