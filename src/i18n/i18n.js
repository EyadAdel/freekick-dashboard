// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import arCommon from '../locales/ar/common.json';
import enSidebar from '../locales/en/Sidebar.json';
import arSidebar from '../locales/ar/Sidebar.json';
import arVenueForm from '../locales/ar/Venues/venueForm.json';
import enVenueForm from '../locales/en/Venues/venueForm.json';
import enVenuesPage from '../locales/en/Venues/venuesPage.json';
import arVenuesPage from '../locales/ar/Venues/venuesPage.json';
import enVenueDetails from '../locales/en/Venues/venueDetails.json';
import arVenueDetails from '../locales/ar/Venues/venueDetails.json';
import enStatus from '../locales/en/statusManagement.json';
import arStatus from '../locales/ar/statusManagement.json';
import arPitchForm from '../locales/ar/Pitches/pitchForm.json';
import enPitchForm from '../locales/en/Pitches/pitchForm.json';
import enPitchDetails from '../locales/en/Pitches/pitchDetails.json';
import arPitchDetails from '../locales/ar/Pitches/pitchDetails.json';
import arPitchesPage from '../locales/ar/Pitches/pitchesPage.json';
import enPitchesPage from '../locales/en/Pitches/pitchesPage.json';
import enVenueEditRequests from '../locales/en/VenueEditRequests/venueEditRequests.json';
import arVenueEditRequests from '../locales/ar/VenueEditRequests/venueEditRequests.json';
import enVenueEditRequestDetails from '../locales/en/VenueEditRequests/venueEditRequestDetails.json';
import arVenueEditRequestDetails from '../locales/ar/VenueEditRequests/venueEditRequestDetails.json';
import enSupport from '../locales/en/Support/supportPage.json';
import arSupport from '../locales/ar/Support/supportPage.json';
import enAmenitiesForm from '../locales/en/Amenities/AmenitiesForm.json';
import arAmenitiesForm from '../locales/ar/Amenities/AmenitiesForm.json';
import enAmenitiesPage from '../locales/en/Amenities/AmenitiesPage.json';
import arAmenitiesPage from '../locales/ar/Amenities/AmenitiesPage.json';
import enTournamentForm from '../locales/en/Tournaments/tournamentForm.json';
import arTournamentForm from '../locales/ar/Tournaments/tournamentForm.json';
import enTournamentPage from '../locales/en/Tournaments/tournamentPage.json';
import arTournamentPage from '../locales/ar/Tournaments/tournamentPage.json';
import entournamentDetails from '../locales/en/Tournaments/tournamentDetails.json';
import artournamentDetails from '../locales/ar/Tournaments/tournamentDetails.json';
import enAddOnsForm from '../locales/en/AddOns/addOnsForm.json';
import arAddOnsForm from '../locales/ar/AddOns/addOnsForm.json';
import enAddOnsPage from '../locales/en/AddOns/addOnsPage.json';
import arAddOnsPage from '../locales/ar/AddOns/addOnsPage.json';

import enBookingsPage from '../locales/en/Bookings/bookings.json';
import arBookingsPage from '../locales/ar/Bookings/bookings.json';
import enBookingDetails from '../locales/en/Bookings/bookingDetails.json';
import arBookingDetails from '../locales/ar/Bookings/bookingDetails.json';
import enNotifications from '../locales/en/Notifications/notifications.json';
import arNotifications from '../locales/ar/Notifications/notifications.json';
import enBannersPage from '../locales/en/Banners/bannersPage.json';
import arBannersPage from '../locales/ar/Banners/bannersPage.json';
import enTicketsPage from '../locales/en/Tickets/ticketsPage.json';
import arTicketsPage from '../locales/ar/Tickets/ticketsPage.json';
import enCreateTicket from '../locales/en/Tickets/createTicket.json';
import arCreateTicket from '../locales/ar/Tickets/createTicket.json';
import enCalendar from '../locales/en/Calendar/calendar.json';
import arCalendar from '../locales/ar/Calendar/calendar.json';
import enRevenueOverview from '../locales/en/Revenue/revenueOverview.json';
import arRevenueOverview from '../locales/ar/Revenue/revenueOverview.json';
import enTransactions from '../locales/en/Transactions/transactions.json';
import arTransactions from '../locales/ar/Transactions/transactions.json';
import enReports from '../locales/en/Reports/reports.json';
import arReports from '../locales/ar/Reports/reports.json';
import enTeamActivity from '../locales/en/Charts/teamActivity.json';
import arTeamActivity from '../locales/ar/Charts/teamActivity.json';
import enPopularVenues from '../locales/en/Charts/popularVenues.json';
import arPopularVenues from '../locales/ar/Charts/popularVenues.json';
import enVouchers from '../locales/en/Vouchers/vouchers.json';
import arVouchers from '../locales/ar/Vouchers/vouchers.json';
import enCreateEditVoucher from '../locales/en/Vouchers/createEditVoucher.json';
import arCreateEditVoucher from '../locales/ar/Vouchers/createEditVoucher.json';
import enPieChart from '../locales/en/Charts/pieChart.json';
import arPieChart from '../locales/ar/Charts/pieChart.json';
import enPlayers from '../locales/en/Players/players.json';
import arPlayers from '../locales/ar/Players/players.json';
import enVenueSportsPage from '../locales/en/venueSports/venueSportsPage.json';
import arVenueSportsPage from '../locales/ar/venueSports/venueSportsPage.json';
import enVenueSportsForm from '../locales/en/venueSports/venueSportsForm.json';
import arVenueSportsForm from '../locales/ar/venueSports/venueSportsForm.json';
import enProfileSettings from '../locales/en/Profile/profileSettings.json';
import arProfileSettings from '../locales/ar/Profile/profileSettings.json';
// Translation resources
const resources = {
    en: {
        common: enCommon,
        sidebar: enSidebar,
        venueForm: enVenueForm,
        venuesPage: enVenuesPage,
        statusManagement: enStatus,
        venueDetails: enVenueDetails,
        pitchForm: enPitchForm,
        pitchDetails: enPitchDetails,
        pitchesPage: enPitchesPage,
        venueEditRequests: enVenueEditRequests,
        venueEditRequestDetails: enVenueEditRequestDetails,
        support: enSupport,
        amenitiesForm: enAmenitiesForm,
        amenitiesPage: enAmenitiesPage,
        tournamentForm: enTournamentForm,
        tournamentPage: enTournamentPage,
        tournamentDetails: entournamentDetails,
        addOnsForm: enAddOnsForm,
        addOnsPage: enAddOnsPage,

        booking: enBookingsPage,
        bookingDetails: enBookingDetails,
        notifications: enNotifications,
        bannersPage: enBannersPage,
        ticketsPage: enTicketsPage,
        createTicket: enCreateTicket,
        calendar: enCalendar,
        revenueOverview: enRevenueOverview,
        transactions: enTransactions,
        reports: enReports,
        teamActivity: enTeamActivity,
        popularVenues: enPopularVenues,
        vouchers: enVouchers,
        createEditVoucher: enCreateEditVoucher,
        pieChart: enPieChart,
        players: enPlayers,
        venueSportsPage: enVenueSportsPage,
        venueSportsForm: enVenueSportsForm,
        profileSettings: enProfileSettings,
    },
    ar: {
        common: arCommon,
        sidebar: arSidebar,
        venueForm: arVenueForm,
        venuesPage: arVenuesPage,
        statusManagement: arStatus,
        venueDetails: arVenueDetails,
        pitchForm: arPitchForm,
        pitchDetails: arPitchDetails,
        pitchesPage: arPitchesPage,
        venueEditRequests: arVenueEditRequests,
        venueEditRequestDetails: arVenueEditRequestDetails,
        support: arSupport,
        amenitiesForm: arAmenitiesForm,
        amenitiesPage: arAmenitiesPage,
        tournamentForm: arTournamentForm,
        tournamentPage: arTournamentPage,
        tournamentDetails: artournamentDetails,
        addOnsForm: arAddOnsForm,
        addOnsPage: arAddOnsPage,
        booking: arBookingsPage,
        bookingDetails: arBookingDetails,
        notifications: arNotifications,
        bannersPage: arBannersPage,
        ticketsPage: arTicketsPage,
        createTicket: arCreateTicket,
        calendar: arCalendar,
        revenueOverview: arRevenueOverview,
        transactions: arTransactions,
        reports: arReports,
        teamActivity: arTeamActivity,
        popularVenues: arPopularVenues,
        vouchers: arVouchers,
        createEditVoucher: arCreateEditVoucher,
        pieChart: arPieChart,
        players: arPlayers,
        venueSportsPage: arVenueSportsPage,
        venueSportsForm: arVenueSportsForm,
        profileSettings: arProfileSettings,


    },
};

// Get initial language from localStorage
const getInitialLanguage = () => {
    const savedLang = localStorage.getItem('appLanguage');
    return (savedLang && ['en', 'ar'].includes(savedLang)) ? savedLang : 'en';
};

// Initialize i18n
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: getInitialLanguage(),
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: [
            'common',
            'sidebar',
            'venueForm',
            'venuesPage',
            'venueDetails',
            'statusManagement',
            'pitchForm',
            'pitchDetails',
            'pitchesPage',
            'venueEditRequests',
            'venueEditRequestDetails',
            'support',
            'amenitiesForm',
            'amenitiesPage',
            'tournamentForm',
            'tournamentPage',
            'tournamentDetails',
            'addOnsForm',
            'addOnsPage',
            'booking',
            'bookingDetails',
            'notifications',
            'bannersPage',
            'ticketsPage',
            'createTicket',
            'calendar',
            'revenueOverview',
            'transactions',
            'reports',
            'teamActivity',
            'popularVenues',
            'vouchers',
            'createEditVoucher',
            'pieChart',
            'players',
            'venueSportsForm',
            'profileSettings'
        ],
        debug: process.env.NODE_ENV === 'development',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'appLanguage',
        },
        react: {
            useSuspense: true,
        },
        supportedLngs: ['en', 'ar'],
    });

// Export a function to change language that can be called from Redux
export const changeI18nLanguage = (lng) => {
    if (['en', 'ar'].includes(lng)) {
        i18n.changeLanguage(lng);
    }
};

export default i18n;