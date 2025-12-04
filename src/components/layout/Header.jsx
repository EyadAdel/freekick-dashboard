// import { Bell, Search, Settings, User } from 'lucide-react';
// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // ADD THIS IMPORT
// import LanguageSwitcher from '../LanguageSwitcher.jsx';
// import { selectPageTitle } from '../../features/pageTitle/pageTitleSlice';
// import { useTranslation } from 'react-i18next';
// import { useDispatch, useSelector } from 'react-redux';
// import { useAuth } from '../../hooks/useAuth';
// import { MdLogout } from "react-icons/md";
// import { Menu } from 'lucide-react';
// import NotificationHandler from "../NotificationHandler.jsx";
//
// const Header = ({ isSidebarCollapsed = false, onMenuClick }) => {
//     const { direction } = useSelector((state) => state.language);
//     const pageTitle = useSelector(selectPageTitle);
//     const { t } = useTranslation('common');
//     const { user, isLoading } = useSelector((state) => state.auth);
//     const { logout } = useAuth();
//     const navigate = useNavigate(); // ADD THIS HOOK
//
//     const isRtl = direction === 'rtl';
//     const [showNotifications, setShowNotifications] = useState(false);
//     const [showProfile, setShowProfile] = useState(false);
//     const [isMobile, setIsMobile] = useState(false);
//
//     // Detect screen size
//     useEffect(() => {
//         const checkScreenSize = () => {
//             setIsMobile(window.innerWidth < 1024);
//         };
//
//         checkScreenSize();
//         window.addEventListener('resize', checkScreenSize);
//
//         return () => window.removeEventListener('resize', checkScreenSize);
//     }, []);
//
//     const getUserRole = () => {
//         if (!user?.role) return 'User';
//
//         const role = user.role;
//
//         if (role.is_admin) return 'Admin';
//         if (role.is_sub_admin) return 'Sub Admin';
//         if (role.is_pitch_owner) return 'Pitch Owner';
//         if (role.is_sub_pitch_owner) return 'Sub Pitch Owner';
//         if (role.is_staff) return 'Staff';
//
//         return 'User';
//     };
//
//     const getDisplayName = () => {
//         return user?.name || 'User';
//     };
//
//     // ADD THIS FUNCTION
//     const handleProfileClick = () => {
//         setShowProfile(false); // Close the dropdown
//         navigate('/profile'); // Navigate to profile page
//     };
//
//     const handleLogout = async () => {
//         try {
//             logout();
//             setShowProfile(false);
//         } catch (error) {
//             localStorage.removeItem('authToken');
//             localStorage.removeItem('refreshToken');
//             window.location.href = '/login';
//         }
//     };
//
//     const handleClickOutside = () => {
//         setShowNotifications(false);
//         setShowProfile(false);
//     };
//
//     // FIXED: Simplified header positioning
//     const getHeaderStyle = () => {
//         // For mobile and tablet, header should be full width
//         if (isMobile) {
//             return {
//                 left: 0,
//                 right: 0,
//                 width: '100%'
//             };
//         }
//
//         // For desktop, calculate proper width based on sidebar state
//         const sidebarWidth = isSidebarCollapsed ? '4rem' : '14rem';
//         return {
//             width: `calc(100% - ${sidebarWidth})`,
//             ...(isRtl ? { right: sidebarWidth } : { left: sidebarWidth })
//         };
//     };
//
//     // Loading state
//     if (isLoading) {
//         return (
//             <header
//                 className="bg-white border-b border-primary-100 fixed top-0 z-40 w-full lg:h-20 h-16 transition-all duration-300 flex items-center"
//                 style={getHeaderStyle()}
//             >
//                 <div className="flex items-center justify-between w-full px-4 lg:px-8">
//                     <div className="animate-pulse">
//                         <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
//                         <div className="h-4 bg-gray-200 rounded w-32"></div>
//                     </div>
//                 </div>
//             </header>
//         );
//     }
//
//     return (
//         <>
//             {/* Click outside overlay */}
//             {(showNotifications || showProfile) && (
//                 <div className="fixed inset-0 z-30" onClick={handleClickOutside} />
//             )}
//
//             <header
//                 className="bg-white border-b border-primary-100 fixed top-0 z-40 w-full lg:h-16 h-16 transition-all duration-300 flex items-center"
//                 style={getHeaderStyle()}
//             >
//                 {/* Mobile menu button */}
//                 <button
//                     onClick={onMenuClick}
//                     className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
//                 >
//                     <Menu className="w-6 h-6 text-gray-600" />
//                 </button>
//
//                 <div className="flex items-center justify-between w-full px-4 lg:px-8">
//                     {/* Welcome message */}
//                     <div className="flex-1 lg:flex-none">
//                         <h1 className="text-lg lg:text-xl font-bold text-gray-800">
//                             {pageTitle || 'Dashboard'}
//                         </h1>
//                         <p className="text-xs text-gray-500 hidden lg:block">
//                             Welcome, {getDisplayName()}
//                         </p>
//                     </div>
//
//                     {/* Right side - Actions */}
//                     <div className="flex items-center gap-2 lg:gap-4">
//                         {/* Language Selector */}
//                         <div className="">
//                             <LanguageSwitcher />
//                         </div>
//
//                         {/* Notifications */}
//                         <div className="relative">
//                             <button
//                                 onClick={() => {
//                                     setShowNotifications(!showNotifications);
//                                     setShowProfile(false);
//                                 }}
//                                 className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                             >
//                                 <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
//                                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
//                             </button>
//
//                             {/* Dropdown */}
//                             {showNotifications && (
//                                 <div className={`absolute top-full mt-2 w-80 lg:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${
//                                     isRtl ? 'left-0' : 'right-0'
//                                 }`}>
//                                     <div className="p-4 border-b border-gray-200 flex items-center justify-between">
//                                         <h3 className="font-semibold text-gray-800">Notifications</h3>
//                                        {/*<NotificationHandler/>*/}
//                                     </div>
//                                     <div className="max-h-96 overflow-y-auto">
//                                         {/* Your notifications content */}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//
//                         {/* Profile */}
//                         <div className="relative">
//                             <button
//                                 onClick={() => {
//                                     setShowProfile(!showProfile);
//                                     setShowNotifications(false);
//                                 }}
//                                 className="flex items-center gap-2 lg:gap-3 hover:bg-gray-100 rounded-lg p-1 lg:p-2 transition-colors"
//                             >
//                                 <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center overflow-hidden">
//                                     <img
//                                         src={'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSweN5K2yaBwZpz5W9CxY9S41DI-2LawmjzYw&s'}
//                                         alt={getDisplayName()}
//                                         className="w-full h-full object-cover"
//                                     />
//                                 </div>
//                                 <div className={`hidden lg:block ${isRtl ? 'text-right' : 'text-left'}`}>
//                                     <p className="text-sm font-medium text-gray-800">
//                                         {getDisplayName()}
//                                     </p>
//                                     <p className="text-[10px] text-gray-500">
//                                         {getUserRole()}
//                                     </p>
//                                 </div>
//                             </button>
//
//                             {/* Profile Dropdown */}
//                             {showProfile && (
//                                 <div className={`absolute top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${
//                                     isRtl ? 'left-0' : 'right-0'
//                                 }`}>
//                                     <div className="p-2">
//                                         {/* UPDATED BUTTON - added onClick handler */}
//                                         <button
//                                             onClick={handleProfileClick}
//                                             className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-start"
//                                         >
//                                             Profile
//                                         </button>
//
//                                         <hr className="my-2" />
//                                         <button
//                                             onClick={handleLogout}
//                                             className="w-full flex gap-4 items-center text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
//                                         >
//                                             <MdLogout />
//                                             Logout
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </header>
//         </>
//     );
// };
//
// export default Header;
// Header.jsx - UPDATED VERSION
import { Bell, Settings, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../LanguageSwitcher.jsx';
import { selectPageTitle } from '../../features/pageTitle/pageTitleSlice';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { MdLogout } from "react-icons/md";
import { Menu } from 'lucide-react';
import NotificationHandler from "../NotificationHandler.jsx";
import NotificationDropdown from "../NotificationDropdown.jsx";
import { useNotifications } from "../../hooks/useNotifications.js"; // ADD THIS IMPORT

const Header = ({ isSidebarCollapsed = false, onMenuClick }) => {
    const { direction } = useSelector((state) => state.language);
    const pageTitle = useSelector(selectPageTitle);
    const { t } = useTranslation('common');
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

    // Detect screen size
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const getUserRole = () => {
        if (!user?.role) return 'User';

        const role = user.role;

        if (role.is_admin) return 'Admin';
        if (role.is_sub_admin) return 'Sub Admin';
        if (role.is_pitch_owner) return 'Pitch Owner';
        if (role.is_sub_pitch_owner) return 'Sub Pitch Owner';
        if (role.is_staff) return 'Staff';

        return 'User';
    };

    const getDisplayName = () => {
        return user?.name || 'User';
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
                        <h1 className="text-lg lg:text-xl font-bold text-gray-800">
                            {pageTitle || 'Dashboard'}
                        </h1>
                        <p className="text-xs text-gray-500 hidden lg:block">
                            Welcome, {getDisplayName()}
                        </p>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-2 lg:gap-4">
                        {/* Language Selector */}
                        <div className="">
                            <LanguageSwitcher />
                        </div>

                        {/* Notifications - UPDATED */}
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
                                <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center overflow-hidden">
                                    <img
                                        src={'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSweN5K2yaBwZpz5W9CxY9S41DI-2LawmjzYw&s'}
                                        alt={getDisplayName()}
                                        className="w-full h-full object-cover"
                                    />
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
                                            Profile
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