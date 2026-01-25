// src/routes/PermissionRoute.jsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PermissionRoute = ({ children, permission }) => {
    const { user } = useSelector((state) => state.auth);

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
            except_sub_pitch: role.is_pitch_owner || role.is_sub_admin || role.is_admin,

            // Specific module permissions
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
            can_view_support: role.is_admin || role.is_sub_admin,
            can_view_settings: role.is_admin || role.is_staff,
            can_view_calendar: role.is_admin || role.is_sub_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
            can_view_pitches: role.is_admin || role.is_staff || role.is_pitch_owner || role.is_sub_pitch_owner,
            can_view_amenities: role.is_admin || role.is_sub_admin,
            can_view_venue_sports: role.is_admin || role.is_sub_admin,
            can_view_surface_types: role.is_admin || role.is_sub_admin,
            can_view_addons: role.is_admin || role.is_sub_admin,
            can_view_banners: role.is_admin || role.is_sub_admin,
            can_view_notifications: role.is_admin || role.is_sub_admin,
            can_view_vouchers: role.is_admin || role.is_sub_admin,
        };

        return permissions[permission] || false;
    };

    // If no permission required, allow access
    if (!permission) {
        return children;
    }

    // Check if user has the required permission
    if (hasPermission(permission)) {
        return children;
    }
    if (user?.role?.is_sub_pitch_owner && permission === 'except_sub_pitch') {
        return <Navigate to="/bookings" replace />;
    }

    // Redirect to dashboard if no permission
    return <Navigate to="/access-denied" replace />;
};

export default PermissionRoute;