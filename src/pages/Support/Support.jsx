import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import { supportService } from '../../services/support/supportService.js';
import MainTable from '../../components/MainTable.jsx';
import { showConfirm } from '../../components/showConfirm.jsx';
import {
    MoreVertical,
    CheckCircle,
    Clock,
    Trash2,
    MoreHorizontal,
    Loader,
    HelpCircle
} from 'lucide-react';
import { Menu, MenuItem, IconButton, ListItemIcon, ListItemText } from '@mui/material';

const Support = () => {
    const dispatch = useDispatch();

    // API Data State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [serverTotalItems, setServerTotalItems] = useState(0);

    // Local State
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Action Menu State
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const itemsPerPage = 10;

    useEffect(() => {
        dispatch(setPageTitle('Support Requests'));
    }, [dispatch]);

    useEffect(() => {
        fetchSupportRequests();
    }, [currentPage]);

    /**
     * Fetch Data
     */
    const fetchSupportRequests = async () => {
        setLoading(true);
        try {
            // Note: To show accurate stats for ALL data while using frontend filtering,
            // you might need to fetch all records (e.g., page_size=1000) or use a specific stats endpoint.
            // For now, this calculates stats based on the currently loaded page data.
            const params = { page: currentPage };

            const response = await supportService.getAll(params);

            if (response.status) {
                setData(response.results || []);
                setServerTotalItems(response.count || 0);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Calculate Statistics
     */
    const stats = useMemo(() => {
        // If you are fetching paginated data, these numbers apply to the *current page*.
        // Ideally, the backend should provide a summary object.
        return {
            total: serverTotalItems, // Total from server count
            pending: data.filter(item => item.status === 'pending').length,
            inProgress: data.filter(item => item.status === 'in_progress').length,
            resolved: data.filter(item => item.status === 'resolved').length
        };
    }, [data, serverTotalItems]);

    /**
     * Frontend Filtering Logic
     */
    const filteredData = useMemo(() => {
        let result = data;

        if (activeFilters.status && activeFilters.status !== 'all') {
            result = result.filter(item => item.status === activeFilters.status);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(item =>
                (item.title && item.title.toLowerCase().includes(lowerTerm)) ||
                (item.description && item.description.toLowerCase().includes(lowerTerm)) ||
                (item.user_info?.name && item.user_info.name.toLowerCase().includes(lowerTerm)) ||
                (item.user_info?.phone && item.user_info.phone.includes(lowerTerm))
            );
        }

        return result;
    }, [data, activeFilters, searchTerm]);

    // --- Handlers ---
    const handleFilterChange = (newFilters) => setActiveFilters(newFilters);
    const handleSearch = (term) => setSearchTerm(term);

    const handleMenuOpen = (event, row) => {
        setAnchorEl(event.currentTarget);
        setSelectedRequest(row);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedRequest(null);
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!selectedRequest) return;
        handleMenuClose();
        const formattedStatus = newStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

        const isConfirmed = await showConfirm({
            title: `Mark as ${formattedStatus}?`,
            text: `Change status of request #${selectedRequest.id} to ${formattedStatus}?`,
            confirmButtonText: 'Yes, Update it'
        });

        if (!isConfirmed) return;

        try {
            setData(prevData => prevData.map(item =>
                item.id === selectedRequest.id ? { ...item, status: newStatus } : item
            ));
            await supportService.update(selectedRequest.id, { ...selectedRequest, status: newStatus });
        } catch (error) {
            fetchSupportRequests();
        }
    };

    const handleDelete = async () => {
        if (!selectedRequest) return;
        handleMenuClose();

        const isConfirmed = await showConfirm({
            title: `Delete Request #${selectedRequest.id}?`,
            text: "This action cannot be undone.",
            confirmButtonText: 'Yes, Delete it'
        });

        if (!isConfirmed) return;

        try {
            await supportService.delete(selectedRequest.id);
            setData(prev => prev.filter(item => item.id !== selectedRequest.id));
            setServerTotalItems(prev => prev - 1);
        } catch (error) {
            fetchSupportRequests();
        }
    };

    // --- Components ---

    // Responsive Stat Card (Matched Design)
    const StatCard = ({ title, value, icon, gradient, bgColor }) => (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 ${bgColor} rounded-lg sm:rounded-xl`}>
                    {React.cloneElement(icon, { className: "w-5 h-5 sm:w-7 sm:h-7" })}
                </div>
                <div className={`w-12 sm:w-16 h-1 bg-gradient-to-r ${gradient} rounded-full`}></div>
            </div>
            <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">{title}</p>
                <p className="text-2xl sm:text-4xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );

    const renderStatusBadge = (status) => {
        let styles = '';
        let icon = null;
        let label = '';
        switch (status) {
            case 'resolved':
                styles = 'border-green-600 text-green-700 bg-white';
                icon = <CheckCircle size={14} className="mr-1.5" />;
                label = 'Resolved';
                break;
            case 'in_progress':
                styles = 'border-blue-500 text-blue-600 bg-white';
                icon = <Clock size={14} className="mr-1.5" />;
                label = 'In Progress';
                break;
            case 'pending':
            default:
                styles = 'border-orange-500  text-orange-600 bg-white';
                icon = <MoreHorizontal size={14} className="mr-1.5" />;
                label = 'Pending';
                break;
        }
        return (
            <div className={`flex items-center w-fit px-3 py-1 rounded-full border ${styles}`}>
                {icon}
                <span className="text-xs font-semibold">{label}</span>
            </div>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'numeric', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
        });
    };

    // --- Configs ---
    const filterConfig = [
        {
            key: 'status',
            label: 'Filter by Status',
            type: 'select',
            options: [
                { label: 'All', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Resolved', value: 'resolved' }
            ]
        }
    ];

    const columns = [
        { header: 'Sr.No', accessor: 'id', render: (row, index) => <span className="text-gray-900 font-medium">{index+1}</span> },
        { header: 'Name', accessor: 'user_info', render: (row) => <span className="text-gray-700">{row.user_info?.name || 'Unknown'}</span> },
        { header: 'Phone Number', accessor: 'user_info', render: (row) => <span className="text-gray-700">{row.user_info?.phone || '-'}</span> },
        { header: 'Title', accessor: 'title', render: (row) => <span className="text-gray-700">{row.title}</span> },
        { header: 'Message', accessor: 'description', render: (row) => <span className="text-gray-500 text-sm truncate max-w-xs block" title={row.description}>{row.description}</span> },
        { header: 'Date/Time', accessor: 'created_at', render: (row) => <span className="text-gray-500 text-sm">{formatDate(row.created_at)}</span> },
        { header: 'Status', accessor: 'status', render: (row) => renderStatusBadge(row.status) },
        {
            header: 'Actions', align: 'right', render: (row) => (
                <IconButton onClick={(e) => handleMenuOpen(e, row)} size="small" className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={20} />
                </IconButton>
            )
        }
    ];

    return (
        <div className="w-full px-2 sm:px-4 py-4">

            {/* Statistics Section - Matches Design */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
                <StatCard
                    title="Total Requests"
                    value={stats.total}
                    icon={<HelpCircle className="text-slate-600" />}
                    gradient="from-slate-500 to-slate-600"
                    bgColor="bg-slate-100"
                />
                <StatCard
                    title="Pending"
                    value={stats.pending}
                    icon={<MoreHorizontal className="text-orange-600" />}
                    gradient="from-orange-500 to-orange-600"
                    bgColor="bg-orange-50"
                />
                <StatCard
                    title="In Progress"
                    value={stats.inProgress}
                    icon={<Clock className="text-blue-600" />}
                    gradient="from-blue-500 to-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="Resolved"
                    value={stats.resolved}
                    icon={<CheckCircle className="text-green-600" />}
                    gradient="from-green-500 to-green-600"
                    bgColor="bg-green-50"
                />
            </div>

            {/* Main Table */}
            <MainTable
                data={filteredData}
                columns={columns}
                totalItems={serverTotalItems}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
                searchPlaceholder="Search support request, name..."
                onSearch={handleSearch}
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                topActions={[]}
            />

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    style: { boxShadow: '0px 4px 20px rgba(0,0,0,0.1)', borderRadius: '8px', minWidth: '160px', marginTop: '5px' },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => handleStatusUpdate('pending')}>
                    <ListItemIcon><MoreHorizontal size={16} /></ListItemIcon>
                    <ListItemText primary="Pending" primaryTypographyProps={{ fontSize: '14px' }} />
                </MenuItem>
                <MenuItem onClick={() => handleStatusUpdate('in_progress')}>
                    <ListItemIcon><Loader size={16} /></ListItemIcon>
                    <ListItemText primary="In Progress" primaryTypographyProps={{ fontSize: '14px' }} />
                </MenuItem>
                <MenuItem onClick={() => handleStatusUpdate('resolved')}>
                    <ListItemIcon><CheckCircle size={16} /></ListItemIcon>
                    <ListItemText primary="Resolved" primaryTypographyProps={{ fontSize: '14px' }} />
                </MenuItem>
                <div className="my-1 border-t border-gray-100"></div>
                <MenuItem onClick={handleDelete} className="text-red-600 hover:bg-red-50">
                    <ListItemIcon><Trash2 size={16} className="text-red-600" /></ListItemIcon>
                    <ListItemText primary="Delete" primaryTypographyProps={{ fontSize: '14px', className: "text-red-600 font-medium" }} />
                </MenuItem>
            </Menu>

            {loading && (
                <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

export default Support;