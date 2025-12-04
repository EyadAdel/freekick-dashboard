import { useEffect, useState } from 'react';
import { requestNotificationPermission, onMessageListener } from '../firebase/firebase';

export default function NotificationHandler() {
    const [notification, setNotification] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        // Request permission and get token when component mounts
        const initializeNotifications = async () => {
            const fcmToken = await requestNotificationPermission();
            if (fcmToken) {
                setToken(fcmToken);
                // TODO: Send this token to your backend
                console.log("Save this token to your database:", fcmToken);

                // Store token in localStorage for testing
                localStorage.setItem('fcm_token', fcmToken);
            }
        };

        initializeNotifications();

        // Listen for foreground messages
        const messageListener = onMessageListener()
            .then((payload) => {
                console.log("Received foreground message:", payload);

                setNotification({
                    title: payload.notification?.title || "New Notification",
                    body: payload.notification?.body || "",
                    image: payload.notification?.image || null
                });

                // Show browser notification (if app has focus)
                if (Notification.permission === "granted" && payload.notification) {
                    try {
                        new Notification(payload.notification.title || "New Notification", {
                            body: payload.notification.body || "",
                            icon: payload.notification.icon || "/logo192.png",
                            image: payload.notification.image,
                            badge: "/logo192.png"
                        });
                    } catch (error) {
                        console.error("Error showing notification:", error);
                    }
                }

                // Auto-hide notification after 5 seconds
                setTimeout(() => {
                    setNotification(null);
                }, 5000);
            })
            .catch((err) => console.error("Failed to receive message:", err));

        // Cleanup function - just return undefined since onMessage doesn't need cleanup
        return () => {
            // No cleanup needed for onMessage listener
            // Firebase handles this internally
        };
    }, []);

    return (
        <>
            {/* Display FCM Token (for debugging) */}
            {token && (
                <div style={{
                    position: 'fixed',
                    bottom: '10px',
                    left: '10px',
                    background: '#333',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    maxWidth: '300px',
                    wordBreak: 'break-all',
                    zIndex: 9999
                }}>
                    <strong>FCM Token (copy this):</strong>
                    <div style={{ marginTop: '5px', userSelect: 'all' }}>
                        {token}
                    </div>
                    <button
                        onClick={() => navigator.clipboard.writeText(token)}
                        style={{
                            marginTop: '5px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        Copy Token
                    </button>
                </div>
            )}

            {/* Display notification toast */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    maxWidth: '350px',
                    zIndex: 10000,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px'
                    }}>
                        {notification.image && (
                            <img
                                src={notification.image}
                                alt=""
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '5px',
                                    objectFit: 'cover'
                                }}
                            />
                        )}
                        <div style={{ flex: 1 }}>
                            <h4 style={{
                                margin: '0 0 8px 0',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#333'
                            }}>
                                {notification.title}
                            </h4>
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#666'
                            }}>
                                {notification.body}
                            </p>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: '#999',
                                padding: '0',
                                width: '24px',
                                height: '24px'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    );
}