import {useEffect, useState} from 'react';
import {
    ArrowLeft, Calendar, CheckCircle, Clock, CreditCard,
    Mail, MapPin, Phone, Printer, Send, Users, MoreVertical,
    Shield, Globe, Trophy, Bell,Building, Download, Share2
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
import {useLocation, useNavigate} from "react-router-dom";
import  {IMAGE_BASE_URL} from '../../utils/ImageBaseURL.js'

const BookingDetailView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth); // Get user from Redux
    const { role } = user;
    // Get booking data from location state
    const bookingFromState = location.state?.booking;

    // Get booking ID from state or try to extract from URL if needed
    const bookingId = bookingFromState?.id || location.state?.bookingId;

    // Fetch booking data - use booking from state if available, otherwise fetch by ID
    const { booking: fetchedBooking, isLoading: isFetchingDetails, error: fetchError } = useBooking(bookingId);

    const { handleEmailClick, handleWhatsAppClick } = useContact();
    const { componentRef, handlePrint } = usePrint();
    const dispatch = useDispatch();

    // Use booking from state if available, otherwise use fetched data
    const booking =  fetchedBooking;
    const [isActionLoading, setIsActionLoading] = useState(false);
    const { cancelStatus, cancelError } = useSelector(state => state.bookings);

    useEffect(() => {
        if (cancelStatus === 'succeeded') {
            alert('Booking cancelled successfully');
            dispatch(clearCancelStatus());
            // Navigate back after successful cancellation
            navigate('/bookings');
        } else if (cancelStatus === 'failed') {
            alert('Failed to cancel booking: ' + cancelError);
            dispatch(clearCancelStatus());
        }
    }, [cancelStatus, cancelError, dispatch, navigate]);

    const handleBack = () => {
        // Go back to bookings list
        navigate('/bookings');
    };

    const handleRefresh = () => {
        // You can implement refresh logic if needed
        // For now, we'll just go back to the list which will refresh automatically
        navigate('/bookings');
    };

    if (!booking && isFetchingDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">No booking data available</p>
                    <button onClick={handleBack} className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg">
                        Go Back to Bookings
                    </button>
                </div>
            </div>
        );
    }

    const handleCustomerEmail = () => {
        const email = booking.user_info?.email;
        const customerName = booking.user_info?.name || 'Customer';
        const subject = `Booking #${String(booking.id).padStart(7, '0')} - ${booking.venue_info?.translations?.name || 'Venue'}`;
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
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCancel = async () => {
        try {
            const confirmed = await showConfirm({
                title: "Cancel Booking",
                text: "Are you sure you want to cancel this booking? This action cannot be undone.",
                confirmButtonText: "Yes, cancel booking",
                cancelButtonText: "Keep booking",
                icon: "warning"
            });

            if (confirmed) {
                setIsActionLoading(true);
                await bookingService.cancelBooking(booking.id);
                handleRefresh(); // Refresh and go back to list
            }
        } catch (err) {
            toast.error('Failed to cancel booking: ' + err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const totalAmount = parseFloat(booking.total_price || 0);
    const addonsTotal = booking.booking_addons?.reduce((sum, addon) => {
        return sum + (parseFloat(addon.addon_info?.price || 0) * addon.quantity);
    }, 0) || 0;
    const pitchTotal = totalAmount - addonsTotal;

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
        <div className="min-h-screen bg-gray-50">
            {/* ALWAYS render PrintableReceipt but keep it hidden */}
            <div style={{
                position: 'fixed',
                left: '-10000px',
                top: 0,
                zIndex: -1000
            }}>
                <PrintableReceipt ref={componentRef} booking={booking} logo={logo} />
            </div>

            {/* Header Section */}
            <div className="bg-white mx-4 rounded-xl">
                <div className="mx-auto px-4 sm:px-4 lg:py-3 py-1">
                    <div className="flex flex-col items-start justify-between gap-2">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-primary-700 hover:text-primary-600 transition-colors">
                                <ArrowIcon direction="left" size="lg" />
                                <span className="font-medium">Back to Bookings</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto px-4 sm:px-4 py-4 sm:py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column - Customer Profile */}
                    <div className="lg:col-span-1 order-1 lg:order-1">
                        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:sticky lg:top-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-900 text-base sm:text-lg">Customer Profile</h3>
                                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            {/* Profile Avatar */}
                            <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-gray-100">
                                <div className="relative mb-4">
                                    {booking.user_info?.image ? (
                                        <img
                                            src={IMAGE_BASE_URL + booking?.user_info?.image}
                                            alt={booking.user_info.name}
                                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-100 shadow-md"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-teal-100 flex items-center justify-center border-4 border-gray-100 shadow-md">
                                            <Users size={32} className="text-teal-600" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-teal-500 text-white p-1.5 rounded-full shadow-lg">
                                        <CheckCircle size={14} />
                                    </div>
                                </div>

                                <h4 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">
                                    {booking.user_info?.name || 'Unknown Customer'}
                                </h4>

                                {booking.venue_info?.rate && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <Trophy size={16} className="text-yellow-600" />
                                        <span className="font-bold text-yellow-700">{booking.venue_info.rate}</span>
                                        <span className="text-xs text-yellow-600">Rating</span>
                                    </div>
                                )}
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                                <h4 className="font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">Contact Details</h4>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Mail size={16} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">Email</p>
                                            <p className="text-xs sm:text-sm text-gray-900 truncate">{booking.user_info?.email || booking.venue_info?.owner_info?.email || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Phone size={16} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">Phone</p>
                                            <p className="text-xs sm:text-sm text-gray-900">{booking.user_info?.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <MapPin size={16} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">Location</p>
                                            <p className="text-xs sm:text-sm text-gray-900">{booking.venue_info?.translations?.address || booking.venue_info?.city || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="space-y-3 mb-6">
                                <h4 className="font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">Booking Information</h4>
                                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm text-gray-600">Customer Type</span>
                                        <span className="text-xs sm:text-sm font-semibold text-teal-600">
                                            {booking.split_payment ? 'Split Payment' : 'Individual'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm text-gray-600">Booking Type</span>
                                        <span className="text-xs sm:text-sm font-semibold text-teal-600">Online</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm text-gray-600">Payment Method</span>
                                        <span className="text-xs sm:text-sm font-semibold text-teal-600">Card</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCustomerEmail}
                                    className="px-4 py-2.5 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <Mail size={16} />
                                    <span className="hidden sm:inline">Email</span>
                                </button>
                                <button
                                    onClick={handleCustomerWhatsApp}
                                    className="px-4 py-2.5 text-xs sm:text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <Phone size={16} />
                                    <span>WhatsApp</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Venue and Order Details */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-md space-y-4 sm:space-y-2 order-1 lg:order-2">
                        <div className="bg-white rounded-xl p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="flex-1 w-full">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                            Booking ID: <span className="font-semibold text-gray-900">#{String(booking.id).padStart(7, '0')}</span>
                                        </h1>
                                        <span className={`w-fit px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${getStatusColor(booking.status)}`}>
                                            {booking.status?.toUpperCase() || 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="text-left flex gap-4 text-xs sm:text-sm text-gray-500 w-full sm:w-auto">
                                        <p>Created: {formatDate(booking.created_at)}</p>
                                        <p>Updated: {formatDate(booking.updated_at)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Printer size={18} />
                                    <span className="font-medium">Print Receipt</span>
                                </button>
                            </div>
                        </div>

                        {/* Venue Information Card */}
                        <div className="bg-white rounded-xl   overflow-hidden">
                            {/* Venue Image */}
                            <div className=" rounded-lg  ">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 sm:gap-8">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                            <Calendar className="text-teal-600" size={20} />
                                        </div>
                                        <div className={'flex gap-5'}>
                                            <p className="text-xs text-gray-600 font-medium">Booking Date</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {booking.start_time ? formatDate(booking.start_time) : 'Not set'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-teal-200"></div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                            <Clock className="text-teal-600" size={20} />
                                        </div>
                                        <div className={'flex gap-5'}>
                                            <p className="text-xs text-gray-600 font-medium">Time </p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {booking.start_time && booking.end_time
                                                    ? `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`
                                                    : 'Not set'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={'grid bg-primary-50 p-4 m-4 gap-5 rounded-xl sm:grid-cols-2'}>
                                <div className="relative rounded-lg  h-48  md:h-64">
                                    {/*booking.pitch?.image || booking.venue_info?.images?.[0]?.image ||*/}
                                    <img
                                        src={IMAGE_BASE_URL + booking.pitch?.image || booking.venue_info?.images?.[0]?.image }
                                        alt="Venue"
                                        className="w-full lg:h-64 h-48 object-cover rounded-xl"
                                    />
                                </div>
                                {booking?.venue_info && (
                                    <div className=" rounded-lg">
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
                                    Players ({booking.users.length})
                                </h4>
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                    {booking.users.slice(0, 8).map((user, idx) => (
                                        <div key={idx} className="relative group flex-shrink-0">
                                            {user.image ? (
                                                <img
                                                    src={IMAGE_BASE_URL + user.image}
                                                    alt={user.name}
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-3 border-white shadow-md hover:scale-110 transition-transform"
                                                    onClick={() => (role.is_admin || role.is_sub_admin) ?
                                                        navigate('/players/player-profile', { state: { player: user } }) :
                                                        undefined
                                                    }
                                                />
                                            ) : (
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-xs sm:text-sm font-bold border-3 border-white shadow-md hover:scale-110 transition-transform">
                                                    {user.name?.charAt(0) || 'U'}
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
                        {booking.notes && (
                            <div className="border-t border-gray-100 pt-4 sm:pt-6 mt-4 sm:mt-6">
                                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Customer Note</h4>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                        {booking.notes}
                                    </p>
                                </div>
                            </div>
                        )}
                        {/* Order Summary Card */}
                        <div className="bg-white border-t border-gray-100 rounded-xl p-4 sm:p-6">
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-4 sm:mb-6">Order Summary</h3>

                            {/* Table Headers */}
                            <div className="grid grid-cols-12 gap-2 sm:gap-4 pb-3 border-b-2 border-gray-200 mb-3">
                                <div className="col-span-5 sm:col-span-6">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Qty</span>
                                </div>
                                <div className="col-span-2 sm:col-span-2 text-right">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Price</span>
                                </div>
                                <div className="col-span-3 sm:col-span-2 text-right">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4 sm:mb-6">
                                {/* Pitch Booking Row */}
                                <div className="grid grid-cols-12 gap-2 sm:gap-4 py-2 border-b border-gray-100">
                                    <div className="col-span-5 sm:col-span-6">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {booking.pitch?.translations?.name || 'Pitch Booking'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {booking.venue_info?.translations?.name || 'Venue'}
                                        </p>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <p className="text-sm text-gray-700">1</p>
                                    </div>
                                    <div className="col-span-2 sm:col-span-2 text-right">
                                        <p className="text-sm text-gray-700">{pitchTotal.toFixed(0)}</p>
                                    </div>
                                    <div className="col-span-3 sm:col-span-2 text-right">
                                        <p className="text-sm font-semibold text-gray-900">{pitchTotal.toFixed(0)} AED</p>
                                    </div>
                                </div>

                                {/* Addons Rows */}
                                {booking.booking_addons?.map((addon, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 sm:gap-4 py-2 border-b border-gray-100">
                                        <div className="col-span-5 sm:col-span-6">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {addon.addon_info?.addon?.translations?.name || 'Add-on'}
                                            </p>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <p className="text-sm text-gray-700">{addon.quantity}</p>
                                        </div>
                                        <div className="col-span-2 sm:col-span-2 text-right">
                                            <p className="text-sm text-gray-700">{addon.addon_info?.price}</p>
                                        </div>
                                        <div className="col-span-3 sm:col-span-2 text-right">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {(parseFloat(addon.addon_info?.price || 0) * addon.quantity).toFixed(0)} AED
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2.5 mb-4 sm:mb-6">
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">{totalAmount.toFixed(0)} AED</span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-gray-600">TAX</span>
                                    <span className="font-semibold text-gray-900">0 AED</span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="font-semibold text-red-600">-0 AED</span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-teal-100 text-xs sm:text-sm font-medium mb-1">Total Amount</p>
                                        <p className="text-white text-xl sm:text-3xl font-bold">AED {totalAmount.toFixed(0)}</p>
                                    </div>
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CreditCard size={24} className="text-white sm:w-7 sm:h-7" />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={handleCancel}
                                    disabled={isActionLoading}
                                    className="px-4 py-2.5 sm:py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs sm:text-sm font-semibold disabled:opacity-50 order-3 sm:order-1"
                                >
                                    Cancel
                                </button>
                                <button   onClick={handlePrint} className="px-4 py-2.5 sm:py-3 border-2 border-primary-500 text-primary-700 rounded-lg hover:bg-teal-50 transition-colors text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 order-1 sm:order-2">
                                    <Send size={16} />
                                    <span className="hidden sm:inline">Invoice</span>
                                    <span className="sm:hidden">Send Invoice</span>
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
    if (!booking?.venue_info) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-gray-500">No venue information available</p>
            </div>
        );
    }


    return (
        <div className="w-full  mx-auto  rounded-xl   overflow-hidden">
            <div className="min-h-48  md:min-h-64">
                <h4 className="font-bold text-gray-900 text-lg mb-3">
                    {booking.venue_info?.translations?.name || 'Zayed Sports Club'}
                </h4>

                <div className="space-y-2.5">
                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{booking.venue_info?.translations?.address || booking.venue_info?.city || 'Bani Yas, Abu Dhabi'}</span>
                    </div>

                    {/* Sports */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe size={16} className="text-gray-400 flex-shrink-0" />
                        <span>
                                                    {booking.venue_info?.venue_play_type?.map(sport => sport.translations?.name).join(', ') || 'Soccer, Basketball'}
                                                </span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{booking.venue_info?.phone_number || '+1 234 567 8901'}</span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{booking.venue_info?.owner_info?.email || 'paris.milton@example.com'}</span>
                    </div>

                    {/* Type */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{booking.venue_info?.venue_type === 'indoor' ? '7v7, Indoor' : '7v7, Outdoor'}</span>
                    </div>
                </div>
            </div>
        </div>

    );
};