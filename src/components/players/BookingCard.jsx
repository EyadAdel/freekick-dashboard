import React from 'react';
import {
    Users,
    MapPin,
    Clock,
    Globe,
    CheckCircle,
    Clock as ClockIcon,
    XCircle,
    Users as UsersIcon,
    Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {useNavigate} from "react-router-dom";

const BookingCard = ({ booking }) => {
    const { t, i18n } = useTranslation(['players', 'common']);
    const navigate = useNavigate();

    const getStatusBadge = (status, acceptedByPitchOwner) => {
        const displayStatus = acceptedByPitchOwner && status !== 'cancelled' ? 'confirmed' : (status?.toLowerCase() || 'pending');

        const statusConfig = {
            confirmed: {
                color: 'bg-green-100 text-green-700',
                icon: CheckCircle,
                label: t('playersDetail.bookingStatus.confirmed')
            },
            pending: {
                color: 'bg-yellow-100 text-yellow-700',
                icon: ClockIcon,
                label: t('playersDetail.bookingStatus.pending')
            },
            cancelled: {
                color: 'bg-red-100 text-red-700',
                icon: XCircle,
                label: t('playersDetail.bookingStatus.cancelled')
            },
            matched: {
                color: 'bg-blue-100 text-blue-700',
                icon: UsersIcon,
                label: 'Matched'
            }
        };

        const config = statusConfig[displayStatus] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };

        // You might want to adjust locale based on i18n language
        const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';

        return new Intl.DateTimeFormat(locale, options).format(date);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: i18n.language === 'ar' ? false : true // Arabic typically uses 24-hour format
        };

        const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';

        return new Intl.DateTimeFormat(locale, options).format(date);
    };
    const handleViewBooking = (booking) => {
        navigate('/bookings/book-details', {
            state: {
                booking,
                from: '/bookings'
            }
        });
    };
    return (
        <div
            onClick={() => handleViewBooking(booking)}
            className="bg-white cursor-pointer rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                    {t('booking.bookingId', 'Booking ID')}:
                    <span className="text-gray-900"> {booking.id}</span>
                </span>
                {getStatusBadge(booking.status, booking.accepted_by_pitch_owner)}
            </div>

            <div className="p-4">
                <div className="flex justify-between items-center w-full gap-3 mb-4">
                    <div className="flex gap-2 items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900">
                                {booking.play_kind?.translations?.name || t('booking.match', 'Match')}
                            </h3>
                            {booking.max_players && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {booking.team_player || 0} / {booking.max_players} {t('booking.players', 'players')}
                                </p>
                            )}
                            <div className="flex text-xs items-center gap-4">
                                {booking.is_private ? (
                                    <span className="flex items-center gap-1 text-gray-400">
                                        <Lock className="w-3 h-3" />
                                        {t('booking.private', 'Private')}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-gray-400">
                                        <Globe className="w-3 h-3" />
                                        {t('booking.public', 'Public')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                                {booking.pitch?.translations?.name || t('booking.venue', 'Venue')}
                            </p>
                            <p className="text-xs text-gray-500">
                                {booking.pitch?.venue?.city || t('booking.location', 'Location')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                                {formatDate(booking.start_time)}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatTime(booking.start_time)}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xl font-bold text-emerald-600">
                            {booking.total_price} AED
                        </p>
                        {booking.split_payment && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                {t('booking.splitPayment', 'Split payment')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingCard;