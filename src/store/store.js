import { configureStore } from '@reduxjs/toolkit';
import bookingsReducer from '../features/bookings/bookingSlice.js';
import authReducer from '../features/auth/authSlice.js'
import languageReducer from '../features/language/languageSlice.js';
import pageTitleReducer from '../features/pageTitle/pageTitleSlice.js';
import ticketsReducer from '../features/Tickets/ticketsSlice.js'
import bannerReducer from '../features/banners/bannerSlilce.js'
import analyticsReducer from '../features/dashboard/analyticsSlice.js'
import vouchersReducer from '../features/vouchers/vouchersSlice.js'

export const store = configureStore({
    reducer: {
        bookings: bookingsReducer,
        language: languageReducer,
        pageTitle: pageTitleReducer,
        tickets: ticketsReducer,
        auth: authReducer,
        banners: bannerReducer,
        analytics: analyticsReducer,
        vouchers: vouchersReducer,




    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});