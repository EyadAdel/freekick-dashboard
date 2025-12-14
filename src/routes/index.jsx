// src/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';

// Import Pages
import Dashboard from '../pages/Dashboard/Dashboard';
import Bookings from '../pages/Bookings/Booking.jsx';
import Venues from '../pages/Venues/Venues';
import Pitches from '../pages/Pitches/Pitches';
import PitchDetails from '../components/pitches/PitchDetails.jsx';
import Amenities from '../pages/Amenities/Amenities';
import Support from '../pages/Support/Support';
import SurfaceTypes from '../pages/SurfaceTypes/SurfaceTypes.jsx';
import AddOns from '../pages/AddOns/AddOns.jsx';
import VenueSports from '../pages/VenueSports/VenueSports.jsx';
import Tournaments from '../pages/Tournaments/Tournaments.jsx';
import TournamentDetails from "../components/tournaments/TournamentDetails.jsx";
import Tickets from '../pages/Tickets/Tickets.jsx';
import PitchOwners from '../pages/PitchOwners/PitchOwners';
import Login from '../pages/Login.jsx';

// Protected Route Components
import ProtectedRoute from './ProtectedRoute';
import PermissionRoute from '../PermissionRoute.jsx';
import ForgotPassword from "../pages/ ForgotPassword.jsx";
import OTPVerification from "../pages/OTPVerification.jsx";
import ChangePassword from "../pages/ChangePassword.jsx";
import BannersPage from "../pages/Banners/BannerPage.jsx";
import VenueDetails from "../components/venues/VenueDetails.jsx";
import Vouchers from "../pages/Vouchers/Vouchers.jsx";
import BookingCalendar from "../pages/BookingCalendar/BookingCalendar.jsx";
import ProfileSettings from "../pages/ProfileSettings/ProfileSettings.jsx";
import Teams from "../pages/Teams/Teams.jsx";
import Players from "../pages/players/players.jsx";
import AppsNotifications from "../pages/AppsNotifications/AppsNotifications.jsx";
import RevenueOverview from "../pages/RevenueOverview/RevenueOverview.jsx";
import PitchOwnerDetails from "../components/pitchOwners/PitchOwnerDetails.jsx";
import Reports from "../pages/Reports/Reports.jsx";
import VenueEditRequests from "../pages/VenueEditRequests/VenueEditRequests.jsx";
import VenueEditRequestDetails from "../components/venueEditRequestDetails/venueEditRequestDetails.jsx";
import BookingDetailView from "../pages/Bookings/BookingDetailView.jsx";
import PlayerDetailView from "../pages/players/playerDetailView.jsx";
import TeamDetailsView from "../pages/Teams/TeamDetailsView.jsx";
import AccessDenied from "../pages/AccessDenied.jsx";
import NotFound from "../pages/NotFound.jsx";
import EncryptionTest from "../pages/EncryptionTest.jsx";


const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/verify-otp", element: <OTPVerification /> },
    { path: "/change-password", element: <ChangePassword /> },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: (
                    <PermissionRoute permission="except_sub_pitch">
                        <Dashboard />
                    </PermissionRoute>
                ),
            },
            {
                path: 'bookings',
                element: (
                    <PermissionRoute permission="can_view_bookings">
                        <Bookings />
                    </PermissionRoute>
                ),
            },
            {
                path: 'bookings/book-details',
                element: (
                    <PermissionRoute permission="can_view_bookings">
                        <BookingDetailView />
                    </PermissionRoute>
                ),
            },
            {
                path: 'calendar',
                element: (
                    <PermissionRoute permission="can_view_calendar">
                        <BookingCalendar />
                    </PermissionRoute>
                ),
            },
            {
                path: 'venues',
                element: (
                    <PermissionRoute permission="can_view_venues">
                        <Venues />
                    </PermissionRoute>
                ),
            },
            {
                path: 'venues/venue-details',
                element: (
                    <PermissionRoute permission="can_view_venues">
                        <VenueDetails />
                    </PermissionRoute>
                ),
            },
            {
                path: 'venue-edit-requests',
                element: (
                    <PermissionRoute permission="can_view_venue_requests">
                        <VenueEditRequests />
                    </PermissionRoute>
                ),
            },
            {
                path: 'venue-edit-requests/venue-request-details',
                element: (
                    <PermissionRoute permission="can_view_venue_requests">
                        <VenueEditRequestDetails />
                    </PermissionRoute>
                ),
            },
            {
                path: 'pitches',
                element: (
                    <PermissionRoute permission="can_view_pitches">
                        <Pitches />
                    </PermissionRoute>
                ),
            },
            {
                path: 'pitches/pitch-details',
                element: (
                    <PermissionRoute permission="can_view_pitches">
                        <PitchDetails />
                    </PermissionRoute>
                ),
            },
            {
                path: 'amenities',
                element: (
                    <PermissionRoute permission="can_view_amenities">
                        <Amenities />
                    </PermissionRoute>
                ),
            },
            {
                path: 'surface-types',
                element: (
                    <PermissionRoute permission="can_view_surface_types">
                        <SurfaceTypes />
                    </PermissionRoute>
                ),
            },
            {
                path: 'add-ons',
                element: (
                    <PermissionRoute permission="can_view_addons">
                        <AddOns />
                    </PermissionRoute>
                ),
            },
            {
                path: 'venue-sports',
                element: (
                    <PermissionRoute permission="can_view_venue_sports">
                        <VenueSports />
                    </PermissionRoute>
                ),
            },
            {
                path: 'tournaments',
                element: (
                    <PermissionRoute permission="can_view_tournaments">
                        <Tournaments />
                    </PermissionRoute>
                ),
            },
            {
                path: 'tournaments/tournament-details',
                element: (
                    <PermissionRoute permission="can_view_tournaments">
                        <TournamentDetails />
                    </PermissionRoute>
                ),
            },
            {
                path: 'tickets',
                element: (
                    <PermissionRoute permission="can_view_tickets">
                        <Tickets />
                    </PermissionRoute>
                ),
            },
            {
                path: 'banners',
                element: (
                    <PermissionRoute permission="can_view_banners">
                        <BannersPage />
                    </PermissionRoute>
                ),
            },
            {
                path: 'revenue',
                element: (
                    <PermissionRoute permission="can_view_revenue">
                        <RevenueOverview />
                    </PermissionRoute>
                ),
            },
            {
                path: 'reports',
                element: (
                    <PermissionRoute permission="can_view_reports">
                        <Reports />
                    </PermissionRoute>
                ),
            },
            {
                path: 'players',
                element: (
                    <PermissionRoute permission="can_view_players">
                        <Players />
                    </PermissionRoute>
                ),
            },
            {
                path: 'players/player-profile',
                element: (
                    <PermissionRoute permission="can_view_players">
                        <PlayerDetailView />
                    </PermissionRoute>
                ),
            },
            {
                path: 'teams',
                element: (
                    <PermissionRoute permission="can_view_teams">
                        <Teams />
                    </PermissionRoute>
                ),
            },
            {
                path: 'teams/team-profile',
                element: (
                    <PermissionRoute permission="can_view_teams">
                        <TeamDetailsView />
                    </PermissionRoute>
                ),
            },
            {
                path: 'pitch-owner',
                element: (
                    <PermissionRoute permission="can_view_pitch_owners">
                        <PitchOwners />
                    </PermissionRoute>
                ),
            },
            {
                path: 'pitch-owner/pitch-owner-details',
                element: (
                    <PermissionRoute permission="can_view_pitch_owners">
                        <PitchOwnerDetails />
                    </PermissionRoute>
                ),
            },
            {
                path: 'settings',
                element: (
                    <PermissionRoute permission="can_view_settings">
                        {/* <Settings /> */}
                    </PermissionRoute>
                ),
            },
            {
                path: 'support',
                element: (
                    <PermissionRoute permission="can_view_support">
                        <Support />
                    </PermissionRoute>
                ),
            },
            {
                path: 'vouchers',
                element: (
                    <PermissionRoute permission="can_view_vouchers">
                        <Vouchers />
                    </PermissionRoute>
                ),
            },
            {
                path: 'notifications',
                element: (
                    <PermissionRoute permission="can_view_notifications">
                        <AppsNotifications />
                    </PermissionRoute>
                ),
            },
            {
                path: 'profile',
                element: <ProfileSettings />, // No permission needed - everyone can view their profile
            },
            {
                path: '/access-denied',
                element: <AccessDenied />,
            },

        ],
    },
    {
        path: '*',
        element: <NotFound />,
    },
]);

export default router;