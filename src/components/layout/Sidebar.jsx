// src/components/layout/Sidebar/Sidebar.jsx
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
    ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import logo from '../../assets/logo.svg';
import ScrollArea from '../common/ScrollArea.jsx';

const Sidebar = ({ onToggle }) => {
    const location = useLocation();
    const { t } = useTranslation('sidebar');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [tooltip, setTooltip] = useState({ show: false, label: '', top: 0 });
    const { direction } = useSelector((state) => state.language);

    const handleToggle = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        if (onToggle) {
            onToggle(newState);
        }
    };

    const menuItems = [
        {
            title: t('sections.dashboard'),
            items: [
                { icon: LayoutDashboard, label: t('menu_items.dashboard'), path: '/' },
            ]
        },
        {
            title: t('sections.sales_control'),
            items: [
                { icon: Calendar, label: t('menu_items.booking'), path: '/bookings' },
                { icon: Calendar, label: t('menu_items.calendar'), path: '/calendar' },
                { icon: MapPin, label: t('menu_items.venues'), path: '/venues' },
                { icon: Landmark, label: t('menu_items.pitches'), path: '/pitches' },
                { icon: PlusCircle, label: t('menu_items.amenities'), path: '/amenities' },
                { icon: Layers, label: t('menu_items.addons'), path: '/add-ons' },
                { icon: Layers, label: t('menu_items.categories'), path: '/categories' },
                { icon: Trophy, label: t('menu_items.tournaments'), path: '/tournaments' },
                { icon: Ticket, label: t('menu_items.tickets'), path: '/tickets' },
            ]
        },
        {
            title: t('sections.display'),
            items: [
                { icon: Image, label: t('menu_items.banners_ads'), path: '/banners' },
                { icon: Bell, label: t('menu_items.notifications'), path: '/notifications' },
            ]
        },
        {
            title: t('sections.finance'),
            items: [
                { icon: DollarSign, label: t('menu_items.revenue'), path: '/revenue' },
                { icon: FileText, label: t('menu_items.reports'), path: '/reports' },
                { icon: CreditCard, label: t('menu_items.vouchers'), path: '/vouchers' },
            ]
        },
        {
            title: t('sections.users_control'),
            items: [
                { icon: Users, label: t('menu_items.players'), path: '/players' },
                { icon: UserCheck, label: t('menu_items.pitch_owners'), path: '/pitch-owners' },
                { icon: FileEdit, label: t('menu_items.venue_requests'), path: '/venue-requests' },
            ]
        },
        {
            title: t('sections.support'),
            items: [
                { icon: HeadphonesIcon, label: t('menu_items.support'), path: '/support' },
            ]
        }
    ];

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
                className={`bg-white h-screen fixed top-0 border-r border-gray-200 transition-all duration-300 z-50 flex flex-col ${
                    isCollapsed ? 'w-16' : 'w-56'
                } ${sidebarPosition}`}
                dir={direction}
            >
                {/* Logo Section with Toggle */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center px-3' : 'justify-between px-5'} h-20 border-b border-gray-100 flex-shrink-0`}>
                    <div className="flex items-center gap-3">
                        <img
                            src={logo}
                            alt="FreeKick Logo"
                            className="w-10 h-10 object-contain flex-shrink-0"
                        />
                        {!isCollapsed && (
                            <span className="font-bold text-xl text-gray-800 whitespace-nowrap">
                                {t('app_name')}
                            </span>
                        )}
                    </div>

                    {/* Toggle Button */}
                    {!isCollapsed && (
                        <button
                            onClick={handleToggle}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            title={t('tooltips.collapse_sidebar')}
                        >
                            <ToggleIcon className="w-5 h-5 text-gray-600" />
                        </button>
                    )}
                </div>

                {/* Navigation with custom scrollbar */}
                <ScrollArea className="flex-1">
                    <nav dir={direction} className={`py-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                        {menuItems.map((section, index) => (
                            <div key={index} className="mb-6 last:mb-0">
                                {/* Section Title - Only show when not collapsed and if there's a title */}
                                {!isCollapsed && section.title && (
                                    <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3 truncate">
                                        {section.title}
                                    </h3>
                                )}

                                {/* Section divider when collapsed */}
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
                                                            ? 'bg-primary-700 text-white shadow-sm'
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
                            className="w-full p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex justify-center"
                            title={t('tooltips.expand_sidebar')}
                        >
                            <ToggleIcon className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                )}
            </aside>

            {/* Tooltip - Rendered OUTSIDE sidebar to avoid overflow clipping */}
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
                        {/* Arrow pointing to sidebar */}
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