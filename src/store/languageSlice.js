// src/store/languageSlice.js
import { createSlice } from '@reduxjs/toolkit';

const getInitialLanguage = () => {
    const savedLang = localStorage.getItem('appLanguage');
    return (savedLang && ['en', 'ar'].includes(savedLang)) ? savedLang : 'en';
};

// Function to update document and body attributes
const updateDocumentAttributes = (direction, currentLanguage) => {
    // Update document direction and language attributes
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage;
    document.documentElement.setAttribute('data-lang', currentLanguage);

    // Update body classes
    document.body.classList.remove('rtl', 'ltr');
    document.body.classList.add(direction);

    // Add language-specific class for CSS targeting
    document.body.classList.remove('lang-en', 'lang-ar');
    document.body.classList.add(`lang-${currentLanguage}`);
};

// Initialize on load
const initialLanguage = getInitialLanguage();
const initialDirection = initialLanguage === 'ar' ? 'rtl' : 'ltr';
updateDocumentAttributes(initialDirection, initialLanguage);

const languageSlice = createSlice({
    name: 'language',
    initialState: {
        currentLanguage: initialLanguage,
        direction: initialDirection
    },
    reducers: {
        setLanguage: (state, action) => {
            const newLang = action.payload;
            if (['en', 'ar'].includes(newLang)) {
                state.currentLanguage = newLang;
                state.direction = newLang === 'ar' ? 'rtl' : 'ltr';
                localStorage.setItem('appLanguage', newLang);

                // Update document attributes when language changes
                updateDocumentAttributes(state.direction, newLang);
            }
        }
    }
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;