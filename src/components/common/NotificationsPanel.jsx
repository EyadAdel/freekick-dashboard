import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAnalytics from '../../hooks/useAnalytics';

const NotificationsPanel = () => {
    const navigate = useNavigate();
    const {
        notifications,
        notificationsCount,
        isNotificationsLoading,
        getNotifications,
        markAsRead,
        error
    } = useAnalytics();
    useEffect(() => {
        // Fetch latest 5 notifications
        getNotifications({ page_limit: 5, ordering: '-created_at' });
    }, []);
    console.log(notifications,'ggggggg')
    const getNotificationIcon = (notification) => {
        const title = notification.title?.toLowerCase() || '';

        if (title.includes('confirm')) {
            return (
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        } else if (title.includes('cancel')) {
            return (
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            );
        } else if (title.includes('request')) {
            return (
                <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
        }

        // Default notification icon
        return (
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
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

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleNotificationClick = (notification) => {
        // Mark as read if needed
        if (!notification.is_active) {
            markAsRead(notification.id);
        }

        // Navigate based on notification type or model_id
        if (notification.model_id) {
            navigate(`/bookings/${notification.model_id}`);
        }
    };

    const handleViewMore = () => {
        // navigate('/notifications');
    };

    if (error.notifications) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                </div>
                <div className="text-center py-8">
                    <p className="text-red-500 text-sm">Failed to load notifications</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => getNotifications({ page_limit: 5, ordering: '-created_at' })}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            <div className="space-y-4">
                {isNotificationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-gray-500 text-sm">No notifications yet</p>
                    </div>
                ) : (notifications.map((notification,index) => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors relative ${
                                !notification.is_active
                                    ? 'bg-blue-50 hover:bg-blue-100'
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {/* Vertical dashed line connecting icons */}
                            {index < notifications.length - 1 && (
                                <div className="absolute    left-8 top-[52px] h-[calc(100%+16px)] w-0 border-l border-primary-700  border border-dashed border-gray-300"></div>
                            )}

                            {getNotificationIcon(notification)}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                        {notification.title || 'Notification'}
                                    </h3>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {formatTime(notification.created_at)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notification.message || 'No message content'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {notifications.length > 0 && (
                <button
                    onClick={handleViewMore}
                    className="w-full mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2"
                >
                    View more
                </button>
            )}
        </div>
    );
};

export default NotificationsPanel;