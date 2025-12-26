import React, { useState, useEffect, useCallback } from 'react';
import {
    Bell, Check, Filter, Search, CheckCircle,
    X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import useAnalytics from '../hooks/useAnalytics';
import {setPageTitle} from "../features/pageTitle/pageTitleSlice.js";
import {useDispatch} from "react-redux";

const NotificationsPage = () => {
    const {
        notifications: notificationsData,
        notificationsCount,
        isNotificationsLoading,
        getNotifications,
    } = useAnalytics();

    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageLimit] = useState(10);
    const [localReadIds, setLocalReadIds] = useState(() => {
        try {
            const stored = localStorage.getItem('readNotifications');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const { t } = useTranslation('notificationsPanel');
    const dispatch = useDispatch();

    // Save local read IDs to localStorage
    useEffect(() => {
        localStorage.setItem('readNotifications', JSON.stringify(localReadIds));
    }, [localReadIds]);
    useEffect(() => {
        dispatch(setPageTitle(t('title')));
    }, [dispatch, t]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Fetch notifications from API with pagination and search
    useEffect(() => {
        const params = {
            page: currentPage,
            page_limit: pageLimit,
            ordering: '-created_at',
        };

        if (debouncedSearch) {
            params.search = debouncedSearch;
        }

        getNotifications(params);
    }, [currentPage, debouncedSearch, pageLimit, getNotifications]);

    // Process notifications with local read status
    const processedNotifications = notificationsData?.map(notification => ({
        ...notification,
        read: localReadIds.includes(notification.id) || notification.is_active === false
    })) || [];

    // Filter notifications based on read status
    const filteredNotifications = processedNotifications.filter(notification => {
        if (filter === 'unread') return !notification.read;
        if (filter === 'read') return notification.read;
        return true;
    });

    const unreadCount = processedNotifications.filter(n => !n.read).length;
    const totalPages = Math.ceil((notificationsCount || 0) / pageLimit);

    const markAsRead = useCallback((id) => {
        setLocalReadIds(prev => {
            if (prev.includes(id)) return prev;
            return [...prev, id];
        });
    }, []);

    const markAllAsRead = useCallback(() => {
        const allIds = processedNotifications.map(n => n.id);
        setLocalReadIds(prev => {
            const newIds = allIds.filter(id => !prev.includes(id));
            return [...prev, ...newIds];
        });
    }, [processedNotifications]);

    const handleRefresh = () => {
        getNotifications({
            page: currentPage,
            page_limit: pageLimit,
            ordering: '-created_at',
            ...(debouncedSearch && { search: debouncedSearch })
        });
    };

    const getTimeAgo = (timestamp) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return t('time.justNow');
            if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
            if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
            if (diffDays === 1) return t('time.yesterday');
            if (diffDays < 30) return t('time.daysAgo', { count: diffDays });
            return format(date, 'MMM d');
        } catch {
            return t('time.recently');
        }
    };

    const formatTime = (timestamp) => {
        try {
            return format(new Date(timestamp), 'h:mm a');
        } catch {
            return '';
        }
    };

    const Pagination = () => {
        if (totalPages <= 1) return null;

        const getPageNumbers = () => {
            const pages = [];
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                if (currentPage <= 3) {
                    pages.push(1, 2, 3, 4, '...', totalPages);
                } else if (currentPage >= totalPages - 2) {
                    pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                } else {
                    pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                }
            }
            return pages;
        };

        return (
            <div dir={'ltr'}  className="flex items-center justify-center px-6 py-4 border-t border-gray-100">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-primary-500 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors lg:text-sm text-xs font-medium text-gray-700"
                >
                    <ChevronLeft/>
                </button>

                <div className="flex gap-2">
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                                ...
                            </span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    currentPage === page
                                        ? 'bg-primary-500 text-white'
                                        : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>

                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-primary-500 disabled:text-gray-500 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors lg:text-sm text-xs font-medium text-gray-700"
                >
                    <ChevronRight/>
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen lg:px-8 rounded-lg">
            {/* Header */}
            <div className="bg-white mb-5 lg:px-6 px-2 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="lg:w-12 lg:h-12 w-8 h-8 bg-primary-500 rounded-2xl flex items-center justify-center">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="lg:text-2xl text-sm font-bold text-gray-900">{t('title')}</h1>
                            <p className="lg:text-sm text-xs text-gray-500">
                                {notificationsCount || 0} {t('header.total')}
                            </p>
                            <p className="lg:text-sm text-xs text-gray-500">
                                {unreadCount} {t('header.unread')}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={isNotificationsLoading}
                            className="lg:px-4 px-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors lg:text-sm text-xs font-medium text-gray-700 flex items-center gap-2"
                        >
                            <svg className="lg:w-4 lg:h-4 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {t('actions.refresh')}
                        </button>

                        <button
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            className="lg:px-4 px-2 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors lg:text-sm text-xs font-medium flex items-center gap-2"
                        >
                            <CheckCircle className="lg:w-4 lg:h-4 w-3 h-3" />
                            {t('markAllRead')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('search.placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 transition-colors lg:text-sm text-xs"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 transition-colors lg:text-sm text-xs font-medium text-gray-700 bg-white"
                        >
                            <option value="all">{t('filters.all')} ({notificationsCount || 0})</option>
                            <option value="unread">{t('filters.unread')} ({unreadCount})</option>
                            <option value="read">{t('filters.read')} ({(notificationsCount || 0) - unreadCount})</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="">
                <div className="bg-white rounded-lg">
                    {isNotificationsLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-500"></div>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="lg:w-16 lg:h-16 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Bell className="lg:w-8 lg:h-8 w-5 h-5 text-gray-400" />
                            </div>
                            <h3 className="lg:text-lg text-sm font-semibold text-gray-900 mb-2">
                                {search ? t('empty') : t('emptyState.title')}
                            </h3>
                            <p className="text-gray-500 max-w-md">
                                {search ? t('search.noResults') : t('emptyState.description')}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y lg:px-5 rounded-lg divide-gray-100">
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-6 hover:bg-gray-50 transition-colors ${
                                            !notification.read ? 'bg-blue-50/30' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                    !notification.read ? 'bg-primary-500' : 'bg-gray-200'
                                                }`}>
                                                    <Bell className={`w-6 h-6 ${
                                                        !notification.read ? 'text-white' : 'text-gray-500'
                                                    }`} />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="lg:text-base text-sm font-semibold text-gray-900">
                                                            {notification.title || t('defaultTitle')}
                                                        </h3>
                                                        {!notification.read && (
                                                            <span className="inline-block mt-1 text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-medium">
                                                                {t('new')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 ml-4">
                                                        <span className="lg:text-sm text-xs text-gray-500">
                                                            {formatTime(notification.created_at)}
                                                        </span>
                                                        <span className="text-xs text-primary-500 font-medium">
                                                            {getTimeAgo(notification.created_at)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-gray-600 lg:text-sm text-xs mb-2">
                                                    {notification.message || t('defaultBody')}
                                                </p>
                                            </div>

                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="flex-shrink-0 p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                    title={t('actions.markAsRead')}
                                                >
                                                    <Check className="w-5 h-5 text-gray-400 hover:text-green-600" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Pagination />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;