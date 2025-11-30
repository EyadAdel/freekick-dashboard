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
  Headphones,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { FaCalendarAlt } from 'react-icons/fa'
import logo from "../../assets/logo.svg";
const MobileSidebar = ({ isOpen, onClose, direction }) => {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      ]
    },
    {
      title: 'Sales Control',
      items: [
        { icon: FaCalendarAlt, label: 'Booking', path: '/bookings' },
        { icon: Calendar, label: 'Calendar', path: '/calendar' },
        { icon: MapPin, label: 'Venues', path: '/venues' },
        { icon: Landmark, label: 'Pitches', path: '/pitches' },
        { icon: PlusCircle, label: 'Amenities', path: '/amenities' },
        { icon: Layers, label: 'Add-ons', path: '/add-ons' },
        { icon: Trophy, label: 'Tournaments', path: '/tournaments' },
        { icon: Ticket, label: 'Tickets', path: '/tickets' },
      ]
    },
    {
      title: 'Display',
      items: [
        { icon: Image, label: 'Banners & Ads', path: '/banners' },
        { icon: Bell, label: 'Notifications', path: '/notifications' },
      ]
    },
    {
      title: 'Finance',
      items: [
        { icon: DollarSign, label: 'Revenue', path: '/revenue' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: CreditCard, label: 'Vouchers', path: '/vouchers' },
      ]
    },
    {
      title: 'Users Control',
      items: [
        { icon: Users, label: 'Players', path: '/players' },
        { icon: UserCheck, label: 'Pitch Owners', path: '/pitch-owners' },
        { icon: FileEdit, label: 'Venue Requests', path: '/venue-requests' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: Headphones, label: 'Support', path: '/support' },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 ${direction === 'rtl' ? 'right-0' : 'left-0'} h-full w-64 bg-white z-50 lg:hidden transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : (direction === 'rtl' ? 'translate-x-full' : '-translate-x-full')
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-[3.8rem] border-b border-gray-200">
<span className="text-2xl text-secondary-600 font-bold tracking-wider flex items-center">
                                FREE K
                                 <img
                                     src={logo}
                                     alt="Logo"
                                     className="h-6 w-6 -mx-1 animate-avatar-float-slowest"
                                 />
                                ICK
                                </span>              <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <div dir={'rtl'} className="overflow-y-auto custom-scrollbar h-[calc(100%-3.8rem)]">
          <nav dir={'ltr'} className="py-4 px-3">
            {menuItems.map((section, index) => (
              <div key={index} className="mb-6 last:mb-0">
                {section.title && (
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    {section.title}
                  </h3>
                )}

                <ul className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <li key={itemIndex}>
                        <Link
                          to={item.path}
                          onClick={onClose}
                          className={`flex items-center gap-3 text-sm rounded-lg transition-all px-3 py-2.5 ${
                            active
                              ? 'bg-primary-700 text-white shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
                          <span className="text-xs">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};
export default MobileSidebar