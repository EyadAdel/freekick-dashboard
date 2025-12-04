// firebase/firebase.js - Fixed Firebase Configuration

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
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
const analytics = getAnalytics(app);

// Initialize Firebase Cloud Messaging
let messaging = null;
try {
    messaging = getMessaging(app);
} catch (error) {
    console.error("Error initializing messaging:", error);
}

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
    try {
        if (!messaging) {
            console.error("Messaging not initialized");
            return null;
        }

        // Check if service worker is registered
        if (!('serviceWorker' in navigator)) {
            console.error('Service Worker not supported');
            return null;
        }

        // Request permission from the user
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            console.log("Notification permission granted.");

            // Get FCM token
            const token = await getToken(messaging, {
                vapidKey: "BMfYt-bUJUPmUFlTdhVKR7M0wZWUtr7qavlXIwbKs2bEcaO9c4Kiy9SQPkS69yKr09ub6dJcN6ACrVRSvG7REzU"
            });

            if (token) {
                console.log("FCM Token:", token);

                // Save token to localStorage for reference
                localStorage.setItem('fcm_token', token);

                // TODO: Send this token to your backend server
                // Example:
                /*
                await fetch('/api/save-fcm-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                */

                return token;
            } else {
                console.log("No registration token available.");
                return null;
            }
        } else if (permission === "denied") {
            console.log("Notification permission denied.");
            return null;
        } else {
            console.log("Notification permission dismissed.");
            return null;
        }
    } catch (error) {
        console.error("Error getting notification permission:", error);
        return null;
    }
};

// Export for use in other components
export { app, analytics, messaging };