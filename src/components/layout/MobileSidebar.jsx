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
  Dribbble,
  TrendingUp
} from 'lucide-react';
import { FaCalendarAlt } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import logo from "../../assets/logo.svg";

const MobileSidebar = ({ isOpen, onClose, direction }) => {
  const location = useLocation();
  const { t } = useTranslation('sidebar');
  const { user } = useSelector((state) => state.auth); // Get user from Redux

  // Check if user has permission based on role - SAME LOGIC AS MAIN SIDEBAR
  const hasPermission = (permission) => {
    if (!user || !user.role) return false;

    const { role } = user;

    // Define permission mapping based on roles - EXACTLY SAME AS MAIN SIDEBAR
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
      except_sub_pitch: role.is_pitch_owner || role.is_sub_admin || role.is_admin,

      // Specific module permissions - EXACTLY SAME AS MAIN SIDEBAR
      can_view_venues: role.is_admin || role.is_staff || role.is_pitch_owner,
      can_view_bookings: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
      can_view_finance: role.is_admin || role.is_staff,
      can_view_users: role.is_admin || role.is_staff,
      can_view_display: role.is_admin || role.is_staff,
      can_view_players: role.is_admin || role.is_sub_admin,
      can_view_teams: role.is_admin || role.is_sub_admin,
      can_view_pitch_owners: role.is_admin || role.is_sub_admin,
      can_view_venue_requests: role.is_admin || role.is_sub_admin,
      can_view_tournaments: role.is_admin || role.is_staff || role.is_pitch_owner,
      can_view_tickets: role.is_admin || role.is_sub_admin,
      can_view_reports: role.is_admin,
      can_view_revenue: role.is_admin || role.is_pitch_owner,
      can_view_support: true, // Everyone can access support
      can_view_settings: role.is_admin || role.is_staff,
      can_view_calendar: role.is_admin || role.is_sub_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
      can_view_pitches: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
      can_view_amenities: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
      can_view_venue_sports: role.is_admin || role.is_sub_admin,
      can_view_surface_types: role.is_admin || role.is_sub_admin,
      can_view_addons: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
      can_view_banners: role.is_admin || role.is_sub_admin,
      can_view_notifications: role.is_admin || role.is_sub_admin,
      can_view_vouchers: role.is_admin || role.is_sub_admin,
    };

    return permissions[permission] || false;
  };

  // Define menu items with permission requirements - EXACTLY SAME STRUCTURE AS MAIN SIDEBAR
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

  // Filter menu items based on user permissions - EXACTLY SAME LOGIC AS MAIN SIDEBAR
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
          <span dir={'ltr'} className="text-2xl text-secondary-600 font-bold tracking-wider flex items-center">
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
              {/* Use filteredMenuItems instead of hardcoded menuItems */}
              {filteredMenuItems.map((section, index) => (
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