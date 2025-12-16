import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next'; // Add this import
import { useBookings } from '../../hooks/useBookings';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice';
import {
    Clock, MapPin, DollarSign,
    CheckCircle, XCircle, ArrowLeft,
    Users, Calendar, CreditCard
} from 'lucide-react';
import MainTable from '../../components/MainTable';
import BookingDetailView from "./BookingDetailView.jsx";
import StatCard from '../../components/Charts/StatCards.jsx';
import { useNavigate } from "react-router-dom";
import { getImageUrl } from '../../utils/imageUtils.js';

const Bookings = () => {
    const dispatch = useDispatch();
    const { t, i18n } = useTranslation('booking'); // Add this
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        order: 'asc'
    });
    const [filters, setFilters] = useState({});
    const itemsPerPage = 10;
    const apiFilters = {
        page: currentPage,
        page_limit: itemsPerPage,
        ...filters,
        ...(sortConfig.key && {
            ordering: getOrderingParam(sortConfig.key, sortConfig.order)
        })
    };

    const { bookings, isLoading, error, refetch } = useBookings(apiFilters);
    const navigate = useNavigate();
    // title
    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);

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
                {t(`status.${status?.toLowerCase()}`) || status}
            </span>
        );
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewBooking = (booking) => {
        navigate('/bookings/book-details', {
            state: {
                booking,
                from: '/bookings'
            }
        });
    };
    const handleViewCustomer = (player) => {
        navigate('/players/player-profile', {
            state: {
                player,
                from: '/bookings'            }
        });
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedBooking(null);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }
        setSortConfig({ key, order });
        setCurrentPage(1);
    };

    const handleImageError = (e, fallbackContent) => {
        e.target.style.display = 'none';
        if (fallbackContent) {
            e.target.parentElement.innerHTML = fallbackContent;
        }
    };

    const columns = [
        {
            header: t('table.pitchName'),
            accessor: 'pitch',
            sortable: true,
            sortKey: 'name',
            render: (row) => {
                const imageUrl = getImageUrl(row.pitch?.image);
                return (
                    <div
                        onClick={() => handleViewBooking(row)}
                        className="flex cursor-pointer items-center gap-3"
                    >
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={row.pitch?.translations?.name || t('table.pitch')}
                                className="w-10 h-10 rounded-full object-cover  "
                                onError={(e) => handleImageError(
                                    e,
                                    `<div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                                        <MapPin size="18" class="text-teal-600" />
                                    </div>`
                                )}
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                                <MapPin size={18} className="text-teal-600" />
                            </div>
                        )}
                        <span className="font-medium text-gray-900">
                            {row.pitch?.translations?.name || t('table.pitch') + ' ' + row.id}
                        </span>
                    </div>
                );
            }
        },
        {
            header: t('table.id'),
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
            header: t('table.customer'),
            accessor: 'user_info',
            sortable: true,
            sortKey: 'customer',
            render: (row) => {
                const userImageUrl = getImageUrl(row.user_info?.image);
                return (
                    <div                        onClick={() => handleViewCustomer(row.user_info)} className="flex cursor-pointer items-center gap-2">
                        {userImageUrl ? (
                            <img
                                src={userImageUrl}
                                alt={row.user_info?.name || t('table.customer')}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML =
                                        `<div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                            <span class="text-xs text-gray-600">
                                                ${row.user_info?.name?.charAt(0) || 'U'}
                                            </span>
                                        </div>`;
                                }}
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs text-gray-600">
                                    {row.user_info?.name?.charAt(0) || 'U'}
                                </span>
                            </div>
                        )}
                        <span className="text-gray-900">{row.user_info?.name || t('table.unknown')}</span>
                    </div>
                );
            }
        },
        {
            header: t('table.paymentType'),
            accessor: 'split_payment',
            sortable: false,
            render: (row) => (
                <span className="text-gray-600">
                    {row.split_payment ? t('paymentTypes.split') : t('paymentTypes.solo')}
                </span>
            )
        },
        {
            header: t('table.dateAdded'),
            accessor: 'created_at',
            sortable: true,
            sortKey: 'created_at',
            render: (row) => (
                <span className="text-gray-600">{formatDateTime(row.created_at)}</span>
            )
        },
        {
            header: t('table.amount'),
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
            header: t('table.status'),
            accessor: 'status',
            sortable: true,
            sortKey: 'status',
            render: (row) => getStatusBadge(row.status)
        },
        {
            header: t('table.actions'),
            accessor: 'actions',
            align: 'center',
            sortable: false,
            render: (row) => (
                <button
                    onClick={() => handleViewBooking(row)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={t('details.view')}
                >
                    <ArrowLeft size={18} className="rotate-180" />
                </button>
            )
        }
    ];

    const handleSearch = (searchTerm) => {
        setFilters(prev => ({ ...prev, search: searchTerm }));
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleRefresh = () => {
        refetch();
    };

    const bookingData = bookings?.results || [];
    const confirmedCount = bookings?.confirmed || 0;
    const cancelledCount = bookings?.cancelled || 0;
    const totalItems = bookings?.count || 0;
    const pendingCount = bookings?.pending || 0;

    // Prepare stats for StatCard components
    const bookingStats = [
        {
            title: t('stats.confirmed'),
            value: confirmedCount,
            percentChange: 12,
            icon: CheckCircle,
            iconColor: 'text-green-600'
        },
        {
            title: t('stats.pending'),
            value: pendingCount,
            percentChange: -5,
            icon: Clock,
            iconColor: 'text-yellow-600'
        },
        {
            title: t('stats.cancelled'),
            value: cancelledCount,
            percentChange: 8,
            icon: XCircle,
            iconColor: 'text-red-600'
        },
        {
            title: t('stats.total'),
            value: totalItems,
            percentChange: 18,
            icon: DollarSign,
            iconColor: 'text-blue-600'
        }
    ];

    // Filter configuration
    const filterConfig = [
        {
            key: 'status',
            label: t('filters.label'),
            type: 'select',
            options: [
                { label: t('filters.all'), value: 'all' },
                { label: t('filters.pending'), value: 'pending' },
                { label: t('filters.confirmed'), value: 'confirmed' },
                { label: t('filters.completed'), value: 'completed' },
                { label: t('filters.cancelled'), value: 'cancelled' }
            ],
            value: filters.status || 'all'
        }
    ];

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">{t('errors.loading')}</p>
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-2 text-sm underline hover:no-underline"
                    >
                        {t('errors.tryAgain')}
                    </button>
                </div>
            </div>
        );
    }

    if (viewMode === 'detail' && selectedBooking) {
        return (
            <BookingDetailView
                booking={selectedBooking}
                onBack={handleBackToList}
                onRefresh={handleRefresh}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Stats Cards */}
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

            <div className={'py-5'}>
                <h1 className="px-8 text-primary-700 lg:-mb-10 lg:text-xl lg:mt-8 font-bold">
                    {t('listTitle')}
                </h1>

                <MainTable
                    columns={columns}
                    data={bookingData}
                    searchPlaceholder={t('searchPlaceholder')}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onSearch={handleSearch}
                    filters={filterConfig}
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