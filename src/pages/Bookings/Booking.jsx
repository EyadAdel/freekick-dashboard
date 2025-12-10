import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useBookings} from '../../hooks/useBookings';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import {
    Clock, MapPin, DollarSign,
    CheckCircle, XCircle, ArrowLeft,
    Users, Calendar, CreditCard
} from 'lucide-react';

// Import your reusable components
import MainTable from '../../components/MainTable';
import BookingDetailView from "./BookingDetailView.jsx";
import StatCard from '../../components/Charts/StatCards.jsx';
import {useNavigate} from "react-router-dom"; // Import your reusable StatCard
import  {IMAGE_BASE_URL} from '../../utils/ImageBaseURL.js'
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
        ...(sortConfig.key && {
            ordering: getOrderingParam(sortConfig.key, sortConfig.order)
        })
    };

    // Fetch bookings with filters
    const { bookings, isLoading, error, refetch } = useBookings(apiFilters);
 const navigate =useNavigate()


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

    // const handleViewBooking = (booking) => {
    //     setSelectedBooking(booking);
    //     setViewMode('detail');
    // };
    const handleViewBooking = (booking) => {
        // Navigate with booking data in state
        navigate('/bookings/book-details', {
            state: {
                booking,
                from: '/bookings'
            }
        });
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
                <div                     onClick={() => handleViewBooking(row)}
                                         className="flex cursor-pointer items-center gap-3">
                    {row.pitch?.image ? (
                        <img
                            src={IMAGE_BASE_URL + row.pitch.image}
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

    const confirmedCount = bookings?.confirmed || 0;
    const cancelledCount = bookings?.cancelled || 0;

    const totalItems = bookings?.count || 0;
    const pendingCount = bookings?.pending || 0

    // Prepare stats for StatCard components
    const bookingStats = [
        {
            title: 'Confirmed',
            value: confirmedCount,
            percentChange: 12,
            icon: CheckCircle,
            iconColor: 'text-green-600'
        },
        {
            title: 'Pending',
            value: pendingCount,
            percentChange: -5,
            icon: Clock,
            iconColor: 'text-yellow-600'
        },
        {
            title: 'Cancelled',
            value: cancelledCount,
            percentChange: 8,
            icon: XCircle,
            iconColor: 'text-red-600'
        },
        {
            title: 'Total ',
            value: totalItems,
            percentChange: 18,
            icon: DollarSign,
            iconColor: 'text-blue-600'
        }
    ];


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
                {/* Main Stats Row */}
                <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2 xl:gap-8 mb-6">
                    {bookingStats.map((stat, index) => (
                        <StatCard
                            key={index}
                            title={stat.title}
                            value={stat.value}
                            percentChange={stat.percentChange}
                            icon={stat.icon}
                            iconColor={stat.iconColor}
                        />
                    ))}
                </div>


         <div  className={'py-5'}>
            <h1 className="px-8 text-primary-700 lg:-mb-10 lg:text-xl lg:mt-8 font-bold">
                Bookings list
            </h1>

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
                isLoading={isLoading}
            />
         </div>
        </div>
    );
};

export default Bookings;