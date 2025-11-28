import { configureStore } from '@reduxjs/toolkit';
import bookingsReducer from '../features/bookings/bookingSlice.js';
import authReducer from '../features/auth/authSlice.js'
import languageReducer from '../features/language/languageSlice.js';
import pageTitleReducer from '../features/pageTitle/pageTitleSlice.js';

export const store = configureStore({
    reducer: {
        bookings: bookingsReducer,
        language: languageReducer,
        pageTitle: pageTitleReducer,

        auth: authReducer,


    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});