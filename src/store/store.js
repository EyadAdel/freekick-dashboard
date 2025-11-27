import { configureStore } from '@reduxjs/toolkit';
import bookingsReducer from '../features/bookings/bookingSlice.js';
import authReducer from '../features/auth/authSlice.js'
import languageReducer from './languageSlice';

export const store = configureStore({
    reducer: {
        bookings: bookingsReducer,
        language: languageReducer,

        auth: authReducer,


    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});