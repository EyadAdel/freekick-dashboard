// src/components/layout/Sidebar/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
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
import logo from '../../assets/logo.svg';

const Sidebar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        {
            title: 'SALES CONTROL',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
                { icon: Calendar, label: 'Booking', path: '/bookings' },
                { icon: Calendar, label: 'Calendar', path: '/calendar' },
                { icon: MapPin, label: 'Venues', path: '/venues' },
                { icon: Landmark, label: 'Pitches', path: '/pitches' },
                { icon: PlusCircle, label: 'Amenities', path: '/amenities' },
                { icon: Layers, label: 'Add-ons', path: '/add-ons' },
                { icon: Layers, label: 'Categories', path: '/categories' },
                { icon: Trophy, label: 'Tournaments', path: '/tournaments' },
                { icon: Ticket, label: 'Tickets', path: '/tickets' },
            ]
        },
        {
            title: 'Display',
            items: [
                { icon: Image, label: 'Banners / Ads', path: '/banners' },
                { icon: Bell, label: 'Apps Notification', path: '/notifications' },
            ]
        },
        {
            title: 'Finance',
            items: [
                { icon: DollarSign, label: 'Revenue Overview', path: '/revenue' },
                { icon: FileText, label: 'Reports', path: '/reports' },
                { icon: CreditCard, label: 'Vouchers', path: '/vouchers' },
            ]
        },
        {
            title: 'Users Control',
            items: [
                { icon: Users, label: 'Players', path: '/players' },
                { icon: UserCheck, label: 'Pitch owners', path: '/pitch-owners' },
                { icon: FileEdit, label: 'Venues edit requests', path: '/venue-requests' },
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: HeadphonesIcon, label: 'Support', path: '/support' },
            ]
        }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside
            className={`bg-white h-screen fixed left-0 top-0 border-r border-gray-200 transition-all duration-300 z-50 ${
                isCollapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Logo Section with Toggle */}
            <div className="h-20 flex items-center justify-between px-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <img
                        src={logo}
                        alt="FreeKick Logo"
                        className="w-10 h-10 object-contain flex-shrink-0"
                    />
                    {!isCollapsed && (
                        <span className="font-bold text-2xl text-gray-800">FreeKick</span>
                    )}
                </div>

                {/* Toggle Button - Always visible next to logo */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="overflow-y-auto h-[calc(100vh-80px)] py-4 px-3">
                {menuItems.map((section, index) => (
                    <div key={index} className="mb-6">
                        {!isCollapsed && (
                            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                                {section.title}
                            </h3>
                        )}
                        {isCollapsed && index > 0 && (
                            <div className="border-t border-gray-200 my-2"></div>
                        )}
                        <ul className="space-y-1">
                            {section.items.map((item, itemIndex) => {
                                const Icon = item.icon;
                                const active = isActive(item.path);

                                return (
                                    <li key={itemIndex}>
                                        <Link
                                            to={item.path}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group ${
                                                active
                                                    ? 'bg-primary-500 text-white'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            } ${isCollapsed ? 'justify-center' : ''}`}
                                        >
                                            <Icon
                                                className={`w-5 h-5 flex-shrink-0 ${
                                                    active ? 'text-white' : 'text-gray-500'
                                                }`}
                                            />
                                            {!isCollapsed && (
                                                <span className={`text-sm font-medium ${
                                                    active ? 'text-white' : 'text-gray-700'
                                                }`}>
                                                    {item.label}
                                                </span>
                                            )}

                                            {/* Tooltip on hover when collapsed */}
                                            {isCollapsed && (
                                                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg">
                                                    {item.label}
                                                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                                                </div>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;