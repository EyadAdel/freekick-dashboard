import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

// Changed import to use the helper function
import { getImageUrl } from '../../utils/imageUtils.js';

import {
    MapPin, CheckCircle2, XCircle,
    Users, Calendar,
    LayoutGrid, User,
    Mail, Phone, Clock, Globe,
    TrendingUp, TrendingDown,
    Wallet, Plus, FileText,
    Percent, Edit2, Save, X,
    ShieldCheck
} from 'lucide-react';

// --- Services ---
import { pitchOwnersService } from '../../services/pitchOwners/pitchOwnersService.js';

// --- Components ---
import MainTable from "../../components/MainTable.jsx";
import AddActionModal from "../../components/pitchOwners/AddActionModal.jsx";

// --- Hooks ---
import { useContact } from "../../hooks/useContact.js";
import ArrowIcon from "../common/ArrowIcon.jsx";
import { toast } from "react-toastify";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";

// ============================================================================
// CONSTANTS
// ============================================================================

// Static SVG Placeholder
const PLACEHOLDER_SVG = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='20' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

// ============================================================================
// HELPERS
// ============================================================================
const formatDate = (dateTime, locale = 'en-US') => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (dateTime, locale = 'en-US') => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatAmount = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 'AED 0';
    return `AED ${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// --- Header Component ---
const Header = ({ onBack, t }) => (
    <div className="bg-white shadow-sm top-0">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors group"
            >
                <div className="p-1 rounded-full group-hover:bg-primary-50 transition-colors">
                    <ArrowIcon className="w-6 h-6 sm:w-8 sm:h-8 transform rotate-90 rtl:-rotate-90" />
                </div>
                <span className="font-medium text-sm sm:text-base">{t('header.backButton')}</span>
            </button>
        </div>
    </div>
);

// --- OwnerProfileCard Component ---
const OwnerProfileCard = ({ ownerData, totalRevenue, totalPitches, totalBookingsCount, onEmail, onWhatsapp, isAdmin, onUpdateCommission, t, currentLang }) => {

    // Logic: Use cover_image for background, profile_image for logo
    const coverImage = getImageUrl(ownerData.cover_image) || getImageUrl(ownerData.profile_image) || PLACEHOLDER_SVG;
    const logoImage = getImageUrl(ownerData.profile_image) || PLACEHOLDER_SVG;

    // Editable Commission State
    const [isEditing, setIsEditing] = useState(false);
    const [tempCommission, setTempCommission] = useState(ownerData.commission_rate ?? 0);
    const [isSaving, setIsSaving] = useState(false);

    // Extract User Info safely
    const userInfo = ownerData.user_info || {};
    const userImage = getImageUrl(userInfo.image);

    const handleSave = async () => {
        setIsSaving(true);
        await onUpdateCommission(tempCommission);
        setIsSaving(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempCommission(ownerData.commission_rate ?? 0);
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group h-full flex flex-col">
            {/* Image & Overlay */}
            <div className="relative h-48 sm:h-56 w-full shrink-0">
                {/* Background Cover */}
                <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_SVG; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${ownerData.is_active ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                    }`}>
                        {ownerData.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {ownerData.is_active ? t('profile.status.active') : t('profile.status.inactive')}
                    </span>
                </div>

                {/* Logo Overlay */}
                <div className="absolute -bottom-8 left-4 rtl:left-auto rtl:right-4 z-20">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                        <img
                            src={logoImage}
                            alt="Logo"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_SVG; }}
                        />
                    </div>
                </div>
            </div>

            {/* Title Section */}
            <div className="pt-10 px-4 sm:px-6 pb-2">
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-gray-900 mb-1">
                    {ownerData.pitch_name}
                </h2>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Globe size={14} />
                    <span className="font-semibold">{ownerData.city || 'UAE'}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 border-y border-gray-100 divide-x divide-gray-100 rtl:divide-x-reverse mt-2">
                <div className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('profile.stats.bookings')}</span>
                    <span className="text-base sm:text-lg font-bold text-gray-900">{totalBookingsCount}</span>
                </div>
                <div className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('profile.stats.pitches')}</span>
                    <span className="text-base sm:text-lg font-bold text-gray-900">{totalPitches}</span>
                </div>
            </div>

            {/* Financial Highlight */}
            <div className="px-4 p-3 sm:px-6 bg-gray-50/50 border-b border-gray-100">
                <div className="flex flex-col gap-4">
                    {/* Est Revenue */}
                    <div className="text-center">
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('profile.stats.estRevenue')}</p>
                        <div className="text-2xl sm:text-3xl font-extrabold text-primary-600 flex items-center justify-center gap-1">
                            {formatAmount(totalRevenue)}
                        </div>
                    </div>

                    {/* Commission Rate (Admin Only & Editable) */}
                    {isAdmin && (
                        <div className="flex flex-col items-center justify-center gap-2">
                            {!isEditing ? (
                                <div className="flex items-center justify-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm mx-auto w-fit group/edit">
                                    <Percent className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs text-gray-500 font-semibold uppercase">{t('profile.stats.commission')}:</span>
                                    <span className="text-sm font-bold text-gray-900">{ownerData.commission_rate ?? 0}%</span>

                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="ml-2 p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all"
                                        title="Edit Commission"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-primary-300 shadow-sm mx-auto w-fit ring-2 ring-primary-100">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">{t('profile.stats.rate')}:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={tempCommission}
                                        onChange={(e) => setTempCommission(e.target.value)}
                                        className="w-16 px-1 py-0.5 text-center font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:border-primary-500 text-sm"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded-full disabled:opacity-50"
                                    >
                                        <Save size={16} />
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded-full disabled:opacity-50"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- Info Row / Actions --- */}
            <div className="px-4 pt-4 pb-2 sm:px-6 bg-white flex-grow">

                {/* 1. Account Owner Info (With Image Preview) */}
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('profile.accountInfo.title') || "Account Owner"}</h4>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100 mb-4 hover:border-primary-200 transition-colors">
                    {/* User Image Preview Section */}
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden shadow-sm">
                        {userImage ? (
                            <img
                                src={userImage}
                                alt={userInfo.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to icon if image fails to load
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        {/* Fallback Icon (displayed if no image or error) */}
                        <div className={`w-full h-full flex items-center justify-center bg-purple-50 ${userImage ? 'hidden' : 'flex'}`}>
                            <ShieldCheck className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>

                    <div className="">
                        <p className="text-sm font-bold text-gray-900 truncate">{userInfo.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500 truncate font-mono" dir="ltr">{userInfo.phone || 'N/A'}</p>
                    </div>
                </div>

                {/* 2. Contact Person Info */}
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('profile.contact.title')}</h4>
                <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{ownerData.contact_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500 truncate">{t('profile.contact.contactPerson')}</p>
                    </div>
                </div>

                {/* Email Action */}
                <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-primary-600">
                            {ownerData.email || t('profile.contact.noEmail')}
                        </p>
                    </div>
                </div>

                {/* Phone Action */}
                <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900">
                            {ownerData.contact_phone || t('profile.contact.noPhone')}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- Buttons & Details --- */}
            <div className="px-4 sm:px-6 sm:pb-6 space-y-4 bg-white flex-grow">
                {/* Contact Buttons */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {ownerData.email && (
                            <button
                                onClick={onEmail}
                                className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-gray-200"
                            >
                                <Mail className="w-4 h-4" />
                                {t('profile.contact.emailBtn')}
                            </button>
                        )}
                        {ownerData.contact_phone && (
                            <button
                                onClick={onWhatsapp}
                                className="px-3 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-primary-100"
                            >
                                <Phone className="w-4 h-4" />
                                {t('profile.contact.whatsappBtn')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                {/* Address */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{t('profile.contact.location')}</p>
                        <p className="text-sm font-medium truncate">{`${ownerData.pitch_address}, ${ownerData.city}` || t('profile.contact.addressNA')}</p>
                    </div>
                </div>

                {/* Joined Date */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{t('profile.contact.joinedDate')}</p>
                        <p className="text-sm font-medium">
                            {formatDate(ownerData.created_at, currentLang === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const PitchOwnerDetails = () => {
    const { t, i18n } = useTranslation('pitchOwnerDetails'); // Load namespace
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { handleEmailClick, handleWhatsAppClick } = useContact();
    const currentLang = i18n.language;

    // 1. Retrieve Data & Local State Management
    const [currentOwnerData, setCurrentOwnerData] = useState(location.state?.ownerData?.data || {});
    console.log(currentOwnerData, "fffffffffffffffffffffffff")


    // State
    const [bookingStatus, setBookingStatus] = useState('all');
    const [currentPitchPage, setCurrentPitchPage] = useState(1);
    const pitchesPerPage = 5;

    // Staff Actions State
    const [actionsData, setActionsData] = useState([]);
    const [totalActions, setTotalActions] = useState(0);
    const [actionsTotalBalance, setActionsTotalBalance] = useState(0); // Gross Total
    const [staffCurrentBalance, setStaffCurrentBalance] = useState(0); // NEW: Net Total after commission
    const [currentActionPage, setCurrentActionPage] = useState(1);
    const [loadingActions, setLoadingActions] = useState(false);
    const [actionsLimit, setActionsLimit] = useState(10);

    // Modal and Refresh State
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Helper for Status Badge inside component to use translations
    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: { color: 'bg-green-100 text-green-700', label: t('bookings.statusLabels.completed') },
            pending: { color: 'bg-yellow-100 text-yellow-700', label: t('bookings.statusLabels.pending') },
            cancelled: { color: 'bg-red-100 text-red-700', label: t('bookings.statusLabels.cancelled') }
        };
        const config = statusConfig[status?.toLowerCase()] || { ...statusConfig.pending, label: status };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                {config.label}
            </span>
        );
    };

    // 2. Filter Bookings Logic
    const filteredBookings = useMemo(() => {
        if (!currentOwnerData.booking) return [];
        return currentOwnerData.booking.filter(b => {
            return bookingStatus === 'all' || b.status === bookingStatus;
        });
    }, [currentOwnerData.booking, bookingStatus]);

    // 3. Pagination for Pitches
    const paginatedPitches = useMemo(() => {
        const startIndex = (currentPitchPage - 1) * pitchesPerPage;
        return (currentOwnerData.my_pitches || []).slice(startIndex, startIndex + pitchesPerPage);
    }, [currentOwnerData.my_pitches, currentPitchPage]);

    // 4. Fetch Actions Effect
    useEffect(() => {
        if (!currentOwnerData.id) return;
        const fetchActions = async () => {
            setLoadingActions(true);
            try {
                const response = await pitchOwnersService.getAllStaffActions(
                    currentOwnerData.id,
                    currentActionPage,
                    actionsLimit
                );
                if (response && response.status) {
                    setActionsData(response.results);
                    setTotalActions(response.count);
                    setActionsTotalBalance(response.total);
                    // Update the staff current balance (net after commission)
                    setStaffCurrentBalance(response.staff_current_balance || 0);
                }
            } catch (error) {
                console.error("Error fetching staff actions:", error);
            } finally {
                setLoadingActions(false);
            }
        };
        fetchActions();
    }, [currentOwnerData.id, currentActionPage, actionsLimit, refreshTrigger]);

    // Handlers
    const handleContactEmail = () => { if (currentOwnerData.email) handleEmailClick(currentOwnerData.email, `Inquiry regarding ${currentOwnerData.pitch_name}`, "Hello,"); };
    const handleContactPhone = () => { if (currentOwnerData.contact_phone) handleWhatsAppClick(currentOwnerData.contact_phone, "Hello, I have a question regarding your venue."); };
    const handleAddAction = () => setIsActionModalOpen(true);
    const handleActionSuccess = () => { setRefreshTrigger(prev => prev + 1); setCurrentActionPage(1); };

    // Update Commission Handler
    const handleUpdateCommission = async (newRate) => {
        try {
            const response = await pitchOwnersService.updateStaff(currentOwnerData.id, {
                commission_rate: newRate
            });
            if (response) {
                setCurrentOwnerData(prev => ({ ...prev, commission_rate: newRate }));
                // Trigger refresh so API is called again and staff_current_balance updates
                setRefreshTrigger(prev => prev + 1);
                toast.success(t('profile.stats.updateSuccess') || "Commission updated successfully");
            }
        } catch (error) {
            console.error("Failed to update commission", error);
            toast.error(t('errors.updateFailed') || "Failed to update commission");
        }
    };

    // Derived Stats
    const totalRevenue = (currentOwnerData.booking || []).reduce((acc, curr) => acc + parseFloat(curr.total_price || 0), 0);
    const totalPitches = currentOwnerData.my_pitches?.length || 0;
    const totalBookingsCount = currentOwnerData.booking?.length || 0;

    // Table Column Definitions
    const pitchColumns = [
        { header: t('pitches.table.code'), accessor: 'id', align: 'left', render: (pitch) => <span className="text-sm font-semibold text-primary-600">{`P${pitch.id}`}</span> },
        {
            header: t('pitches.table.name'), accessor: 'translations.name', render: (pitch) => (
                <div className="flex items-center gap-3">
                    {pitch.image ? (
                        <img
                            src={getImageUrl(pitch.image)}
                            alt={pitch.translations.name}
                            className="w-10 h-10 rounded-lg object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_SVG; }}
                        />
                    ) : (<div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center"><LayoutGrid className="w-5 h-5 text-primary-600" /></div>)}
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{pitch.translations?.name || t('bookings.unknown')}</p>
                        <p className="text-xs text-gray-500">{t('pitches.table.size')}: {pitch.size}</p>
                    </div>
                </div>
            )
        },
        { header: t('pitches.table.pricePerHour'), accessor: 'price_per_hour', align: 'center', render: (pitch) => <span className="text-sm font-semibold text-primary-600">{formatAmount(pitch.price_per_hour)}</span> },
        { header: t('pitches.table.bookings'), accessor: 'num_of_bookings', align: 'center', render: (pitch) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{pitch.num_of_bookings}</span> },
        { header: t('pitches.table.status'), accessor: 'is_active', align: 'center', render: (pitch) => <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${pitch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{pitch.is_active ? t('profile.status.active') : t('profile.status.inactive')}</span> }
    ];

    const actionColumns = [
        { header: t('staffActions.table.srNo'), accessor: 'id', align: 'left', render: (row, index) => <span className="text-gray-500">{index + 1}</span> },
        { header: t('staffActions.table.description'), accessor: 'description', align: 'left', render: (row) => <span className="text-gray-700 text-sm truncate max-w-[200px] block" title={row.description}>{row.description}</span> },
        {
            header: t('staffActions.table.type'), accessor: 'kind', align: 'center', render: (row) => {
                const isPositive = ['add', 'addition'].includes(row.kind?.toLowerCase());
                return (<div className={`flex items-center justify-center gap-2 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}<span className="capitalize">{row.kind}</span></div>);
            }
        },
        {
            header: t('staffActions.table.amount'), accessor: 'amount', align: 'center', render: (row) => {
                const isPositive = ['add', 'addition'].includes(row.kind?.toLowerCase());
                return (<span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{isPositive ? '+' : '-'} {formatAmount(row.amount)}</span>);
            }
        },
        {
            header: t('staffActions.table.balance'), accessor: 'balance', align: 'center', render: (row) => {
                const isPositive = ['add', 'addition'].includes(row.kind?.toLowerCase());
                const amount = parseFloat(row.amount || 0);
                const lastTotal = parseFloat(row.last_total || 0);
                const currentBalance = isPositive ? lastTotal + amount : lastTotal - amount;
                return <span className="text-sm font-bold text-gray-800">{formatAmount(currentBalance)}</span>
            }
        },
        { header: t('staffActions.table.date'), accessor: 'created_at', align: 'right', render: (row) => <span className="text-gray-500 text-sm">{formatDateTime(row.created_at, currentLang === 'ar' ? 'ar-EG' : 'en-US')}</span> }
    ];

    // Validation
    if (!currentOwnerData || !currentOwnerData.id) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <p className="text-gray-500 mb-4">{t('errors.notFound')}</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">{t('errors.goBack')}</button>
            </div>
        );
    }
    if (!user || !user.role) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* --- Header --- */}
            <Header onBack={() => navigate(-1)} t={t} />

            <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* --- Grid Layout (Top Section) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                    {/* --- Left Column: Profile Card (Sticky) --- */}
                    <div className="col-span-1">
                        <div className="lg:sticky lg:top-24 h-fit space-y-6">
                            <OwnerProfileCard
                                ownerData={currentOwnerData}
                                totalRevenue={totalRevenue}
                                totalPitches={totalPitches}
                                totalBookingsCount={totalBookingsCount}
                                onEmail={handleContactEmail}
                                onWhatsapp={handleContactPhone}
                                isAdmin={user.role.is_admin}
                                onUpdateCommission={handleUpdateCommission}
                                t={t}
                                currentLang={currentLang}
                            />
                        </div>
                    </div>

                    {/* --- Right Column: Details & Tables --- */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Bookings Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary-500" /> {t('bookings.title')}
                                    <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                        {filteredBookings.length}
                                    </span>
                                </h3>
                                {/* Filter Dropdown */}
                                <select
                                    value={bookingStatus}
                                    onChange={(e) => setBookingStatus(e.target.value)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
                                >
                                    <option value="all">{t('bookings.filters.all')}</option>
                                    <option value="completed">{t('bookings.filters.completed')}</option>
                                    <option value="pending">{t('bookings.filters.pending')}</option>
                                    <option value="cancelled">{t('bookings.filters.cancelled')}</option>
                                </select>
                            </div>

                            <div className="p-4 sm:p-6 max-h-[400px] overflow-y-auto custom-scrollbar space-y-3">
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking) => (
                                        <div key={booking.id} className="border border-gray-100 rounded-lg p-4 hover:border-primary-300 transition-colors bg-white shadow-sm group">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-gray-900 text-sm">#{booking.id}</span>
                                                        {getStatusBadge(booking.status)}
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {t('bookings.user')}: <span className="font-medium text-gray-700">{booking.user_info?.name || t('bookings.unknown')}</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-extrabold text-primary-600">{formatAmount(booking.total_price)}</p>
                                                </div>
                                            </div>
                                            <div className="w-full h-px bg-gray-50 my-2"></div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <LayoutGrid className="w-3 h-3 text-gray-400" />
                                                    <span className="truncate">{booking.pitch?.translations?.name || 'Pitch'} ({booking.pitch?.size}s)</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    <span>{formatDateTime(booking.start_time, currentLang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400 text-sm">{t('bookings.noBookings')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pitches Table Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <LayoutGrid className="w-5 h-5 text-primary-500" /> {t('pitches.title')}
                                </h3>
                            </div>
                            <div className="p-4">
                                {(currentOwnerData.my_pitches && currentOwnerData.my_pitches.length > 0) ? (
                                    <MainTable
                                        columns={pitchColumns}
                                        data={paginatedPitches}
                                        currentPage={currentPitchPage}
                                        itemsPerPage={pitchesPerPage}
                                        totalItems={currentOwnerData.my_pitches.length}
                                        onPageChange={setCurrentPitchPage}
                                        showSearch={false}
                                    />
                                ) : (
                                    <div className="text-center py-8 text-gray-500 text-sm">{t('pitches.noPitches')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Staff Actions Section (Admin Only) */}
                {user.role.is_admin && (
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full">
                        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap justify-between items-center gap-3">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-700" />
                                    <h3 className="text-lg font-bold text-gray-900">{t('staffActions.title')}</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Total Gross Balance */}
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
                                        <span className="text-sm text-gray-600">{t('staffActions.totalBalance')}:</span>
                                        <span className="text-sm font-bold text-gray-800">{formatAmount(actionsTotalBalance)}</span>
                                    </div>

                                    {/* Net Staff Balance (After Commission) */}
                                    <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full border border-primary-100">
                                        <Wallet className="w-4 h-4 text-primary-600" />
                                        <span className="text-sm text-primary-700 font-medium">
                                            {t('staffActions.netBalance') || "Net Balance"}:
                                        </span>
                                        <span className="text-sm font-bold text-primary-800">
                                            {formatAmount(staffCurrentBalance)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <select
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-700 cursor-pointer"
                                        value={actionsLimit}
                                        onChange={(e) => {
                                            setActionsLimit(Number(e.target.value));
                                            setCurrentActionPage(1);
                                        }}
                                    >
                                        <option value={10}>{t('staffActions.perPage', { count: 10 })}</option>
                                        <option value={20}>{t('staffActions.perPage', { count: 20 })}</option>
                                        <option value={50}>{t('staffActions.perPage', { count: 50 })}</option>
                                        <option value={100}>{t('staffActions.perPage', { count: 100 })}</option>
                                        <option value={200}>{t('staffActions.perPage', { count: 200 })}</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddAction}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('staffActions.addActionBtn')}
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            <MainTable
                                columns={actionColumns}
                                data={actionsData}
                                currentPage={currentActionPage}
                                itemsPerPage={actionsLimit}
                                totalItems={totalActions}
                                onPageChange={setCurrentActionPage}
                                showSearch={false}
                                loading={loadingActions}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AddActionModal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                onSuccess={handleActionSuccess}
                staffId={currentOwnerData.id}
            />
        </div>
    );
};

export default PitchOwnerDetails;