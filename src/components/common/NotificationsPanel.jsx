// components/NotificationsPanel.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../hooks/useNotifications.js';

const NotificationsPanel = () => {
    const { t, i18n } = useTranslation('notificationsPanel');
    const navigate = useNavigate();
    const {
        notifications,
        isLoading,
        markAsRead,
        refreshNotifications
    } = useNotifications();

    const getNotificationIcon = (notification) => {
        const title = notification.title?.toLowerCase() || '';

        if (title.includes('confirm')) {
            return (
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        } else if (title.includes('cancel')) {
            return (
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            );
        } else if (title.includes('request')) {
            return (
                <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
        }

        return (
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>
        );
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / 60000);

        if (diffInMinutes < 1) return t('time.justNow');
        if (diffInMinutes < 60) return t('time.minutesAgo', { count: diffInMinutes });

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return t('time.hoursAgo', { count: diffInHours });

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return t('time.yesterday');
        if (diffInDays < 7) return t('time.daysAgo', { count: diffInDays });

        const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
        return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // Navigate based on notification type or model_id
        if (notification.model_id) {
            navigate(`/bookings/${notification.model_id}`);
        }
    };

    const handleViewAllClick = () => {
        navigate('/my-notifications');
    };

    // Show only the first 5 notifications in the panel
    const notificationsToShow = notifications.slice(0, 5);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
                <div className="flex items-center gap-2">
                    <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={refreshNotifications}
                        disabled={isLoading}
                        title={t('refresh')}
                    >
                        <svg
                            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Scrollable notifications container */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-gray-500 text-sm">{t('empty')}</p>
                    </div>
                ) : (
                    notificationsToShow.map((notification, index) => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors relative ${
                                !notification.read
                                    ? 'bg-blue-50 hover:bg-blue-100'
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {/* Vertical dashed line connecting icons - only show for first 4 items */}
                            {index < Math.min(notifications.length, 5) - 1 && (
                                <div className="absolute left-8 rtl:right-8 rtl:left-auto top-[52px] h-[calc(100%+16px)] w-0 border-l border-dashed border-gray-300"></div>
                            )}

                            {getNotificationIcon(notification)}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                        {notification.title || t('defaultTitle')}
                                    </h3>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {formatTime(notification.timestamp)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notification.body || t('defaultBody')}
                                </p>
                                {!notification.read && (
                                    <span className="inline-block mt-1 text-xs text-blue-600 font-medium">
                                        {t('new')}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* View All button - Always shows if there are notifications */}
            {notifications.length > 0 && (
                <button
                    onClick={handleViewAllClick}
                    className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2 border-t border-gray-100 pt-3 mt-2"
                >
                    {t('viewAll')}
                </button>
            )}
        </div>
    );
};

export default NotificationsPanel;