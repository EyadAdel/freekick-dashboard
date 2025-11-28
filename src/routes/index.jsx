// src/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';

// Import Pages
import Dashboard from '../pages/Dashboard/Dashboard';
import Bookings from '../pages/Bookings/Booking.jsx';
// import Calendar from '../pages/Calendar/Calendar';
// import Venues from '../pages/Venues/Venues';
import Pitches from '../pages/Pitches/Pitches';
// import Tournaments from '../pages/Tournaments/Tournaments';
// import Tickets from '../pages/Tickets/Tickets';
// import Revenue from '../pages/Revenue/Revenue';
// import Reports from '../pages/Reports/Reports';
// import Players from '../pages/Players/Players';
// import PitchOwners from '../pages/PitchOwners/PitchOwners';
// import Settings from '../pages/Settings/Settings';
import Login from '../pages/Login.jsx';
// import NotFound from '../pages/NotFound/NotFound';

// Protected Route Component
import ProtectedRoute from './ProtectedRoute';

const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
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
                // element: <Calendar />,
            },
            {
                path: 'venues',
                // element: <Venues />,
            },
            {
                path: 'venues/:id',
                // element: <Venues />, // Venue detail page
            },
            {
                path: 'pitches',
                element: <Pitches />,
            },
            {
                path: 'tournaments',
                // element: <Tournaments />,
            },
            {
                path: 'tickets',
                // element: <Tickets />,
            },
            {
                path: 'revenue',
                // element: <Revenue />,
            },
            {
                path: 'reports',
                // element: <Reports />,
            },
            {
                path: 'players',
                // element: <Players />,
            },
            {
                path: 'pitch-owners',
                // element: <PitchOwners />,
            },
            {
                path: 'settings',
                // element: <Settings />,
            },
        ],
    },
    {
        path: '*',
        // element: <NotFound />,
    },
]);

export default router;