// hooks/useNotifications.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { messaging } from '../firebase/firebase';
import { onMessage } from 'firebase/messaging';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const unsubscribeRef = useRef(null);

    // Load notifications from localStorage on mount
    useEffect(() => {
        const loadNotifications = () => {
            try {
                const stored = localStorage.getItem('notifications');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setNotifications(parsed);
                    const unread = parsed.filter(n => !n.read).length;
                    setUnreadCount(unread);
                }
            } catch (error) {
                console.error('Error loading notifications:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadNotifications();
    }, []);

    // Save notifications to localStorage whenever they change
    useEffect(() => {
        if (!isLoading) {
            try {
                localStorage.setItem('notifications', JSON.stringify(notifications));
                const unread = notifications.filter(n => !n.read).length;
                setUnreadCount(unread);
            } catch (error) {
                console.error('Error saving notifications:', error);
            }
        }
    }, [notifications, isLoading]);

    // Listen for new Firebase notifications - PROPERLY FIXED
    useEffect(() => {
        if (!messaging) {
            console.warn('Firebase messaging not initialized');
            return;
        }

        // Set up listener directly with onMessage
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Received foreground message:', payload);

            try {
                // Create notification object
                const newNotification = {
                    id: Date.now() + Math.random(), // Ensure unique ID
                    title: payload.notification?.title || 'New Notification',
                    body: payload.notification?.body || '',
                    image: payload.notification?.image || null,
                    data: payload.data || {},
                    timestamp: new Date().toISOString(),
                    read: false
                };

                // Add to state
                setNotifications(prev => [newNotification, ...prev]);

                // Show browser notification if permission granted
                if ('Notification' in window && Notification.permission === 'granted') {
                    try {
                        const notification = new Notification(newNotification.title, {
                            body: newNotification.body,
                            icon: newNotification.image || '/logo192.png',
                            badge: '/logo192.png',
                            tag: `notification-${newNotification.id}`,
                            requireInteraction: false
                        });

                        // Auto close after 5 seconds
                        setTimeout(() => notification.close(), 5000);

                        // Handle click
                        notification.onclick = () => {
                            window.focus();
                            notification.close();
                        };
                    } catch (notifError) {
                        console.error('Error showing browser notification:', notifError);
                    }
                }
            } catch (error) {
                console.error('Error processing notification:', error);
            }
        });

        // Store unsubscribe function
        unsubscribeRef.current = unsubscribe;

        // Cleanup
        return () => {
            if (unsubscribeRef.current) {
                console.log('Unsubscribing from Firebase messages');
                unsubscribeRef.current();
            }
        };
    }, []);

    // Mark notification as read
    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, read: true }
                    : notification
            )
        );
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true }))
        );
    }, []);

    // Delete notification
    const deleteNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Clear all notifications
    const clearAll = useCallback(() => {
        if (window.confirm('Are you sure you want to clear all notifications?')) {
            setNotifications([]);
            localStorage.removeItem('notifications');
        }
    }, []);

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    };
};