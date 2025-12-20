import { Bell, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { MdLogout } from "react-icons/md";

// Components & Hooks
import LanguageSwitcher from '../LanguageSwitcher.jsx';
import NotificationDropdown from "../NotificationDropdown.jsx";
import { selectPageTitle } from '../../features/pageTitle/pageTitleSlice';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from "../../hooks/useNotifications.js";
import { getImageUrl } from "../../utils/imageUtils.js";

const Header = ({ isSidebarCollapsed = false, onMenuClick }) => {
    const { direction } = useSelector((state) => state.language);
    const pageTitle = useSelector(selectPageTitle);

    // Updated to use 'header' namespace
    const { t } = useTranslation('header');

    const { user, isLoading } = useSelector((state) => state.auth);
    const { logout } = useAuth();
    const navigate = useNavigate();

    // ADD NOTIFICATION HOOK
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    } = useNotifications();

    const isRtl = direction === 'rtl';
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [hasImageError, setHasImageError] = useState(false);

    // Detect screen size
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Translate User Roles
    const getUserRole = () => {
        if (!user?.role) return t('roles.user');

        const role = user.role;

        if (role.is_admin) return t('roles.admin');
        if (role.is_sub_admin) return t('roles.subAdmin');
        if (role.is_pitch_owner) return t('roles.pitchOwner');
        if (role.is_sub_pitch_owner) return t('roles.subPitchOwner');
        if (role.is_staff) return t('roles.staff');

        return t('roles.user');
    };

    const getDisplayName = () => {
        return user?.name || t('roles.user');
    };

    // Function to get initials from name
    const getUserInitials = () => {
        if (!user?.name) return 'U';

        const name = user.name.trim();
        const nameParts = name.split(' ');

        if (nameParts.length === 1) {
            return name.charAt(0).toUpperCase();
        }

        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    };

    // Function to generate a color based on user's name
    const getAvatarColor = () => {
        const name = user?.name || 'User';
        const colors = [
            'from-primary-500 to-primary-600',
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const colorIndex = Math.abs(hash) % colors.length;
        return colors[colorIndex];
    };

    const handleProfileClick = () => {
        setShowProfile(false);
        navigate('/profile');
    };

    const handleLogout = async () => {
        try {
            logout();
            setShowProfile(false);
        } catch (error) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }
    };

    const handleClickOutside = () => {
        setShowNotifications(false);
        setShowProfile(false);
    };

    const getHeaderStyle = () => {
        if (isMobile) {
            return {
                left: 0,
                right: 0,
                width: '100%'
            };
        }

        const sidebarWidth = isSidebarCollapsed ? '4rem' : '14rem';
        return {
            width: `calc(100% - ${sidebarWidth})`,
            ...(isRtl ? { right: sidebarWidth } : { left: sidebarWidth })
        };
    };

    // Reset image error state when user changes
    useEffect(() => {
        setHasImageError(false);
    }, [user?.image]);

    // Loading state
    if (isLoading) {
        return (
            <header
                className="bg-white border-b border-primary-100 fixed top-0 z-40 w-full lg:h-20 h-16 transition-all duration-300 flex items-center"
                style={getHeaderStyle()}
            >
                <div className="flex items-center justify-between w-full px-4 lg:px-8">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <>
            {/* Click outside overlay */}
            {(showNotifications || showProfile) && (
                <div className="fixed inset-0 z-30" onClick={handleClickOutside} />
            )}

            <header
                className="bg-white border-b border-primary-100 fixed top-0 z-40 w-full lg:h-16 h-16 transition-all duration-300 flex items-center"
                style={getHeaderStyle()}
            >
                {/* Mobile menu button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                >
                    <Menu className="w-6 h-6 text-gray-600" />
                </button>

                <div className="flex items-center justify-between w-full px-4 lg:px-8">
                    {/* Welcome message */}
                    <div className="flex-1 lg:flex-none">
                        <h1 className="text-sm lg:text-xl font-bold text-gray-800">
                            {pageTitle || t('defaultTitle')}
                        </h1>
                        <p className="text-xs text-gray-500 hidden lg:block">
                            {t('welcome', { name: getDisplayName() })}
                        </p>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-2 lg:gap-4">
                        {/* Language Selector */}
                        <div className="">
                            <LanguageSwitcher />
                        </div>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    setShowProfile(false);
                                }}
                                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                                {/* Notification Badge */}
                                {unreadCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 font-semibold">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            <NotificationDropdown
                                notifications={notifications}
                                unreadCount={unreadCount}
                                isOpen={showNotifications}
                                onClose={() => setShowNotifications(false)}
                                onMarkAsRead={markAsRead}
                                onMarkAllAsRead={markAllAsRead}
                                onDelete={deleteNotification}
                                onClearAll={clearAll}
                                isRtl={isRtl}
                            />
                        </div>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowProfile(!showProfile);
                                    setShowNotifications(false);
                                }}
                                className="flex items-center gap-2 lg:gap-3 hover:bg-gray-100 rounded-lg p-1 lg:p-2 transition-colors"
                            >
                                <div className={`w-8 h-8 lg:w-9 lg:h-9 bg-gradient-to-br ${getAvatarColor()} rounded-full flex items-center justify-center overflow-hidden`}>
                                    {/* Show image if available and no error */}
                                    {user?.image && !hasImageError ? (
                                        <img
                                            src={getImageUrl(user.image)}
                                            alt={getDisplayName()}
                                            className="w-full h-full object-cover"
                                            onError={() => setHasImageError(true)}
                                            loading="lazy"
                                        />
                                    ) : (
                                        // Show initials or icon
                                        <span className="text-white font-semibold text-sm lg:text-base">
                                            {getUserInitials()}
                                        </span>
                                    )}
                                </div>
                                <div className={`hidden lg:block ${isRtl ? 'text-right' : 'text-left'}`}>
                                    <p className="text-sm font-medium text-gray-800">
                                        {getDisplayName()}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
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
                                        <button
                                            onClick={handleProfileClick}
                                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-start"
                                        >
                                            {t('profile')}
                                        </button>

                                        <hr className="my-2" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex gap-4 items-center text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <MdLogout />
                                            {t('logout')}
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