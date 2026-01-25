import {useEffect, useState} from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, Calendar, CheckCircle, Clock, CreditCard,
    Mail, MapPin, Phone, Printer, Send, Users, MoreVertical,
    Shield, Globe, Trophy, Bell, Building, Download, Share2,RefreshCw,Star, RefreshCcw
} from "lucide-react";
import { bookingService } from "../../services/bookings/bookingService.js";
import { useBooking } from "../../hooks/useBookings.js";
import logo from '../../assets/logo.svg'
import ArrowIcon from "../../components/common/ArrowIcon.jsx";
import {useContact} from "../../hooks/useContact.js";
import { usePrint } from '../../hooks/usePrint';
import PrintableReceipt from '../../components/features/Bookings/PrintableReceipt.jsx';
import {useDispatch, useSelector} from "react-redux";
import {  clearCancelStatus } from "../../features/bookings/bookingSlice";
import { showConfirm } from "../../components/showConfirm.jsx";
import {toast} from "react-toastify";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import { getImageUrl } from '../../utils/imageUtils.js';
import {daysOfWeekService} from "../../services/daysOfWeek/daysOfWeekService.js";
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";

const BookingDetailView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { t, i18n } = useTranslation('bookingDetails');
    const { user } = useSelector((state) => state.auth);
    const { role } = user;
    const bookingFromState = location.state?.booking;
    const bookingId = id || bookingFromState?.id || location.state?.bookingId;
    const isRTL = i18n.language === 'ar';

    const {
        booking: fetchedBooking,
        isLoading: isFetchingDetails,
        error: fetchError,
        refetch
    } = useBooking(bookingId);
    const { handleEmailClick, handleWhatsAppClick } = useContact();
    const { componentRef, handlePrint } = usePrint();
    const dispatch = useDispatch();

    const booking = fetchedBooking;
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [imageErrors, setImageErrors] = useState({});
    const { cancelStatus, cancelError } = useSelector(state => state.bookings);
    const [daysList, setDaysList] = useState([]);
    const fetchFilterOptions = async () => {
        try {
            const daysRes = await daysOfWeekService.getAll({ all_languages: true });
            if (daysRes && daysRes.results) {
                setDaysList(daysRes.results);
            }
        } catch (error) {
            console.error("Failed to fetch filter options:", error);
        }
    };
    useEffect(() => {
        fetchFilterOptions()
    }, []);
    useEffect(() => {
        dispatch(setPageTitle('Book'));
    }, [dispatch]);

    useEffect(() => {
        if (cancelStatus === 'succeeded') {
            alert(t('messages.cancelled'));
            dispatch(clearCancelStatus());
            navigate('/bookings');
        } else if (cancelStatus === 'failed') {
            alert(t('messages.failedCancel') + cancelError);
            dispatch(clearCancelStatus());
        }
    }, [cancelStatus, cancelError, dispatch, navigate, t]);

    const handleBack = () => {
        navigate('/bookings');
    };

    const handleRefresh = () => {
        navigate('/bookings');
    };

    const handleImageError = (imageKey) => {
        setImageErrors(prev => ({
            ...prev,
            [imageKey]: true
        }));
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const nameParts = name.trim().split(' ');
        if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    };

    const getAvatarColor = (name) => {
        const nameStr = name || 'User';
        const colors = [
            'bg-teal-500',
            'bg-blue-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-orange-500',
            'bg-red-500',
            'bg-green-500',
            'bg-indigo-500',
        ];

        let hash = 0;
        for (let i = 0; i < nameStr.length; i++) {
            hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
        }

        const colorIndex = Math.abs(hash) % colors.length;
        return colors[colorIndex];
    };

    if (!booking && isFetchingDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">{t('noData')}</p>
                    <button onClick={handleBack} className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg">
                        {t('goBack')}
                    </button>
                </div>
            </div>
        );
    }

    const handleCustomerEmail = () => {
        const email = booking.user_info?.email;
        const customerName = booking.user_info?.name || 'Customer';
        const subject = `Booking #${String(booking.id).padStart(7, '0')} - ${booking.venue_info?.translations?.name || 'Venues'}`;
        const body = `Dear ${customerName},\n\nRegarding your booking #${String(booking.id).padStart(7, '0')} at ${booking.venue_info?.translations?.name || 'our venue'}.\n\n`;

        handleEmailClick(email, subject, body);
    };

    const handleCustomerWhatsApp = () => {
        const phone = booking.user_info?.phone;
        const customerName = booking.user_info?.name || 'Customer';
        const message = `Hello ${customerName}! Regarding your booking #${String(booking.id).padStart(7, '0')} at ${booking.venue_info?.translations?.name || 'our venue'}.`;

        handleWhatsAppClick(phone, message);
    };

    const formatDate = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleDateString(i18n.language, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'  // Add this line
        });
    };
    const formatTime = (dateTime) => {
        if (!dateTime) return 'N/A';

        // Extract the time part directly from the string
        const timePart = dateTime.split('T')[1]; // "19:00:00Z"
        const [hours, minutes] = timePart.split(':');

        // Convert to 12-hour format
        const hour = parseInt(hours);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;

        return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
    };

    const handleCancel = async () => {
        try {
            const confirmed = await showConfirm({
                title: t('confirm.cancel.title'),
                text: t('confirm.cancel.text'),
                confirmButtonText: t('confirm.cancel.confirmButton'),
                cancelButtonText: t('confirm.cancel.cancelButton'),
                icon: "warning"
            });

            if (confirmed) {
                setIsActionLoading(true);
                await bookingService.cancelBooking(booking.id);

                // Show success toast
                toast.success('booking canceld successfully');

                // handleRefresh();
            }
        } catch (err) {
            toast.error(t('messages.failedCancel') + err.message);
        } finally {
            setIsActionLoading(false);
        }
    };
    const handleAccept = async (status) => {
        try {
            const confirmed = await showConfirm({
                title: t('confirm.cancel.title'),
                text: t('confirm.cancel.text'),
                confirmButtonText: t('confirm.cancel.confirmButton'),
                cancelButtonText: t('confirm.cancel.cancelButton'),
                icon: "warning"
            });

            if (confirmed) {
                setIsActionLoading(true);
                await bookingService.partialUpdate(booking.id,{accepted_by_pitch_owner:status});
                handleRefresh();
            }
        } catch (err) {
            toast.error(t('messages.failedCancel') + err.message);
        } finally {
            setIsActionLoading(false);
        }
    };
    const handleFullPaid = async () => {
        try {
            const confirmed = await showConfirm({
                title: t('confirm.markPaid.title'),
                text: t('confirm.markPaid.text'),
                confirmButtonText: t('confirm.markPaid.confirmButton'),
                cancelButtonText: t('confirm.markPaid.cancelButton'),
                icon: "success"
            });

            if (confirmed) {
                setIsActionLoading(true);
                await bookingService.partialUpdate(booking.id, { mark_as_paid: true });

                toast.success(t('messages.markedPaid'));

                await refetch();
            }
        } catch (err) {
            toast.error('Failed to mark as fully paid: ' + err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const totalAmount = parseFloat(booking.total_price || 0);
    const totalCollected = parseFloat(booking.total_collected_amount || 0);
    const totalPending = parseFloat(booking.total_pending_amount || 0);

    const getStatusColor = (status) => {
        const statusStr = String(status || 'pending').toLowerCase();
        const colors = {
            pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            confirmed: 'bg-teal-50 text-teal-700 border-teal-200',
            completed: 'bg-green-50 text-green-700 border-green-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200'
        };
        return colors[statusStr] || colors.pending;
    };

    return (
        <div className="min-h-screen px-2 lg:px-4 bg-gray-50">
            {/* Hidden PrintableReceipt */}
            <div style={{
                position: 'fixed',
                left: '-10000px',
                top: 0,
                zIndex: -1000
            }}>
                <PrintableReceipt ref={componentRef} booking={booking} logo={logo} />
            </div>

            {/* Header Section */}
            <div className="bg-white rounded-xl">
                <div className="mx-auto px-2 sm:px-4 lg:py-3 py-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={handleBack}
                                className=" text-xs lg:text-base flex items-center gap-2 text-primary-700 hover:text-primary-600 transition-colors">
                                <ArrowIcon
                                    direction={isRTL ? 'right' : 'left'}
                                    size="lg"
                                />
                                <span className="font-medium">{t('back')}</span>
                            </button>
                        </div>
                        {role.is_admin || role.is_sub_admin ? (
                            booking.mark_as_paid ? (
                                <div className=" px-2 py-2 bg-green-100 border border-green-300 text-green-700 rounded-2xl flex items-center justify-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className=" text-sm ">{t('actions.fullPaid')}</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleFullPaid}
                                    disabled={isActionLoading}
                                    className={` text-xs lg:text-base px-4 py-2 bg-teal-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2 ${
                                        isActionLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-600'
                                    }`}
                                >
                                    {isActionLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span className="font-medium">{t('actions.processing')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4" />
                                            <span className="font-medium">{t('actions.markAsPaid')}</span>
                                        </>
                                    )}
                                </button>
                            )
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto  py-4 sm:py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column - Customer Profile */}
                    <div className="lg:col-span-1 order-1 lg:order-1">
                        <div className="bg-white rounded-xl shadow-md lg:sticky lg:top-6">
                            {/* Profile Avatar */}
                            <div className="flex bg-primary-50 pt-8 flex-col items-center text-center mb-6 pb-6 border-b border-gray-100">
                                <div className="relative mb-4 cursor-pointer"   onClick={() => (role?.is_admin || role?.is_sub_admin) ?
                                    navigate(`/players/player-profile/${booking.user_info.id}`) :
                                    undefined
                                }>
                                    {booking.user_info?.image && !imageErrors['customer-profile'] ? (
                                        <img
                                            src={getImageUrl(booking.user_info?.image)}
                                            alt={booking.user_info?.name || 'Customer Profile'}
                                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-100 shadow-md"
                                            onError={() => handleImageError('customer-profile')}
                                        />
                                    ) : (
                                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${getAvatarColor(booking.user_info?.name)} flex items-center justify-center border-4 border-gray-100 shadow-md`}>
                                            <span className="text-white text-2xl font-bold">
                                                {getInitials(booking.user_info?.name)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-teal-500 text-white p-1.5 rounded-full shadow-lg">
                                        <CheckCircle size={14} />
                                    </div>
                                </div>

                                <h4 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">
                                    {booking.user_info?.name || 'Unknown Customer'}
                                </h4>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4 mb-6 px-5 pb-6 border-b border-gray-100">
                                <h4 className="font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">
                                    {t('contact.title')}
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Phone size={16} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">{t('contact.phone')}</p>
                                            <p className="text-xs sm:text-sm text-gray-900">
                                                {booking.user_info?.phone || t('contact.notProvided')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="space-y-3 px-5 mb-6">
                                <h4 className="font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">
                                    {t('bookingInfo.title')}
                                </h4>
                                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm text-gray-600">{t('bookingInfo.customerType')}</span>
                                        <span className="text-xs sm:text-sm font-semibold text-teal-600">
                                            {booking.team_player ? t('bookingInfo.group') : t('bookingInfo.individual')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm text-gray-600">{t('bookingInfo.matchType')}</span>
                                        <span className="text-xs sm:text-sm font-semibold text-teal-600">
                                            {booking.play_vs_team ? t('bookingInfo.teamVsTeam') : t('bookingInfo.regular')}
                                                </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm text-gray-600">{t('bookingInfo.bookingType')}</span>
                                        <span className="text-xs sm:text-sm font-semibold text-teal-600">{t('bookingInfo.online')}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm text-gray-600">{t('bookingInfo.paymentMethod')}</span>
                                        <span className="text-xs sm:text-sm font-semibold text-teal-600">
                                            {booking.split_payment ? t('bookingInfo.split') : t('bookingInfo.solo')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm text-gray-600">Status</span>
                                        <span className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded ${
                                            booking.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                         {booking.is_active ? t('status.active') : t('status.inactive')}
                                        </span>
                                    </div>
                                    {booking.is_recurring && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs sm:text-sm text-gray-600">{t('bookingInfo.recurring')}</span>
                                                <span className="text-xs sm:text-sm font-semibold text-teal-600 flex items-center gap-1">
                                                 <RefreshCcw size={14} />
                                                    {t('bookingInfo.yes')}
                                                  </span>
                                            </div>
                                            {booking.recurring_end_date && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs sm:text-sm text-gray-600">{t('bookingInfo.endsOn')}</span>
                                                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                        {formatDate(booking.recurring_end_date)}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid px-5 pb-5 gap-3">
                                <button
                                    onClick={handleCustomerWhatsApp}
                                    className="px-4 py-2.5 text-xs sm:text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <Phone size={16} />
                                    <span>{t('actions.whatsapp')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Venues and Order Details */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-md space-y-4 sm:space-y-2 order-1 lg:order-2">
                        <div className="bg-white rounded-xl p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="flex-1 w-full">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                            {t('header.bookingId')} <span className="font-semibold text-gray-900">#{String(booking.id).padStart(7, '0')}</span>
                                        </h1>
                                        <span className={`w-fit px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${getStatusColor(booking.last_update)}`}>
                                            {t(`status.${booking.last_update?.toLowerCase()}`) || t('status.pending')}
                                        </span>
                                    </div>
                                    <div className="text-left flex gap-4 text-xs sm:text-sm text-gray-500 w-full sm:w-auto">
                                        <p>{t('header.created')} {formatDate(booking.created_at)}</p>
                                        <p>{t('header.updated')} {formatDate(booking.updated_at)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Printer size={18} />
                                    <span className="font-medium">{t('actions.printReceipt')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Venues Information Card */}
                        <div className="bg-white rounded-xl overflow-hidden">
                            <div className="rounded-lg">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 sm:gap-8">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                            <Calendar className="text-teal-600" size={20} />
                                        </div>
                                        <div className={'flex gap-5'}>
                                            <p className="text-xs text-gray-600 font-medium">{t('bookingTime.date')}</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {booking.start_time ? formatDate(booking.start_time) : t('bookingTime.notSet')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-teal-200"></div>
                                    <div  className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                            <Clock className="text-teal-600" size={20} />
                                        </div>
                                        <div  className={'flex gap-5'}>
                                            <p dir={'ltr'} className="text-xs text-gray-600 font-medium">{t('bookingTime.time')}</p>
                                            <p dir={'ltr'} className="text-sm font-bold text-gray-900">
                                                {booking.start_time && booking.end_time
                                                    ? `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`
                                                    : t('bookingTime.notSet')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={'grid bg-primary-50 p-4 m-4 gap-5 rounded-xl sm:grid-cols-2'}>
                                <div onClick={()=>navigate(`/venues/venue-details/${booking.venue_info.id}`)}
                                     className="relative cursor-pointer rounded-lg h-48 md:h-64">
                                    {booking.venue_info?.images?.[0]?.image ? (
                                        <img
                                            src={getImageUrl(booking.venue_info?.images?.[0]?.image)}
                                            alt="Venue"
                                            className="w-full lg:h-64 h-48 object-cover rounded-xl"
                                            onError={() => handleImageError('venue-image')}
                                        />
                                    ) : (
                                        <div className="w-full lg:h-64 h-48 bg-gray-200 flex items-center justify-center rounded-xl">
                                            <MapPin size={32} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                {booking?.venue_info && (
                                    <div className="rounded-lg">
                                        <VenueInfoCard booking={booking} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Players Section */}
                        {booking.users && booking.users.length > 0 && (
                            <div className="border-t border-gray-100 pt-4 p-4 sm:pt-6">
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                                    <Users size={18} className="text-teal-600" />
                                    {t('players.count', { count: booking.users.length })}
                                </h4>
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                    {booking.users.slice(0, 8).map((user, idx) => (
                                        <div key={idx} className="relative group flex-shrink-0">
                                            {user.image && !imageErrors[`player-${idx}`] ? (
                                                <img
                                                    src={getImageUrl(user.image)}
                                                    alt={user.name || 'Player'}
                                                    className="w-10 h-10 cursor-pointer sm:w-12 sm:h-12 rounded-full object-cover border-3 border-white shadow-md hover:scale-110 transition-transform"
                                                    onClick={() => (role?.is_admin || role?.is_sub_admin) ?
                                                        navigate(`/players/player-profile/${user.id}`) :
                                                        undefined
                                                    }
                                                    onError={() => handleImageError(`player-${idx}`)}
                                                />
                                            ) : (
                                                <div
                                                    onClick={() => (role?.is_admin || role?.is_sub_admin) ?
                                                        navigate(`/players/player-profile/${user.id}`) :
                                                        undefined
                                                    }
                                                    className={`w-10 cursor-pointer h-10 sm:w-12 sm:h-12 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white text-xs sm:text-sm font-bold border-3 border-white shadow-md hover:scale-110 transition-transform`}>
                                                    {getInitials(user.name)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {booking.users.length > 8 && (
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold border-3 border-white shadow-md flex-shrink-0">
                                            +{booking.users.length - 8}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Team vs Team Section */}
                        {booking.team_player && booking.play_vs_team && (
                            <div className="border-t border-gray-100 pt-4 p-4 sm:pt-6">
                                <h4 className="font-semibold text-gray-900 mb-6 flex items-center gap-2 text-sm sm:text-base">
                                    <Trophy size={18} className="text-teal-600" />
                                    {t('teamMatch.title')}
                                </h4>

                                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-0 border border-teal-200">
                                    {/* Team Info */}


                                    {/* VS Display */}
                                    <div className="relative -mt-5">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full "></div>
                                        </div>

                                        <div className="relative flex justify-center">
                    <span className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-sm sm:text-base font-bold shadow-lg flex items-center gap-2">
                        <Trophy size={14} />
                        {t('teamMatch.vs')}
                    </span>
                                        </div>
                                    </div>

                                    {/* Match Info */}
                                    <div className="grid w-full grid-cols-3 gap-4 my-5">
                                            <div className="flex items-center justify-start px-8 mb-4">
                                                <div className="flex items-center gap-3">
                                                    {booking.teams[0]?.logo && !imageErrors['team1-logo'] ? (
                                                        <img
                                                            src={getImageUrl(booking.teams[0].logo)}
                                                            alt={booking.teams[0].name || "Team 1"}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                            onError={() => handleImageError('team1-logo')}
                                                        />
                                                    ) : (
                                                        <div className="lg:w-12 lg:h-12 w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                                <span className="text-white text-sm lg:text-lg font-bold">
                                   {getInitials(booking.teams[0]?.name || t('teamMatch.team1'))}
                                </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h5 className="font-bold text-sm lg:text-lg text-teal-800">
                                                            {booking.teams[0]?.name || "Team 1"}
                                                        </h5>
                                                        {/*<p className="text-sm text-gray-600">*/}
                                                        {/*    {booking.teams[0]?.players?.length || 0} Players*/}
                                                        {/*</p>*/}
                                                    </div>
                                                </div>
                                            </div>

                                        <div dir={'ltr'} className="text-center flex flex-col  justify-center items-center">
                                            <div className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold mb-2">
                                                {booking.num_of_players_per_team || booking.max_players || 0} vs {booking.num_of_players_per_team || booking.max_players || 0}
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">
                                                {booking.play_kind?.translations?.name || "Football"}
                                            </p>

                                        </div>
                                        <div className="flex items-center justify-end px-8 mb-4">
                                            <div className="flex items-center gap-3">
                                                {booking.teams[1]?.logo && !imageErrors['team2-logo'] ? (
                                                    <img
                                                        src={getImageUrl(booking.teams[1].logo)}
                                                        alt={booking.teams[1].name || "Team 2"}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                        onError={() => handleImageError('team2-logo')}
                                                    />
                                                ) : (
                                                    <div className="lg:w-12 lg:h-12 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                                    <span className="text-white text-sm lg:text-lg font-bold">
                                        {getInitials(booking.teams[1]?.name || t('teamMatch.team2'))}                                    </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <h5 className="font-bold text-sm lg:text-lg text-blue-800">
                                                        {booking.teams[1]?.name || "Team 2"}
                                                    </h5>
                                                    {/*<p className="text-sm text-gray-600">*/}
                                                    {/*    {booking.teams[1]?.players?.length || 0} Players*/}
                                                    {/*</p>*/}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Optional: Show which users are in this team */}
                                {booking.booking_action?.some(action => action.join_team?.id === booking.team_player?.id) && (
                                    <div className="mt-6">
                                        <h5 className="font-semibold text-gray-900 mb-3 text-sm">
                                            {t('teamMatch.members')}
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {booking.booking_action
                                                .filter(action => action.join_team?.id === booking.team_player?.id)
                                                .map((action, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                                        {action.user?.image && !imageErrors[`team-member-${idx}`] ? (
                                                            <img
                                                                src={getImageUrl(action.user.image)}
                                                                alt={action.user.name}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                                onError={() => handleImageError(`team-member-${idx}`)}
                                                            />
                                                        ) : (
                                                            <div className={`w-8 h-8 rounded-full ${getAvatarColor(action.user?.name)} flex items-center justify-center`}>
                                        <span className="text-white text-xs font-bold">
                                            {getInitials(action.user?.name)}
                                        </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-900">
                                                                {action.user?.name?.split(' ')[0] || 'Player'}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500">
                                                                Paid: {parseFloat(action.amount || 0).toFixed(2)} AED
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {booking.notes && (
                            <div className="border-t border-gray-100 pt-4 sm:pt-6 mt-4 sm:mt-6">
                                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">{t('customerNote.title')}</h4>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                        {booking.notes}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Order Summary Card */}
                        <div className="bg-white border-t border-gray-100 rounded-xl p-4 sm:p-6">
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-4 sm:mb-6">{t('orderSummary.title')}</h3>

                            {/* Payment Summary Cards */}

                            {/* Table Headers */}
                            <div className="grid px-2 grid-cols-12 sm:gap-2 pb-3 border-b-2 border-gray-200 mb-3">
                                <div className="col-span-3 min-w-[80px]">
                                    <span className="text-[10px] lg:text-sm font-semibold text-gray-600">        {t('orderSummary.user')}
</span>
                                </div>
                                <div className="col-span-2 min-w-[70px] text-center">
                                    <span className="text-[10px] lg:text-sm font-semibold text-gray-600">
                                        {t('orderSummary.subscription')}
                                   </span>
                                </div>
                                <div className="col-span-2 min-w-[60px] text-center">
                                    <span className="text-[10px] lg:text-sm font-semibold text-gray-600">        {t('orderSummary.fees')}
</span>
                                </div>
                                <div className="col-span-2 min-w-[70px] text-center">
                                    <span className="text-[10px] lg:text-sm font-semibold text-gray-600">        {t('orderSummary.discount')}
</span>
                                </div>
                                <div className="col-span-3 min-w-[90px] text-right">
                                    <span className="text-[10px] lg:text-sm font-semibold text-gray-600">        {t('orderSummary.amount')}
</span>
                                </div>
                            </div>

                            <div className="space-y-2 px-2 mb-4 sm:mb-6">
                                {booking.booking_action?.map((action, idx) => (
                                    <div key={idx} className="border-b border-gray-100 pb-3 mb-3">
                                        {/* User Info Row */}
                                        <div className="grid grid-cols-12 gap-2 sm:gap-4 py-2 items-center">
                                            {/* User Column - col-span-3 */}
                                            <div className="col-span-3 min-w-[80px]">
                                                <div className="flex items-center gap-2">
                                                    {action.user?.image && !imageErrors[`action-user-${idx}`] ? (
                                                        <img
                                                            src={getImageUrl(action.user.image)}
                                                            alt={action.user.name}
                                                            className="lg:w-8 hidden md:block lg:h-8 w-6 h-6 rounded-full object-cover"
                                                            onError={() => handleImageError(`action-user-${idx}`)}
                                                        />
                                                    ) : (
                                                        <div className={`lg:w-8 hidden md:block lg:h-8 w-6 h-6 rounded-full ${getAvatarColor(action.user?.name)} flex items-center justify-center`}>
                                    <span className="text-white text-[10px] font-bold">
                                        {getInitials(action.user?.name)}
                                    </span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[9px] font-medium text-gray-900 truncate">
                                                            {action.user?.name ? action.user.name.split(' ').slice(0, 2).join(' ') : 'Player'}
                                                        </p>
                                                        <p className="text-[8px] text-gray-500 truncate">
                                                            {action.user?.phone || ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Subscript Column - col-span-2 */}
                                            <div className="col-span-2 min-w-[70px] text-center">
                                                <p className="text-[10px] font-semibold text-gray-900">
                                                    {(parseFloat(action.amount || 0) - parseFloat(action.fees || 0) - parseFloat(action.discounted_amount || 0)).toFixed(2)} AED
                                                </p>
                                            </div>

                                            {/* Fees Column - col-span-2 */}
                                            <div className="col-span-2 min-w-[60px] text-center">
                                                <p className="text-[10px] font-semibold text-teal-600">
                                                    +{parseFloat(action.fees || 0).toFixed(2)}
                                                </p>
                                            </div>

                                            {/* Discount Column - col-span-2 */}
                                            <div className="col-span-2 min-w-[70px] text-center">
                                                <p className="text-[10px] font-semibold text-red-600">
                                                    -{parseFloat(action.discounted_amount || 0).toFixed(2)}
                                                </p>
                                            </div>

                                            {/* Amount Column - col-span-3 */}
                                            <div className="col-span-3 min-w-[90px] text-right">
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-900">
                                                        {parseFloat(action.amount || 0).toFixed(2)}
                                                    </p>
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    action.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        action.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                }`}>
                                    {action.status}
                                </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>


                            <div className="grid lg:grid-cols-2 gap-3 mb-6">


                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg px-4 py-3 flex items-center justify-between border border-green-200">
                                    <div className="flex items-center gap-2  ">
                                        <CheckCircle size={16} className="text-green-600" />
                                        <span className="text-sm text-green-600 font-semibold uppercase tracking-wide">{t('payment.collected')}</span>

                                    </div>
                                    <p className="text-xl font-bold text-green-700">{totalCollected.toFixed(2)} AED</p>
                                </div>

                                <div className="bg-gradient-to-br from-amber-50 flex items-center justify-between to-yellow-50 rounded-lg px-4 py-3 border border-amber-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock size={16} className="text-amber-600" />

                                        <span className="text-sm text-amber-600 font-semibold uppercase tracking-wide">{t('payment.pending')}</span>
                                    </div>
                                    <p className="text-xl font-bold text-amber-700">{totalPending.toFixed(2)} AED</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-teal-100 text-xs sm:text-sm font-medium mb-1">{t('orderSummary.totalAmount')}</p>
                                        <p className="text-white  sm:text-2xl font-bold">AED {totalAmount.toFixed(0)}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CreditCard size={24} className="text-white sm:w-7 sm:h-7" />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {!booking.accepted_by_pitch_owner &&
                                    <button
                                        onClick={()=>{handleAccept(!booking.accepted_by_pitch_owner)}}
                                        disabled={isActionLoading}
                                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        {t('actions.accept')}
                                    </button>
                                }
                                <button
                                    onClick={handleCancel}
                                    disabled={isActionLoading}
                                    className="w-full px-4 py-2.5 sm:py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs sm:text-sm font-semibold disabled:opacity-50 order-3 sm:order-1"
                                >
                                    {t('actions.cancel')}
                                </button>
                                <button onClick={handlePrint} className="px-4 w-full py-2.5 sm:py-3 text-xs sm:text-sm border-2 border-primary-500 text-primary-700 rounded-lg hover:bg-teal-50 transition-colors text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 order-1 sm:order-2">
                                    <Send size={16} />
                                    <span className="hidden sm:inline">{t('actions.sendInvoice')}</span>
                                    <span className="sm:hidden">{t('actions.sendInvoice')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailView;

const VenueInfoCard = ({ booking }) => {
    const { t } = useTranslation('bookingDetails');

    if (!booking?.venue_info) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-gray-500">{t('venueInfo.noInfo')}</p>
            </div>
        );
    }

    const venueType = booking.venue_info?.venue_type === 'indoor' ?
        t('venueInfo.indoor') : t('venueInfo.outdoor');

    return (
        <div className="w-full mx-auto rounded-xl overflow-hidden">
            <div className="min-h-48 md:min-h-64">
                <h4 className="font-bold text-gray-900 text-lg mb-3">
                    {booking.venue_info?.translations?.name || 'Zayed Sports Club'}
                </h4>

                <div className="space-y-2.5">
                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{booking.venue_info?.translations?.address || booking.venue_info?.city || t('venueInfo.address')}</span>
                    </div>

                    {/* Sports */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe size={16} className="text-gray-400 flex-shrink-0" />
                        <span>
                            {booking.venue_info?.venue_play_type?.map(sport => sport.translations?.name).join(', ') || t('venueInfo.sports')}
                        </span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{booking.venue_info?.phone_number || t('venueInfo.phone')}</span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{booking.venue_info?.email || t('venueInfo.email')}</span>
                    </div>

                    {/* Type */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{t('venueInfo.type', { type: venueType })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{booking.venue_info?.rate}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};