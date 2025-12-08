// hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../firebase/firebase';
import useAnalytics from './useAnalytics'; // Import your existing hook

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Get the API functions from your existing hook
    const {
        notifications: apiNotifications,
        getNotifications,
        markAsRead: apiMarkAsRead
    } = useAnalytics();

    // Fetch notifications from API on mount
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setIsLoading(true);
                await getNotifications({ page_limit: 50, ordering: '-created_at' });
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    // Update local state when API notifications change
    useEffect(() => {
        if (apiNotifications && apiNotifications.length > 0) {
            // Transform API notifications to match local format
            const transformedNotifications = apiNotifications.map(notification => ({
                id: notification.id,
                title: notification.title || 'New Notification',
                body: notification.message || '',
                image: notification.image || null,
                data: notification,
                timestamp: notification.created_at,
                read: notification.is_active, // Assuming is_active means it's been read
                model_id: notification.model_id
            }));

            setNotifications(transformedNotifications);

            // Calculate unread count
            const unread = transformedNotifications.filter(n => !n.read).length;
            setUnreadCount(unread);
        }
    }, [apiNotifications]);

    // Listen for new Firebase notifications
    useEffect(() => {
        if (!messaging) {
            console.warn('Firebase messaging not initialized');
            return;
        }

        const unsubscribe = onMessage(messaging, async (payload) => {
            console.log('New Firebase notification received:', payload);

            // Refresh notifications from API when new notification arrives
            try {
                await getNotifications({ page_limit: 50, ordering: '-created_at' });

                // Show browser notification
                if (Notification.permission === 'granted') {
                    new Notification(
                        payload.notification?.title || 'New Notification',
                        {
                            body: payload.notification?.body || '',
                            icon: payload.notification?.image || '/logo192.png',
                            badge: '/logo192.png',
                            tag: `notification-${Date.now()}`,
                            requireInteraction: false
                        }
                    );
                }

                // Play notification sound (optional)
                playNotificationSound();
            } catch (error) {
                console.error('Error refreshing notifications:', error);
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [getNotifications]);

    // Play notification sound
    const playNotificationSound = () => {
        try {
            const audio = new Audio('/notification-sound.mp3'); // Add sound file to public folder
            audio.volume = 0.5;
            audio.play().catch(err => console.log('Audio play failed:', err));
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    };

    // Mark notification as read (calls API)
    const markAsRead = useCallback(async (id) => {
        try {
            // Optimistically update UI
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === id
                        ? { ...notification, read: true }
                        : notification
                )
            );

            // Call API to mark as read
            await apiMarkAsRead(id);

            // Refresh notifications to sync with backend
            await getNotifications({ page_limit: 50, ordering: '-created_at' });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert optimistic update on error
            await getNotifications({ page_limit: 50, ordering: '-created_at' });
        }
    }, [apiMarkAsRead, getNotifications]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            // Optimistically update UI
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, read: true }))
            );

            // Call API for each unread notification
            const unreadNotifications = notifications.filter(n => !n.read);
            await Promise.all(
                unreadNotifications.map(notification => apiMarkAsRead(notification.id))
            );

            // Refresh notifications
            await getNotifications({ page_limit: 50, ordering: '-created_at' });
        } catch (error) {
            console.error('Error marking all as read:', error);
            await getNotifications({ page_limit: 50, ordering: '-created_at' });
        }
    }, [notifications, apiMarkAsRead, getNotifications]);

    // Delete notification (if your API supports it)
    const deleteNotification = useCallback(async (id) => {
        try {
            // Optimistically update UI
            setNotifications(prev => prev.filter(n => n.id !== id));

            // TODO: Call your delete API endpoint here
            // await deleteNotificationAPI(id);

            // Refresh notifications
            await getNotifications({ page_limit: 50, ordering: '-created_at' });
        } catch (error) {
            console.error('Error deleting notification:', error);
            await getNotifications({ page_limit: 50, ordering: '-created_at' });
        }
    }, [getNotifications]);

    // Clear all notifications
    const clearAll = useCallback(async () => {
        try {
            // Optimistically update UI
            setNotifications([]);

            // TODO: Call your clear all API endpoint here
            // await clearAllNotificationsAPI();

            // Refresh notifications
            await getNotifications({ page_limit: 50, ordering: '-created_at' });
        } catch (error) {
            console.error('Error clearing notifications:', error);
            await getNotifications({ page_limit: 50, ordering: '-created_at' });
        }
    }, [getNotifications]);

    // Refresh notifications manually
    const refreshNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            await getNotifications({ page_limit: 50, ordering: '-created_at' });
        } catch (error) {
            console.error('Error refreshing notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [getNotifications]);

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refreshNotifications
    };
};