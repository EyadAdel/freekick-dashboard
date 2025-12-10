import React, {useState, useMemo, useEffect} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ArrowIcon from "../../components/common/ArrowIcon.jsx";

import { pitchOwnersService } from '../../services/pitchOwners/pitchOwnersService.js';
import MainTable from "../../components/MainTable.jsx";
import AddActionModal from "../../components/pitchOwners/AddActionModal.jsx";
import {  useSelector } from 'react-redux';
import { useContact } from "../../hooks/useContact.js";
import {
    Calendar,
    Mail,
    MapPin,
    Phone,
    Shield,
    Clock,
    CheckCircle,
    XCircle,
    Activity,
    Globe,
    DollarSign,
    LayoutGrid,
    User,
    Plus,
    FileText,
    TrendingUp,
    TrendingDown,
    ListFilter,
    Percent,
    Wallet // <--- Imported Wallet Icon
} from "lucide-react";

// ============================================================================
// HELPERS
// ============================================================================
const formatDate = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatAmount = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 'AED 0';
    return `AED ${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
};

const getStatusBadge = (status) => {
    const statusConfig = {
        completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
        pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
        cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' }
    };
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
            {config.label}
        </span>
    );
};

// ============================================================================
// PITCH OWNER DETAIL VIEW
// ============================================================================
const PitchOwnerDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const { handleEmailClick, handleWhatsAppClick } = useContact();

    // 1. Retrieve Data
    const ownerData = location.state?.ownerData?.data || {};

    // State
    const [bookingStatus, setBookingStatus] = useState('all');
    const [currentPitchPage, setCurrentPitchPage] = useState(1);
    const pitchesPerPage = 5;

    // Staff Actions State
    const [actionsData, setActionsData] = useState([]);
    const [totalActions, setTotalActions] = useState(0);
    const [actionsTotalBalance, setActionsTotalBalance] = useState(0); // <--- New State for Global Total
    const [currentActionPage, setCurrentActionPage] = useState(1);
    const [loadingActions, setLoadingActions] = useState(false);
    const [actionsLimit, setActionsLimit] = useState(10);

    // Modal and Refresh State
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // 2. Filter Bookings Logic
    const filteredBookings = useMemo(() => {
        if (!ownerData.booking) return [];
        return ownerData.booking.filter(b => {
            return bookingStatus === 'all' || b.status === bookingStatus;
        });
    }, [ownerData.booking, bookingStatus]);

    // 3. Pagination for Pitches
    const paginatedPitches = useMemo(() => {
        const startIndex = (currentPitchPage - 1) * pitchesPerPage;
        return (ownerData.my_pitches || []).slice(startIndex, startIndex + pitchesPerPage);
    }, [ownerData.my_pitches, currentPitchPage]);

    // 4. Fetch Actions Effect
    useEffect(() => {
        if (!ownerData.id) return;
        const fetchActions = async () => {
            setLoadingActions(true);
            try {
                const response = await pitchOwnersService.getAllStaffActions(
                    ownerData.id,
                    currentActionPage,
                    actionsLimit
                );
                if (response && response.status) {
                    setActionsData(response.results);
                    setTotalActions(response.count);
                    // Set the global total balance from the API response
                    setActionsTotalBalance(response.total);
                }
            } catch (error) {
                console.error("Error fetching staff actions:", error);
            } finally {
                setLoadingActions(false);
            }
        };
        fetchActions();
    }, [ownerData.id, currentActionPage, actionsLimit, refreshTrigger]);

    // Early return
    if (!ownerData || !ownerData.id) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">No Pitch Owner data available.</p>
                    <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg">Go Back</button>
                </div>
            </div>
        );
    }

    // Table Configurations
    const pitchColumns = [
        { header: 'Pitch Code', accessor: 'id', align: 'left', render: (pitch) => <span className="text-sm font-semibold text-primary-600">{`P${pitch.id}`}</span> },
        { header: 'Pitch Name', accessor: 'translations.name', render: (pitch) => (
                <div className="flex items-center gap-3">
                    {pitch.image ? (
                        <img src={`https://pub-f8c5de66602c4f6f91311c6fd40e1794.r2.dev/${pitch.image}`} alt={pitch.translations.name} className="w-10 h-10 rounded-lg object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40"; }} />
                    ) : ( <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center"><LayoutGrid className="w-5 h-5 text-primary-600" /></div> )}
                    <div><p className="text-sm font-semibold text-gray-900">{pitch.translations?.name || 'Unknown'}</p><p className="text-xs text-gray-500">Size: {pitch.size}</p></div>
                </div>
            )},
        { header: 'Price / Hr', accessor: 'price_per_hour', align: 'center', render: (pitch) => <span className="text-sm font-semibold text-primary-600">{formatAmount(pitch.price_per_hour)}</span> },
        { header: 'Bookings', accessor: 'num_of_bookings', align: 'center', render: (pitch) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{pitch.num_of_bookings}</span> },
        { header: 'Status', accessor: 'is_active', align: 'center', render: (pitch) => <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${pitch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{pitch.is_active ? 'Active' : 'Inactive'}</span> }
    ];

    const actionColumns = [
        { header: 'SR.No', accessor: 'id', align: 'left', render: (row, index) => <span className="text-gray-500">{index + 1}</span> },
        { header: 'Description', accessor: 'description', align: 'left', render: (row) => <span className="text-gray-700 text-sm truncate max-w-[300px] block" title={row.description}>{row.description}</span> },

        { header: 'Type', accessor: 'kind', align: 'center', render: (row) => {
                const isPositive = ['add', 'addition'].includes(row.kind?.toLowerCase());
                return (<div className={`flex items-center justify-center gap-2 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}<span className="capitalize">{row.kind}</span></div>);
            }},
        { header: 'Amount', accessor: 'amount', align: 'center', render: (row) => {
                const isPositive = ['add', 'addition'].includes(row.kind?.toLowerCase());
                return (<span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{isPositive ? '+' : '-'} {formatAmount(row.amount)}</span>);
            }},

        // --- NEW BALANCE COLUMN ---
        {
            header: 'Balance',
            accessor: 'balance',
            align: 'center',
            render: (row) => {
                const isPositive = ['add', 'addition'].includes(row.kind?.toLowerCase());
                const amount = parseFloat(row.amount || 0);
                const lastTotal = parseFloat(row.last_total || 0);
                // Calculate Balance: Last Total +/- Amount
                const currentBalance = isPositive ? lastTotal + amount : lastTotal - amount;

                return <span className="text-sm font-bold text-gray-800">{formatAmount(currentBalance)}</span>
            }
        },
        // --------------------------

        { header: 'Date', accessor: 'created_at', align: 'right', render: (row) => <span className="text-gray-500 text-sm">{formatDateTime(row.created_at)}</span> }
    ];

    // Stats
    const totalRevenue = (ownerData.booking || []).reduce((acc, curr) => acc + parseFloat(curr.total_price || 0), 0);
    const totalPitches = ownerData.my_pitches?.length || 0;
    const totalBookingsCount = ownerData.booking?.length || 0;

    // Handlers
    const handleContactEmail = () => { if(ownerData.email) handleEmailClick(ownerData.email, `Inquiry regarding ${ownerData.pitch_name}`, "Hello,"); };
    const handleContactPhone = () => { if(ownerData.contact_phone) handleWhatsAppClick(ownerData.contact_phone, "Hello, I have a question regarding your venue."); };
    const handleAddAction = () => setIsActionModalOpen(true);
    const handleActionSuccess = () => { setRefreshTrigger(prev => prev + 1); setCurrentActionPage(1); };
    const handleBack = () => navigate(-1);

    if (!user || !user.role) return false;

    const { role } = user;

    return (
        <div className="min-h-screen xl:px-5 bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="mx-auto py-4">
                    <button onClick={handleBack} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors">
                        <ArrowIcon size={'lg'}/> Back to Pitch Owners
                    </button>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className="mx-auto py-8 space-y-8">

                {/* 1. Top Section: Sidebar + Bookings + Pitches */}
                <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-6">

                    {/* LEFT SIDEBAR - Owner Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-6">
                            {/* Logo & Name */}
                            <div className="text-center mb-6">
                                {ownerData.profile_image ? ( <img src={ownerData.profile_image} alt={ownerData.pitch_name} className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-primary-100 object-cover" /> ) : ( <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center mx-auto mb-4"><Shield className="w-10 h-10 text-white" /></div> )}
                                <h2 className="text-xl font-bold text-gray-900 mb-1">{ownerData.pitch_name}</h2>
                                <div className="flex flex-col items-center gap-3 my-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm border ${ownerData.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{ownerData.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{ownerData.is_active ? 'Active' : 'Inactive'}</div>
                                        <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 flex items-center gap-1 border border-gray-200"><Globe className="w-3 h-3" />{ownerData.city || 'UAE'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-600">Total Pitches</span></div><span className="text-sm font-semibold text-gray-900">{totalPitches}</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Activity className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-600">Total Bookings</span></div><span className="text-sm font-semibold text-gray-900">{totalBookingsCount}</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-600">Est. Revenue</span></div><span className="text-sm font-semibold text-green-600">{formatAmount(totalRevenue)}</span></div>
                                {role.is_admin &&
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Percent className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">Commission Rate</span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">
                                        {ownerData.commission_rate ?? 0}%
                                    </span>
                                    </div>
                                }
                            </div>

                            {/* Contact Info */}
                            <div className="mb-6">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Person</h4>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold"><User className="w-5 h-5" /></div>
                                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{ownerData.contact_name || 'N/A'}</p><p className="text-xs text-gray-500 truncate">{ownerData.email}</p></div>
                                </div>
                                <div className="space-y-2">
                                    {ownerData.email && ( <button onClick={handleContactEmail} className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-gray-200"><Mail className="w-4 h-4" />Send Email</button> )}
                                    {ownerData.contact_phone && ( <button onClick={handleContactPhone} className="w-full px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-primary-100"><Phone className="w-4 h-4" />WhatsApp</button> )}
                                </div>
                            </div>
                            {/* Details */}
                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-gray-400" /><span>{ownerData.pitch_address}, {ownerData.city}</span></div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100"><Calendar className="w-3 h-3" />Joined {formatDate(ownerData.created_at)}</div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT AREA - Bookings & Pitches */}
                    <div className="lg:col-span-2 2xl:col-span-3 space-y-6">

                        {/* BOOKINGS SECTION */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="p-3 px-5 w-full flex flex-wrap justify-between items-center border-b border-gray-100">
                                <div className="flex items-baseline gap-2"><h3 className="text-lg font-bold text-gray-900">Bookings</h3><span className="text-sm text-gray-500">({filteredBookings.length} total)</span></div>
                                <div className="flex items-center gap-3">
                                    <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                                        <option value="all">All Status</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {filteredBookings.length > 0 ? (
                                    <div className="space-y-3">{filteredBookings.map((booking) => (
                                        <div key={booking.id} className="border border-gray-100 rounded-lg p-4 hover:border-primary-300 transition-colors bg-white shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div><div className="flex items-center gap-2 mb-1"><h4 className="font-semibold text-gray-900">Booking #{booking.id}</h4>{getStatusBadge(booking.status)}</div><p className="text-sm text-gray-500">Booked by: <span className="font-medium text-gray-700">{booking.user_info?.name || 'Unknown User'}</span></p></div>
                                                <div className="text-right"><p className="text-lg font-bold text-primary-600">{formatAmount(booking.total_price)}</p></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600"><LayoutGrid className="w-4 h-4 text-gray-400" />Name : {booking.pitch?.translations?.name || 'Unknown Pitch'} , Size :{booking.pitch?.size || '?'} aside</div>
                                                <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4 text-gray-400" />{formatDateTime(booking.start_time)}</div>
                                            </div>
                                        </div>
                                    ))}</div>
                                ) : ( <div className="text-center py-12"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No bookings found</p></div> )}
                            </div>
                        </div>

                        {/* PITCHES TABLE SECTION */}
                        <div className="bg-white px-4 rounded-lg shadow-sm border border-gray-100">
                            <div className="pt-5 lg:px-6 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">My Pitches</h3>
                                <p className="text-sm text-gray-500 mt-1">Total: {ownerData.my_pitches?.length || 0} pitches</p>
                            </div>
                            {(ownerData.my_pitches && ownerData.my_pitches.length > 0) ? (
                                <MainTable columns={pitchColumns} data={paginatedPitches} currentPage={currentPitchPage} itemsPerPage={pitchesPerPage} totalItems={ownerData.my_pitches.length} onPageChange={setCurrentPitchPage} showSearch={false} />
                            ) : ( <div className="text-center py-12"><LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No pitches registered yet</p></div> )}
                        </div>

                    </div>
                </div>


                {/* 2. STAFF ACTIONS TABLE SECTION */}
                {role.is_admin &&

                    <div className="w-full">
                        <div className="bg-white px-4 rounded-lg shadow-sm border border-gray-100">
                            <div className="pt-5 lg:px-6 flex flex-wrap justify-between items-center mb-2 gap-4">

                                {/* Title & Total Balance */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-gray-700" />
                                        <h3 className="text-lg font-bold text-gray-900">Staff Actions</h3>
                                    </div>
                                    {/* DISPLAY TOTAL BALANCE HERE */}
                                    <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full border border-primary-100">
                                        <Wallet className="w-4 h-4 text-primary-600" />
                                        <span className="text-sm text-primary-700">Total Balance:</span>
                                        <span className="text-sm font-bold text-primary-800">{formatAmount(actionsTotalBalance)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Action Limit Dropdown */}
                                    <div className="flex items-center gap-2">
                                        <ListFilter className="w-4 h-4 text-gray-400" />
                                        <select
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-700 cursor-pointer"
                                            value={actionsLimit}
                                            onChange={(e) => {
                                                setActionsLimit(Number(e.target.value));
                                                setCurrentActionPage(1);
                                            }}
                                        >
                                            <option value={10}>10 / page</option>
                                            <option value={20}>20 / page</option>
                                            <option value={50}>50 / page</option>
                                            <option value={100}>100 / page</option>
                                            <option value={500}>500 / page</option>
                                            <option value={1000}>1000 / page</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleAddAction}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Action
                                    </button>
                                </div>
                            </div>

                            <MainTable
                                columns={actionColumns}
                                data={actionsData}
                                currentPage={currentActionPage}
                                itemsPerPage={actionsLimit}
                                totalItems={totalActions}
                                onPageChange={setCurrentActionPage}
                                showSearch={false}
                            />
                        </div>
                    </div>
                }

            </div>

            {/* Modal */}
            <AddActionModal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                onSuccess={handleActionSuccess}
                staffId={ownerData.id}
            />
        </div>
    );
};

export default PitchOwnerDetails;