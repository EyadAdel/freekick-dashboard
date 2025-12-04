// firebase/firebase.js - Production-Ready Firebase Configuration

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyALcacESsVP5EnOUJ0CsCZl9faFoVhrQCI",
    authDomain: "newfreekick.firebaseapp.com",
    projectId: "newfreekick",
    storageBucket: "newfreekick.firebasestorage.app",
    messagingSenderId: "481395994189",
    appId: "1:481395994189:web:55471b2b4ac9a9f491b604",
    measurementId: "G-MJF54ME8XX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

// Initialize Firebase Cloud Messaging with support check
let messaging = null;

const initializeMessaging = async () => {
    try {
        const supported = await isSupported();
        if (supported) {
            messaging = getMessaging(app);
            console.log('Firebase messaging initialized successfully');
            return messaging;
        } else {
            console.warn('Firebase messaging is not supported in this browser');
            return null;
        }
    } catch (error) {
        console.error('Error initializing Firebase messaging:', error);
        return null;
    }
};

// Initialize messaging immediately
initializeMessaging();

// VAPID Key
const VAPID_KEY = "BMfYt-bUJUPmUFlTdhVKR7M0wZWUtr7qavlXIwbKs2bEcaO9c4Kiy9SQPkS69yKr09ub6dJcN6ACrVRSvG7REzU";

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
    try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.error('This browser does not support notifications');
            return null;
        }

        // Check if messaging is initialized
        if (!messaging) {
            await initializeMessaging();
            if (!messaging) {
                console.error('Messaging not available');
                return null;
            }
        }

        // Check current permission
        console.log('Current notification permission:', Notification.permission);

        // Request permission if not already granted
        let permission = Notification.permission;

        if (permission === 'default') {
            permission = await Notification.requestPermission();
            console.log('New permission status:', permission);
        }

        if (permission === "granted") {
            console.log("✅ Notification permission granted");

            try {
                // Register service worker if not already registered
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.register(
                        '/firebase-messaging-sw.js',
                        { scope: '/' }
                    );
                    console.log('Service Worker registered:', registration);

                    // Wait for service worker to be ready
                    await navigator.serviceWorker.ready;
                    console.log('Service Worker is ready');
                }

                // Get FCM token
                const token = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: await navigator.serviceWorker.ready
                });

                if (token) {
                    console.log("✅ FCM Token obtained:", token);

                    // Store token in localStorage for debugging
                    localStorage.setItem('fcm_token', token);

                    // TODO: Send token to your backend
                    // await sendTokenToServer(token);

                    return token;
                } else {
                    console.log("❌ No FCM token available");
                    return null;
                }
            } catch (tokenError) {
                console.error("Error getting FCM token:", tokenError);

                // Detailed error logging
                if (tokenError.code === 'messaging/permission-blocked') {
                    console.error('Notification permission is blocked. Please enable it in browser settings.');
                } else if (tokenError.code === 'messaging/registration-token-not-subscribed-yet') {
                    console.error('Registration token not subscribed yet. Try again in a moment.');
                } else {
                    console.error('Token error details:', tokenError);
                }

                return null;
            }
        } else if (permission === "denied") {
            console.log("❌ Notification permission denied by user");
            alert('Please enable notifications in your browser settings to receive updates.');
            return null;
        } else {
            console.log("⚠️ Notification permission not determined");
            return null;
        }
    } catch (error) {
        console.error("❌ Error in requestNotificationPermission:", error);
        return null;
    }
};

// Debugging function - Call this to check notification setup
export const debugNotificationSetup = async () => {
    console.group('🔍 Firebase Notification Debug');

    console.log('1. Browser Support:');
    console.log('   - Notifications:', 'Notification' in window);
    console.log('   - Service Worker:', 'serviceWorker' in navigator);
    console.log('   - Push Manager:', 'PushManager' in window);

    console.log('2. Permission Status:');
    console.log('   - Current:', Notification.permission);

    console.log('3. Firebase:');
    console.log('   - Messaging initialized:', !!messaging);
    console.log('   - Messaging supported:', await isSupported());

    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('4. Service Workers:', registrations.length);
        registrations.forEach((reg, i) => {
            console.log(`   - SW ${i + 1}:`, reg.scope);
        });
    }

    const storedToken = localStorage.getItem('fcm_token');
    console.log('5. Stored FCM Token:', storedToken ? 'Yes' : 'No');

    console.log('6. Current URL:', window.location.href);
    console.log('7. Protocol:', window.location.protocol);

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('⚠️ WARNING: Notifications require HTTPS in production!');
    }

    console.groupEnd();
};

// Function to send token to your backend (implement based on your API)
const sendTokenToServer = async (token) => {
    try {
        // Replace with your actual API endpoint
        const response = await fetch('/api/notifications/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add your auth token if needed
                // 'Authorization': `Bearer ${yourAuthToken}`
            },
            body: JSON.stringify({ fcm_token: token })
        });

        if (!response.ok) {
            throw new Error('Failed to register FCM token');
        }

        console.log('✅ FCM token registered with backend');
        return true;
    } catch (error) {
        console.error('❌ Error sending token to server:', error);
        return false;
    }
};

// Export for use in other components
export { app, analytics, messaging };