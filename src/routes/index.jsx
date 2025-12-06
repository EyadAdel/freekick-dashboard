// src/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';

// Import Pages
import Dashboard from '../pages/Dashboard/Dashboard';
import Bookings from '../pages/Bookings/Booking.jsx';
// import Calendar from '../pages/Calendar/Calendar';
import Venues from '../pages/Venues/Venues';
import Pitches from '../pages/Pitches/Pitches';
import Amenities from '../pages/Amenities/Amenities';
import Support from '../pages/Support/Support';
import SurfaceTypes from '../pages/SurfaceTypes/SurfaceTypes.jsx';
import AddOns from '../pages/AddOns/AddOns.jsx';
import VenueSports from '../pages/VenueSports/VenueSports.jsx';
import Tournaments from '../pages/Tournaments/Tournaments.jsx';
import TournamentDetails from "../components/tournaments/TournamentDetails.jsx";
import Tickets from '../pages/Tickets/Tickets.jsx';
// import Revenue from '../pages/Revenue/Revenue';
// import Reports from '../pages/Reports/Reports';
// import Players from '../pages/Players/Players';
// import PitchOwners from '../pages/PitchOwners/PitchOwners';
// import Settings from '../pages/Settings/Settings';
import Login from '../pages/Login.jsx';
// import NotFound from '../pages/NotFound/NotFound';

// Protected Route Component
import ProtectedRoute from './ProtectedRoute';
import ForgotPassword from "../pages/ ForgotPassword.jsx";
import OTPVerification from "../pages/OTPVerification.jsx";
import ChangePassword from "../pages/ChangePassword.jsx";
import BannersPage from "../pages/Banners/BannerPage.jsx";
import VenueDetails from "../components/venues/VenueDetails.jsx";
import Vouchers from "../pages/Vouchers/Vouchers.jsx";
import BookingCalendar from "../pages/BookingCalendar/BookingCalendar.jsx";
import ProfileSettings from "../pages/ProfileSettings/ProfileSettings.jsx";
import TestNotificationSender from "../components/TestNotificationSender.jsx";
import Teams from "../pages/Teams/Teams.jsx";
import Players from "../pages/players/players.jsx";
import AppsNotifications from "../pages/AppsNotifications/AppsNotifications.jsx";
import RevenueOverview from "../pages/RevenueOverview/RevenueOverview.jsx";


const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    { path:"/forgot-password", element:<ForgotPassword />},
    { path:"/verify-otp" ,element:<OTPVerification />},
    {path:"/change-password", element:<ChangePassword />} ,
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
                element: <Dashboard />,
            },
            {
                path: 'bookings',
                element: <Bookings />,
            },
            {
                path: 'calendar',
                element: <BookingCalendar />,
            },
            {
                path: 'venues',
                element: <Venues />,
            },
            {
                path: 'venues/venue-details',
                element: <VenueDetails />, // Venue detail page
            },
            {
                path: 'pitches',
                element: <Pitches />,
            },
            {
                path: 'amenities',
                element: <Amenities />,
            },
            {
                path: 'surface-types',
                element: <SurfaceTypes />,
            },
            {
                path: 'add-ons',
                element: <AddOns />,
            },
            {
                path: 'venue-sports',
                element: <VenueSports />,
            },
            {
                path: 'tournaments',
                element: <Tournaments />,
            },  {
                path: 'tournaments/tournament-details',
                element: <TournamentDetails />,
            },
            {
                path: 'tickets',
                element: <Tickets />,
            },
            {
                path: 'banners',
                element: <BannersPage />,
            },
            {
                path: 'revenue',
                element: <RevenueOverview />,
            },
            {
                path: 'reports',
                // element: <Reports />,
            },
            {
                path: 'players',
                element: <Players />,
            },
            {
                path: 'teams',
                element: <Teams />,
            },
            {
                path: 'pitch-stuff',
                // element: <PitchOwners />,
            },
            {
                path: 'settings',
                // element: <Settings />,
            },
            {
                path: 'support',
                element: <Support />,
            },
            {
                path: 'vouchers',
                element: <Vouchers />,
            },
            {
                path: 'profile',
                element: <ProfileSettings />,
            },
            {
                path: 'notifications',
                element: <AppsNotifications />,
            },
        ],
    },
    {
        path: '*',
        // element: <NotFound />,
    },
]);

export default router;