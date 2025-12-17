import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Users, Bell, User, ChevronDown, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { notificationService } from "../../services/notificationService.js";
import { toast } from 'react-toastify';
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";

function AppsNotifications() {
    const { t } = useTranslation('notifications');
    const dispatch = useDispatch();
    const dropdownRef = useRef(null);
    const listRef = useRef(null);

    // --- FORM DATA ---
    const [formData, setFormData] = useState({
        send_kind: 'all_users',
        users: [],
        is_active: true,
        title: '',
        message: '',
        send_sms: false,
        send_whatsapp: false,
        send_app_notification: true,
    });

    // --- USERS & SEARCH STATE ---
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [showUserSelect, setShowUserSelect] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- PAGINATION STATE ---
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageLimit: 20,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
        nextPage: null,
        previousPage: null
    });

    // --- TITLE ---
    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);

    // --- FETCH USERS WITH DEBOUNCE ---
    useEffect(() => {
        // Only fetch if "Specific Users" is selected
        if (formData.send_kind !== 'other') return;

        // Debounce logic: wait 500ms after typing stops
        const delayDebounceFn = setTimeout(async () => {
            setFetchingUsers(true);
            try {
                // Reset to page 1 when searching
                const params = {
                    page: pagination.currentPage,
                    page_limit: pagination.pageLimit,
                    search: searchTerm || ''
                };

                const data = await notificationService.fetchUsers(params);

                // Handle paginated response
                const userList = data.results || data.data?.results || data.data || [];

                // Update users list
                setUsers(userList);

                // Update pagination info
                setPagination(prev => ({
                    ...prev,
                    currentPage: data.current_page || 1,
                    totalPages: Math.ceil((data.count || 0) / prev.pageLimit),
                    totalCount: data.count || 0,
                    hasNext: !!data.next,
                    hasPrevious: !!data.previous,
                    nextPage: data.next,
                    previousPage: data.previous
                }));

            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setFetchingUsers(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [formData.send_kind, searchTerm, pagination.currentPage]); // Added currentPage dependency

    // --- PAGINATION HANDLERS ---
    const handleNextPage = () => {
        if (pagination.hasNext) {
            setPagination(prev => ({
                ...prev,
                currentPage: prev.currentPage + 1
            }));
            scrollToTop();
        }
    };

    const handlePreviousPage = () => {
        if (pagination.hasPrevious) {
            setPagination(prev => ({
                ...prev,
                currentPage: prev.currentPage - 1
            }));
            scrollToTop();
        }
    };

    const handlePageClick = (pageNumber) => {
        setPagination(prev => ({
            ...prev,
            currentPage: pageNumber
        }));
        scrollToTop();
    };

    const scrollToTop = () => {
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
    };

    // --- CLICK OUTSIDE HANDLER ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowUserSelect(false);
            }
        };

        if (showUserSelect) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserSelect]);

    // --- HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSendKindChange = (e) => {
        const value = e.target.value;
        setFormData((prev) => ({
            ...prev,
            send_kind: value,
            users: value === 'all_users' ? [] : prev.users,
        }));

        // Reset user related states when switching modes
        if (value !== 'other') {
            setSelectedUsers([]);
            setShowUserSelect(false);
            setSearchTerm('');
            setUsers([]);
            setPagination({
                currentPage: 1,
                pageLimit: 20,
                totalPages: 1,
                totalCount: 0,
                hasNext: false,
                hasPrevious: false,
                nextPage: null,
                previousPage: null
            });
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers((prev) => {
            if (prev.includes(userId)) {
                return prev.filter((id) => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            toast.error(t('errors.titleRequired'));
            return;
        }

        if (!formData.message.trim()) {
            toast.error(t('errors.messageRequired'));
            return;
        }

        if (formData.send_kind === 'other' && selectedUsers.length === 0) {
            toast.error(t('errors.usersRequired'));
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                users: formData.send_kind === 'other' ? selectedUsers : [],
            };

            await notificationService.sendNotification(payload);
            toast.success(t('success.sent'));

            // Reset state
            setFormData({
                send_kind: 'all_users',
                users: [],
                is_active: true,
                title: '',
                message: '',
                send_sms: false,
                send_whatsapp: false,
                send_app_notification: true,
            });
            setSelectedUsers([]);
            setShowUserSelect(false);
            setSearchTerm('');
            setUsers([]);
            setPagination({
                currentPage: 1,
                pageLimit: 20,
                totalPages: 1,
                totalCount: 0,
                hasNext: false,
                hasPrevious: false,
                nextPage: null,
                previousPage: null
            });
        } catch (error) {
            toast.error(error.message || t('errors.sendFailed'));
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER PAGINATION CONTROLS ---
    const renderPagination = () => {
        const { currentPage, totalPages, totalCount } = pagination;

        if (totalCount === 0) return null;

        const pageNumbers = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    {/* Results count */}
                    <div className="text-xs text-gray-600">
                        {t('pagination.showing', { count: totalCount })}
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center gap-1">
                        {/* Previous button */}
                        <button
                            onClick={handlePreviousPage}
                            disabled={!pagination.hasPrevious || fetchingUsers}
                            className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                            {pageNumbers.map(page => (
                                <button
                                    key={page}
                                    onClick={() => handlePageClick(page)}
                                    disabled={fetchingUsers}
                                    className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors ${
                                        currentPage === page
                                            ? 'bg-primary-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    } ${fetchingUsers ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Ellipsis for large page counts */}
                            {endPage < totalPages && (
                                <span className="px-2 text-gray-500">...</span>
                            )}
                        </div>

                        {/* Next button */}
                        <button
                            onClick={handleNextPage}
                            disabled={!pagination.hasNext || fetchingUsers}
                            className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Page info */}
                    <div className="text-xs text-gray-600">
                        {t('pagination.pageOf', { current: currentPage, total: totalPages })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 px-3 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm ">
                    {/* Header */}
                    <div className="border-b border-gray-200 px-4 mx-5 sm:px-6 py-4 sm:py-5">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary-100 p-2 rounded-lg">
                                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{t('header.title')}</h1>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{t('header.subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                        {/* Send Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                {t('recipients.label')}
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="send_kind"
                                        value="all_users"
                                        checked={formData.send_kind === 'all_users'}
                                        onChange={handleSendKindChange}
                                        className="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <span className="block text-sm font-medium text-gray-900">{t('recipients.allUsers.title')}</span>
                                        <span className="block text-xs text-gray-500 mt-0.5">{t('recipients.allUsers.description')}</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="send_kind"
                                        value="pitch_users"
                                        checked={formData.send_kind === 'pitch_users'}
                                        onChange={handleSendKindChange}
                                        className="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <span className="block text-sm font-medium text-gray-900">{t('recipients.pitchUsers.title')}</span>
                                        <span className="block text-xs text-gray-500 mt-0.5">{t('recipients.pitchUsers.description')}</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="send_kind"
                                        value="other"
                                        checked={formData.send_kind === 'other'}
                                        onChange={handleSendKindChange}
                                        className="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <span className="block text-sm font-medium text-gray-900">{t('recipients.specificUsers.title')}</span>
                                        <span className="block text-xs text-gray-500 mt-0.5">{t('recipients.specificUsers.description')}</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* User Selection Dropdown */}
                        {formData.send_kind === 'other' && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200" ref={dropdownRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    <Users className="inline w-4 h-4 mr-1.5 mb-0.5" />
                                    {t('userSelection.label')}
                                    {selectedUsers.length > 0 && (
                                        <span className="ml-2 text-xs font-normal text-primary-600">
                                            ({t('userSelection.selected', { count: selectedUsers.length })})
                                        </span>
                                    )}
                                </label>

                                {/* Dropdown Trigger Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowUserSelect(!showUserSelect)}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:bg-gray-50 transition-colors text-sm"
                                >
                                    <span className="flex items-center gap-2 text-gray-700 truncate">
                                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        {selectedUsers.length > 0
                                            ? t('userSelection.usersSelected', { count: selectedUsers.length })
                                            : t('userSelection.placeholder')}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showUserSelect ? 'transform rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Content */}
                                {showUserSelect && (
                                    <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                                        {/* Search Input Sticky Header */}
                                        <div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => {
                                                        setSearchTerm(e.target.value);
                                                        // Reset to first page when searching
                                                        setPagination(prev => ({ ...prev, currentPage: 1 }));
                                                    }}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                    placeholder={t('userSelection.search', 'Search users...')}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {/* User List with ref for scrolling */}
                                        <div className="max-h-60 overflow-y-auto" ref={listRef}>
                                            {fetchingUsers ? (
                                                <div className="p-6 text-center">
                                                    <Loader2 className="w-6 h-6 text-primary-600 animate-spin mx-auto"/>
                                                    <p className="mt-2 text-sm text-gray-500">{t('userSelection.loading')}</p>
                                                </div>
                                            ) : users.length === 0 ? (
                                                <div className="p-6 text-center text-gray-500">
                                                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                                    <p className="text-sm">{t('userSelection.noUsers')}</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-100">
                                                    {users.map((user) => (
                                                        <label
                                                            key={user.id}
                                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsers.includes(user.id)}
                                                                onChange={() => toggleUserSelection(user.id)}
                                                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                                    {user.name || user.username || `User ${user.id}`}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    {user.phone && <span>{user.phone}</span>}
                                                                    {user.email && <span>• {user.email}</span>}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Pagination Controls */}
                                        {renderPagination()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ... rest of your form components remain the same ... */}
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('form.title.label')} <span className="text-red-500">{t('form.title.required')}</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm text-gray-900 placeholder-gray-400"
                                placeholder={t('form.title.placeholder')}
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('form.message.label')} <span className="text-red-500">{t('form.message.required')}</span>
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                rows="4"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm text-gray-900 placeholder-gray-400 resize-none"
                                placeholder={t('form.message.placeholder')}
                            />
                        </div>

                        {/* Delivery Options */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                {t('form.channels.label')}
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="send_app_notification"
                                        checked={formData.send_app_notification}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">{t('form.channels.app')}</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="send_sms"
                                        checked={formData.send_sms}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">{t('form.channels.sms')}</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="send_whatsapp"
                                        checked={formData.send_whatsapp}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">{t('form.channels.whatsapp')}</span>
                                </label>
                            </div>
                        </div>

                        {/* Active Status */}
                        <div className="pt-4 border-t border-gray-200">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">{t('form.activeStatus')}</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm sm:text-base">{t('buttons.sending')}</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span className="text-sm sm:text-base">{t('buttons.send')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppsNotifications;