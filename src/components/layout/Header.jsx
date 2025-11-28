import { Bell, Search, Settings, User } from 'lucide-react';
import { useState } from 'react';
import LanguageSwitcher from '../LanguageSwitcher.jsx';
import { selectPageTitle } from '../../features/pageTitle/pageTitleSlice';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { MdLogout } from "react-icons/md";

const Header = ({ isSidebarCollapsed = false }) => {
    // 1. Get direction from Redux to determine layout mode
    const { direction } = useSelector((state) => state.language);
    const pageTitle = useSelector(selectPageTitle);
    const { t } = useTranslation('common');

    const isRtl = direction === 'rtl';

    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const { user } = useSelector((state) => state.auth);
    const { logout } = useAuth();

    const notifications = [
        {
            id: 1,
            type: 'success',
            title: 'Booking confirmed',
            message: 'Ashraf Al-Shareel has confirmed his booking.',
            time: '11:30 AM',
            read: false
        },
        {
            id: 2,
            type: 'pending',
            title: 'New Request',
            message: 'New venue request pending approval.',
            time: '10:15 AM',
            read: true
        }
    ];

    // Helper function to get user role as string
    const getUserRole = () => {
        if (!user?.role) return 'User';

        if (typeof user.role === 'object') {
            const roleObj = user.role;
            if (roleObj.is_admin) return 'Admin';
            if (roleObj.is_sub_admin) return 'Sub Admin';
            if (roleObj.is_pitch_owner) return 'Pitch Owner';
            if (roleObj.is_sub_pitch_owner) return 'Sub Pitch Owner';
            if (roleObj.is_staff) return 'Staff';
            return 'User';
        }

        return user.role;
    };

    // Helper function to get display name
    const getDisplayName = () => {
        if (user?.first_name && user?.last_name) {
            return `${user.first_name} ${user.last_name}`;
        }
        return user?.username || 'User';
    };

    const handleLogout = async () => {
        try {
            // Use the logout function from useAuth hook
            logout();
            setShowProfile(false);
            // No need to redirect here - your auth flow should handle this
        } catch (error) {
            // Fallback: clear storage and redirect
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }
    };

    const handleClickOutside = () => {
        setShowNotifications(false);
        setShowProfile(false);
    };

    // 2. Dynamic Classes Helper
    // This ensures styles flip correctly without relying on complex CSS config
    const getSidebarOffsetClass = () => {
        const widthClass = isSidebarCollapsed ? '300ms' : '300ms'; // duration placeholder
        const gap = isSidebarCollapsed ? '4rem' /* 16 */ : '14rem' /* 56 */;

        // If RTL: Sidebar is on Right -> Header starts from right: gap, ends at left: 0
        // If LTR: Sidebar is on Left  -> Header starts from left: gap, ends at right: 0
        return isRtl
            ? { right: gap, left: 0 }
            : { left: gap, right: 0 };
    };

    return (
        <>
            {/* Click outside overlay */}
            {(showNotifications || showProfile) && (
                <div className="fixed inset-0 z-30" onClick={handleClickOutside} />
            )}

            <header
                className="bg-white border-b border-gray-200 fixed top-0 z-40 h-20 transition-all duration-300 flex items-center"
                style={getSidebarOffsetClass()} // Apply dynamic positioning
            >
                <div className="flex items-center justify-between w-full px-8">

                    {/* Welcome message */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {pageTitle || 'Dashboard'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Welcome, {getDisplayName()}
                        </p>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-4">

                        {/* Search Input */}
                        {/*<div className="relative">*/}
                        {/*    <Search*/}
                        {/*        className={`w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 ${*/}
                        {/*            isRtl ? 'right-3' : 'left-3'*/}
                        {/*        }`}*/}
                        {/*    />*/}
                        {/*    <input*/}
                        {/*        type="text"*/}
                        {/*        placeholder={`${t('search')}....`}*/}
                        {/*        className={`py-2 w-64 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-start ${*/}
                        {/*            isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'*/}
                        {/*        }`}*/}
                        {/*    />*/}
                        {/*</div>*/}

                        {/* Language Selector */}
                        <LanguageSwitcher />

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    setShowProfile(false);
                                }}
                                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Bell className="w-6 h-6 text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* Dropdown */}
                            {showNotifications && (
                                <div className={`absolute top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${
                                    isRtl ? 'left-0' : 'right-0'
                                }`}>
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                                        <button className="text-sm text-primary-600 hover:text-primary-700">
                                            Mark all as read
                                        </button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer text-start ${
                                                    !notification.read ? 'bg-primary-50' : ''
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-2 ${
                                                        notification.type === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                                                    }`}></div>
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-800 text-sm">{notification.title}</h4>
                                                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                                        <span className="text-xs text-gray-400 mt-2 block">{notification.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Settings */}
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Settings className="w-6 h-6 text-gray-600" />
                        </button>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowProfile(!showProfile);
                                    setShowNotifications(false);
                                }}
                                className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div className={`hidden lg:block ${isRtl ? 'text-right' : 'text-left'}`}>
                                    <p className="text-sm font-medium text-gray-800">
                                        {getDisplayName()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {getUserRole()}
                                    </p>
                                </div>
                            </button>

                            {/* Profile Dropdown */}
                            {showProfile && (
                                <div className={`absolute top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${
                                    isRtl ? 'left-0' : 'right-0'
                                }`}>
                                    <div className="p-2">
                                        <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-start">
                                            Profile
                                        </button>
                                        <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-start">
                                            Settings
                                        </button>
                                        <hr className="my-2" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex gap-4 items-center text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <MdLogout />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;