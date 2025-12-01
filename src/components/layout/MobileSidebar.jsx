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
  X,
  Grid,
  Dribbble
} from 'lucide-react';
import { FaCalendarAlt } from 'react-icons/fa';
import logo from "../../assets/logo.svg";

const MobileSidebar = ({ isOpen, onClose, direction }) => {
  const location = useLocation();
  const { t } = useTranslation('sidebar');

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
        { icon: FaCalendarAlt, label: t('menu_items.booking'), path: '/bookings' },
        { icon: Calendar, label: t('menu_items.calendar'), path: '/calendar' },
        { icon: MapPin, label: t('menu_items.venues'), path: '/venues' },
        { icon: Landmark, label: t('menu_items.pitches'), path: '/pitches' },
        { icon: PlusCircle, label: t('menu_items.amenities'), path: '/amenities' },
        { icon: Dribbble, label: t('menu_items.venue_sports'), path: '/venue-sports' },
        { icon: Grid, label: t('menu_items.surface_types'), path: '/surface-types' },
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
                    <span  dir={'ltr'} className="text-2xl text-secondary-600 font-bold tracking-wider flex items-center">
                        FREE K
                        <img
                            src={logo}
                            alt="Logo"
                            className="h-6 w-6 -mx-1 animate-avatar-float-slowest"
                        />
                        ICK
                    </span>
            <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <div dir={direction} className="overflow-y-auto custom-scrollbar h-[calc(100%-3.8rem)]">
            <nav dir={direction} className="py-4 px-3">
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
export default MobileSidebar;