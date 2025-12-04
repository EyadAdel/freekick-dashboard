// firebase-messaging-sw.js
// Place this file in the PUBLIC folder of your React project

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyALcacESsVP5EnOUJ0CsCZl9faFoVhrQCI",
    authDomain: "newfreekick.firebaseapp.com",
    projectId: "newfreekick",
    storageBucket: "newfreekick.firebasestorage.app",
    messagingSenderId: "481395994189",
    appId: "1:481395994189:web:55471b2b4ac9a9f491b604",
    measurementId: "G-MJF54ME8XX"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/logo192.png',
        badge: '/logo192.png',
        image: payload.notification?.image,
        data: payload.data,
        // Add action buttons (optional)
        actions: [
            {
                action: 'open',
                title: 'Open'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };

    // Show the notification
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    if (event.action === 'open') {
        // Open your app when notification is clicked
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});