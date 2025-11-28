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
        ns: ['common', 'sidebar'],
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