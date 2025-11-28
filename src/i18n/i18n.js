// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import arCommon from '../locales/ar/common.json';
import enSidebar from '../locales/en/Sidebar.json';
import arSidebar from '../locales/ar/Sidebar.json';

// Translation resources
const resources = {
    en: {
        common: enCommon,
        sidebar: enSidebar,
    },
    ar: {
        common: arCommon,
        sidebar: arSidebar,
    },
};

// Initialize i18n
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('appLanguage') || 'en',
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common'],
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

export default i18n;