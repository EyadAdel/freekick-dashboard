// hooks/useNotifications.js
// Create this hook to manage notifications

import { useState, useEffect, useCallback } from 'react';
import { onMessageListener } from '../firebase/firebase';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Load notifications from localStorage on mount
    useEffect(() => {
        const loadNotifications = () => {
            try {
                const stored = localStorage.getItem('notifications');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setNotifications(parsed);
                    // Count unread notifications
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
            localStorage.setItem('notifications', JSON.stringify(notifications));
            const unread = notifications.filter(n => !n.read).length;
            setUnreadCount(unread);
        }
    }, [notifications, isLoading]);

    // Listen for new Firebase notifications
    useEffect(() => {
        const setupListener = async () => {
            try {
                const payload = await onMessageListener();

                // Add new notification
                const newNotification = {
                    id: Date.now(),
                    title: payload.notification?.title || 'New Notification',
                    body: payload.notification?.body || '',
                    image: payload.notification?.image || null,
                    data: payload.data || {},
                    timestamp: new Date().toISOString(),
                    read: false
                };

                setNotifications(prev => [newNotification, ...prev]);

                // Show browser notification
                if (Notification.permission === 'granted') {
                    new Notification(newNotification.title, {
                        body: newNotification.body,
                        icon: newNotification.image || '/logo192.png',
                        badge: '/logo192.png'
                    });
                }
            } catch (error) {
                console.error('Error in notification listener:', error);
            }
        };

        setupListener();
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
        setNotifications([]);
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