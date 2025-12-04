// firebase.js - Complete Firebase Configuration with Notifications

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
const messaging = getMessaging(app);

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
    try {
        // Request permission from the user
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            console.log("Notification permission granted.");

            // Get FCM token
            // IMPORTANT: Replace 'YOUR_VAPID_KEY' with your actual VAPID key
            // Get it from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
            const token = await getToken(messaging, {
                vapidKey: "BMfYt-bUJUPmUFlTdhVKR7M0wZWUtr7qavlXIwbKs2bEcaO9c4Kiy9SQPkS69yKr09ub6dJcN6ACrVRSvG7REzU" // TODO: Replace with your VAPID key
            });

            if (token) {
                console.log("FCM Token:", token);
                // TODO: Send this token to your backend server to store it
                // Example: await fetch('/api/save-token', { method: 'POST', body: JSON.stringify({ token }) });
                return token;
            } else {
                console.log("No registration token available.");
            }
        } else if (permission === "denied") {
            console.log("Notification permission denied.");
        }
    } catch (error) {
        console.error("Error getting notification permission:", error);
    }
};

// Listen for foreground messages (when app is open)
export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log("Message received in foreground:", payload);
            resolve(payload);
        });
    });

// Export for use in other components
export { app, analytics, messaging };