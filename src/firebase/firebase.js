// firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyALcacESsVP5EnOUJ0CsCZl9faFoVhrQCI",
    authDomain: "newfreekick.firebaseapp.com",
    projectId: "newfreekick",
    storageBucket: "newfreekick.firebasestorage.app",
    messagingSenderId: "481395994189",
    appId: "1:481395994189:web:55471b2b4ac9a9f491b604",
    measurementId: "G-MJF54ME8XX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

let messaging = null;
try {
    messaging = getMessaging(app);
} catch (error) {
    console.error("Error initializing messaging:", error);
}

export const requestNotificationPermission = async () => {
    try {
        console.log('🔔 Starting FCM token request...');

        if (!messaging) {
            console.error("❌ Messaging not initialized");
            return null;
        }

        if (!('serviceWorker' in navigator)) {
            console.error('❌ Service Worker not supported');
            return null;
        }

        const currentPermission = Notification.permission;
        console.log('📱 Current permission:', currentPermission);

        if (currentPermission === "denied") {
            console.log("❌ Notification permission was previously denied.");
            return null;
        }

        const permission = await Notification.requestPermission();
        console.log('📱 Permission result:', permission);

        if (permission === "granted") {
            console.log("✅ Notification permission granted.");

            const token = await getToken(messaging, {
                vapidKey: "BMfYt-bUJUPmUFlTdhVKR7M0wZWUtr7qavlXIwbKs2bEcaO9c4Kiy9SQPkS69yKr09ub6dJcN6ACrVRSvG7REzU"
            });

            if (token) {
                console.log("✅ FCM Token obtained:", token);
                localStorage.setItem('fcm_token', token);
                return token;
            } else {
                console.log("❌ No registration token available.");
                return null;
            }
        } else {
            console.log("❌ Notification permission not granted.");
            return null;
        }
    } catch (error) {
        console.error("❌ Error getting notification permission:", error);
        return null;
    }
};

export const deleteFCMToken = async () => {
    try {
        const token = localStorage.getItem('fcm_token');
        if (token) {
            localStorage.removeItem('fcm_token');
        }
    } catch (error) {
        console.error('Error deleting FCM token:', error);
    }
};
// In firebase.js, add more logging
export { app, analytics, messaging };