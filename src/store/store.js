import { configureStore } from '@reduxjs/toolkit';
import bookingsReducer from '../features/bookings/bookingSlice.js';


export const store = configureStore({
    reducer: {
        bookings: bookingsReducer,

    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});