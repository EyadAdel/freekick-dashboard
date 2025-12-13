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
            'addOnsPage'
        ],        debug: process.env.NODE_ENV === 'development',
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