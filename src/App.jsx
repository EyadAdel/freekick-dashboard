// src/App.jsx
import { Provider, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './store/store';
import './i18n/i18n.js';
import 'react-toastify/dist/ReactToastify.css';
import AppContent from "./AppContent.jsx";
import {requestNotificationPermission} from "./firebase/firebase.js";
import {useEffect} from "react";

// Separate component to access Redux state
function ToastWrapper() {
    const { direction } = useSelector((state) => state.language);

    return (
        <ToastContainer
            position={direction === 'rtl' ? 'top-left' : 'top-center'}
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={direction === 'rtl'}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            limit={3}
        />
    );
}
// In your main index.js or App.js
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
function App() {
    useEffect(() => {
        const setupNotifications = async () => {
            try {
                // Register service worker first
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.register(
                        '/firebase-messaging-sw.js'
                    );
                    console.log('Service Worker registered:', registration);
                }

                // Request notification permission
                const token = await requestNotificationPermission();
                if (token) {
                    console.log('Notifications enabled with token:', token);
                } else {
                    console.log('Notification permission not granted');
                }
            } catch (error) {
                console.error('Error setting up notifications:', error);
            }
        };

        setupNotifications();
    }, []);
    return (
        <Provider store={store}>
            <AppContent />
            <ToastWrapper />
        </Provider>
    );
}

export default App;