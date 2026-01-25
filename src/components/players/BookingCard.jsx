import React from 'react';
import {
    Users,
    MapPin,
    Clock,
    Globe,
    CheckCircle,
    Clock as ClockIcon,
    XCircle,
    Lock,
    ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";

const BookingCard = ({ booking }) => {
    const { t, i18n } = useTranslation(['players', 'common']);
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl';

    // Helper: Status Badge Logic
    const getStatusBadge = (status, acceptedByPitchOwner) => {
        const displayStatus = acceptedByPitchOwner && status !== 'cancelled' ? 'confirmed' : (status?.toLowerCase() || 'pending');

        const statusConfig = {
            confirmed: {
                color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                icon: CheckCircle,
                label: t('playersDetail.bookingStatus.confirmed')
            },
            pending: {
                color: 'bg-amber-50 text-amber-700 border-amber-100',
                icon: ClockIcon,
                label: t('playersDetail.bookingStatus.pending')
            },
            cancelled: {
                color: 'bg-rose-50 text-rose-700 border-rose-100',
                icon: XCircle,
                label: t('playersDetail.bookingStatus.cancelled')
            },
            matched: {
                color: 'bg-blue-50 text-blue-700 border-blue-100',
                icon: Users,
                label: 'Matched'
            }
        };

        const config = statusConfig[displayStatus] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {config.label}
            </span>
        );
    };

    // Helper: Date Formatter
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
            day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
        }).format(date);
    };

    // Helper: Time Formatter
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
            hour: '2-digit', minute: '2-digit', hour12: i18n.language !== 'ar', timeZone: 'UTC'
        }).format(date);
    };

    const handleViewBooking = () => {
        navigate(`/bookings/book-details/${booking.id}`);
    };

    return (
        <div
            onClick={handleViewBooking}
            className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-emerald-500 cursor-pointer active:scale-[0.99] mb-4"
        >
            {/* 1. Header: ID and Status */}
            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                        Booking Id #{booking.id}
                    </span>
                    {booking.is_private ? (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                    )}
                </div>
                {getStatusBadge(booking.last_update, booking.accepted_by_pitch_owner)}
            </div>

            {/* 2. Content Body: Responsive Grid */}
            <div className="p-4 lg:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 items-center">

                    {/* Match Column */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-blue-100 bg-blue-50 flex items-center justify-center flex-shrink-0  group-hover:text-white transition-colors duration-300">
                            <Users className="w-6 h-6 text-blue-600 " />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 truncate">
                                {booking.play_kind?.translations?.name || t('booking.match', 'Match')}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                {booking.is_private ? t('booking.private', 'Private') : t('booking.public', 'Public')}
                            </p>
                        </div>
                    </div>

                    {/* Venue Column */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                            <MapPin className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold  truncate">
                                {booking.pitch?.translations?.name || t('booking.venue', 'Venue')}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                {booking.pitch?.venue?.city || t('booking.location', 'Location')}
                            </p>
                        </div>
                    </div>

                    {/* Date/Time Column */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 border border-orange-100">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900">
                                {formatDate(booking.start_time)}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                {formatTime(booking.start_time)}
                            </p>
                        </div>
                    </div>

                    {/* Pricing & CTA Column */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-50">
                        <div className="lg:text-end">
                            <div className="flex items-baseline gap-1 lg:justify-end">
                                <span className="text-2xl font-black text-emerald-600">{booking.total_price}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">AED</span>
                            </div>
                            {booking.split_payment && (
                                <p className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                                    {t('booking.splitPayment', 'SPLIT PAYMENT')}
                                </p>
                            )}
                        </div>

                        {/* Action Icon (Visible on Desktop) */}
                        <div className={`hidden lg:flex w-10 h-10 items-center justify-center rounded-full bg-gray-50 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 ${isRtl ? 'rotate-180' : ''}`}>
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
        </div>
    );
};

export default BookingCard;