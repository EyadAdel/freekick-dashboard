import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Calendar,
    MapPin,
    Landmark,
    PlusCircle,
    Layers,
    Trophy,
    Ticket,
    Image,
    Bell,
    DollarSign,
    FileText,
    CreditCard,
    Users,
    UserCheck,
    FileEdit,
    HeadphonesIcon,
    ChevronLeft,
    ChevronRight,
    Grid,
    TrendingUp,
    Dribbble
} from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import logo from '../../assets/logo.svg';
import ScrollArea from '../common/ScrollArea.jsx';
import { FaCalendarAlt } from "react-icons/fa";

const Sidebar = ({ onToggle }) => {
    const location = useLocation();
    const { t } = useTranslation('sidebar');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [tooltip, setTooltip] = useState({ show: false, label: '', top: 0 });
    const { direction } = useSelector((state) => state.language);
    const { user } = useSelector((state) => state.auth); // Get user from Redux

    const handleToggle = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        if (onToggle) {
            onToggle(newState);
        }
    };

    // Check if user has permission based on role
    const hasPermission = (permission) => {
        if (!user || !user.role) return false;

        const { role } = user;

        // Define permission mapping based on roles
        const permissions = {
            // Admin permissions
            admin: role.is_admin || role.is_superuser || role.is_staff,

            // Pitch Owner permissions
            pitch_owner: role.is_pitch_owner,

            // Sub Admin permissions
            sub_admin: role.is_sub_admin,

            // Sub Pitch Owner permissions
            sub_pitch_owner: role.is_sub_pitch_owner,

            // Staff permissions (view only)
            staff: role.is_staff,
            except_sub_pitch:role.is_pitch_owner || role.is_sub_admin || role.is_admin  ,


            // Specific module permissions
            can_view_venues: role.is_admin || role.is_staff || role.is_pitch_owner,
            can_view_bookings: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
            can_view_finance: role.is_admin || role.is_staff,
            can_view_users: role.is_admin || role.is_staff,
            can_view_display: role.is_admin || role.is_staff,
            can_view_players: role.is_admin ||  role.is_sub_admin,
            can_view_teams: role.is_admin ||  role.is_sub_admin,
            can_view_pitch_owners: role.is_admin ||  role.is_sub_admin,
            can_view_venue_requests: role.is_admin ||  role.is_sub_admin,
            can_view_tournaments: role.is_admin || role.is_staff || role.is_pitch_owner,
            can_view_tickets: role.is_admin ||  role.is_sub_admin,
            can_view_reports: role.is_admin ,
            can_view_revenue: role.is_admin || role.is_pitch_owner,
            can_view_support: true, // Everyone can access support
            can_view_settings: role.is_admin || role.is_staff,
            can_view_calendar: role.is_admin ||  role.is_sub_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
            can_view_pitches: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
            can_view_amenities: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
            can_view_venue_sports: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
            can_view_surface_types: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
            can_view_addons: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
            can_view_banners: role.is_admin ||  role.is_sub_admin,
            can_view_notifications: role.is_admin ||  role.is_sub_admin,
            can_view_vouchers:role.is_admin ||  role.is_sub_admin,
        };

        return permissions[permission] || false;
    };

    // Define menu items with permission requirements
    const menuItems = [
        {
            title: t('sections.dashboard'),
            items: [
                {
                    icon: TrendingUp,
                    label: t('menu_items.dashboard'),
                    path: '/',
                    permission: 'except_sub_pitch' // Anyone authenticated can view dashboard
                },
            ]
        },
        {
            title: t('sections.sales_control'),
            items: [
                {
                    icon: FaCalendarAlt,
                    label: t('menu_items.booking'),
                    path: '/bookings',
                    permission: 'can_view_bookings'
                },
                {
                    icon: Calendar,
                    label: t('menu_items.calendar'),
                    path: '/calendar',
                    permission: 'can_view_calendar'
                },
                {
                    icon: MapPin,
                    label: t('menu_items.venues'),
                    path: '/venues',
                    permission: 'can_view_venues'
                },
                {
                    icon: Landmark,
                    label: t('menu_items.pitches'),
                    path: '/pitches',
                    permission: 'can_view_pitches'
                },
                {
                    icon: PlusCircle,
                    label: t('menu_items.amenities'),
                    path: '/amenities',
                    permission: 'can_view_amenities'
                },
                {
                    icon: Dribbble,
                    label: t('menu_items.venue_sports'),
                    path: '/venue-sports',
                    permission: 'can_view_venue_sports'
                },
                {
                    icon: Grid,
                    label: t('menu_items.surface_types'),
                    path: '/surface-types',
                    permission: 'can_view_surface_types'
                },
                {
                    icon: Layers,
                    label: t('menu_items.addons'),
                    path: '/add-ons',
                    permission: 'can_view_addons'
                },
                {
                    icon: Trophy,
                    label: t('menu_items.tournaments'),
                    path: '/tournaments',
                    permission: 'can_view_tournaments'
                },
                {
                    icon: Ticket,
                    label: t('menu_items.tickets'),
                    path: '/tickets',
                    permission: 'can_view_tickets'
                },
            ]
        },
        {
            title: t('sections.display'),
            items: [
                {
                    icon: Image,
                    label: t('menu_items.banners_ads'),
                    path: '/banners',
                    permission: 'can_view_banners'
                },
                {
                    icon: Bell,
                    label: t('menu_items.notifications'),
                    path: '/notifications',
                    permission: 'can_view_notifications'
                },
            ]
        },
        {
            title: t('sections.finance'),
            items: [
                {
                    icon: DollarSign,
                    label: t('menu_items.revenue'),
                    path: '/revenue',
                    permission: 'can_view_revenue'
                },
                {
                    icon: FileText,
                    label: t('menu_items.reports'),
                    path: '/reports',
                    permission: 'can_view_reports'
                },
                {
                    icon: CreditCard,
                    label: t('menu_items.vouchers'),
                    path: '/vouchers',
                    permission: 'can_view_vouchers'
                },
            ]
        },
        {
            title: t('sections.users_control'),
            items: [
                {
                    icon: Users,
                    label: t('menu_items.players'),
                    path: '/players',
                    permission: 'can_view_players'
                },
                {
                    icon: Users,
                    label: 'Teams',
                    path: '/teams',
                    permission: 'can_view_teams'
                },
                {
                    icon: UserCheck,
                    label: t('menu_items.pitch_owners'),
                    path: '/pitch-owner',
                    permission: 'can_view_pitch_owners'
                },
                {
                    icon: FileEdit,
                    label: t('menu_items.venue_requests'),
                    path: '/venue-edit-requests',
                    permission: 'can_view_venue_requests'
                },
            ]
        },
        {
            title: t('sections.support'),
            items: [
                {
                    icon: HeadphonesIcon,
                    label: t('menu_items.support'),
                    path: '/support',
                    permission: 'can_view_support'
                },
            ]
        }
    ];

    // Filter menu items based on user permissions
    const filteredMenuItems = menuItems.map(section => ({
        ...section,
        items: section.items.filter(item => {
            // If no permission specified, show to all
            if (!item.permission) return true;
            // Check if user has permission
            return hasPermission(item.permission);
        })
    })).filter(section => section.items.length > 0); // Remove empty sections

    const isActive = (path) => location.pathname === path;

    const handleMouseEnter = (e, label) => {
        if (!isCollapsed) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            show: true,
            label: label,
            top: rect.top + rect.height / 2
        });
    };

    const handleMouseLeave = () => {
        setTooltip({ show: false, label: '', top: 0 });
    };

    // Determine sidebar position based on direction
    const sidebarPosition = direction === 'rtl' ? 'right-0' : 'left-0';
    const toggleIcon = direction === 'rtl'
        ? (isCollapsed ? ChevronLeft : ChevronRight)
        : (isCollapsed ? ChevronRight : ChevronLeft);

    const ToggleIcon = toggleIcon;

    return (
        <>
            <aside
                className={`bg-white h-screen fixed top-0 transition-all duration-300 z-50 flex flex-col ${
                    isCollapsed ? 'w-16' : 'w-56'
                } ${sidebarPosition}`}
                dir={direction}
            >
                {/* Logo Section with Toggle */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center px-3' : 'justify-between px-5'} h-[4rem] border-b border-primary-100 flex-shrink-0`}>
                    <div dir={'ltr'} className="flex items-center gap-3">
                        {isCollapsed &&
                            <img
                                src={logo}
                                alt="FreeKick Logo"
                                className="w-10 h-10 object-contain flex-shrink-0"
                            />
                        }
                        {!isCollapsed && (
                            <span className="text-2xl text-secondary-600 font-bold tracking-wider flex items-center">
                                FREE K
                                <img
                                    src={logo}
                                    alt="Logo"
                                    className="h-6 w-6 -mx-1 animate-avatar-float-slowest"
                                />
                                ICK
                            </span>
                        )}
                    </div>



                    {/* Toggle Button */}
                    {!isCollapsed && (
                        <button
                            onClick={handleToggle}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 group relative"
                            title={t('tooltips.collapse_sidebar')}
                        >
                            <div className="relative w-5 h-5">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-5 h-5 text-gray-600 group-hover:text-primary-600 transition-all duration-300 group-hover:scale-110"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" strokeWidth="1.5" opacity="0.4" />
                                    <path d="M12 8 L9 10 L10 13 L14 13 L15 10 Z" fill="currentColor" opacity="0.2" />
                                </svg>
                                <div className={`absolute ${direction === 'rtl' ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                                    <ToggleIcon className="w-3 h-3 text-primary-600" />
                                </div>
                            </div>
                        </button>
                    )}
                </div>

                {/* Navigation with custom scrollbar */}
                <ScrollArea className="flex-1">
                    <nav dir={direction} className={`py-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                        {filteredMenuItems.map((section, index) => (
                            <div key={index} className="mb-6 last:mb-0">
                                {!isCollapsed && section.title && (
                                    <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3 truncate">
                                        {section.title}
                                    </h3>
                                )}

                                {isCollapsed && index > 0 && (
                                    <div className="border-t border-gray-200 my-3 mx-2"></div>
                                )}

                                <ul className="space-y-1">
                                    {section.items.map((item, itemIndex) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.path);

                                        return (
                                            <li key={itemIndex}>
                                                <Link
                                                    to={item.path}
                                                    onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                                                    onMouseLeave={handleMouseLeave}
                                                    className={`flex items-center gap-3 text-sm rounded-lg transition-all ${
                                                        active
                                                            ? 'bg-primary-500 text-white shadow-sm'
                                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                    } ${isCollapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'}`}
                                                >
                                                    <Icon
                                                        className={`w-5 h-5 text-sm flex-shrink-0 transition-colors ${
                                                            active ? 'text-white' : 'text-gray-500'
                                                        }`}
                                                    />
                                                    {!isCollapsed && (
                                                        <span className={`text-xs transition-colors truncate ${
                                                            active ? 'text-white' : 'text-gray-700'
                                                        }`}>
                                                            {item.label}
                                                        </span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </ScrollArea>

                {/* Collapsed toggle button at bottom */}
                {isCollapsed && (
                    <div className="p-3 border-t border-gray-100 flex-shrink-0">
                        <button
                            onClick={handleToggle}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 group relative"
                            title={t('tooltips.expand_sidebar')}
                        >
                            <div className="relative w-5 h-5">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-5 h-5 text-gray-600 group-hover:text-primary-600 transition-all duration-300 group-hover:scale-110"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" strokeWidth="1.5" opacity="0.4" />
                                    <path d="M12 8 L9 10 L10 13 L14 13 L15 10 Z" fill="currentColor" opacity="0.2" />
                                </svg>
                                <div className={`absolute ${direction === 'ltr' ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                                    <ToggleIcon className="w-3 h-3 text-primary-600" />
                                </div>
                            </div>
                        </button>
                    </div>
                )}
            </aside>

            {/* Tooltip */}
            {tooltip.show && (
                <div
                    className="fixed pointer-events-none z-[100] transition-opacity duration-200"
                    style={{
                        [direction === 'rtl' ? 'right' : 'left']: isCollapsed
                            ? (direction === 'rtl' ? '4rem' : '4rem')
                            : (direction === 'rtl' ? '14rem' : '14rem'),
                        top: `${tooltip.top}px`,
                        transform: 'translateY(-50%)'
                    }}
                >
                    <div className="relative">
                        <div className="px-3 py-2 bg-primary-700 text-white text-xs font-medium rounded-md whitespace-nowrap shadow-lg">
                            {tooltip.label}
                        </div>
                        <div
                            className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-700 rotate-45 ${
                                direction === 'rtl'
                                    ? 'left-full ml-[-1px]'
                                    : 'right-full mr-[-1px]'
                            }`}
                        ></div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;