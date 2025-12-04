// components/NotificationDropdown.jsx
// Add this new component for the notification dropdown

import React from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = ({
                                  notifications,
                                  unreadCount,
                                  isOpen,
                                  onClose,
                                  onMarkAsRead,
                                  onMarkAllAsRead,
                                  onDelete,
                                  onClearAll,
                                  isRtl = false
                              }) => {
    if (!isOpen) return null;

    const getTimeAgo = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    return (
        <div
            className={`absolute top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col ${
                isRtl ? 'left-0' : 'right-0'
            }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                        <>
                            <button
                                onClick={onMarkAllAsRead}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                title="Mark all as read"
                            >
                                Mark all read
                            </button>
                            <button
                                onClick={onClearAll}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                                title="Clear all"
                            >
                                Clear all
                            </button>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500">
                        <Bell className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No notifications yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                            We'll notify you when something arrives
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${
                                    !notification.read ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => onMarkAsRead(notification.id)}
                            >
                                {/* Unread indicator */}
                                {!notification.read && (
                                    <div className="absolute top-4 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}

                                <div className="flex gap-3 pl-4">
                                    {/* Image/Icon */}
                                    {notification.image ? (
                                        <img
                                            src={notification.image}
                                            alt=""
                                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Bell className="w-5 h-5 text-primary-600" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-1">
                                            {notification.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                            {notification.body}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {getTimeAgo(notification.timestamp)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notification.read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMarkAsRead(notification.id);
                                                }}
                                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="w-4 h-4 text-green-600" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(notification.id);
                                            }}
                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-1"
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;