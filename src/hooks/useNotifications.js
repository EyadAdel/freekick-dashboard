// hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../firebase/firebase';
import useAnalytics from './useAnalytics';
import toast from 'react-hot-toast';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true); // Add audio toggle

    // Track locally read notifications in localStorage
    const [localReadIds, setLocalReadIds] = useState(() => {
        try {
            const stored = localStorage.getItem('readNotifications');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Get the API functions from your existing hook
    const {
        notifications: apiNotifications,
        getNotifications,
    } = useAnalytics();

    // Save local read IDs to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('readNotifications', JSON.stringify(localReadIds));
    }, [localReadIds]);

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
            const transformedNotifications = apiNotifications.map(notification => {
                // Check if this notification was read locally
                const isLocallyRead = localReadIds.includes(notification.id);

                return {
                    id: notification.id,
                    title: notification.title || 'New Notification',
                    body: notification.message || '',
                    image: notification.image || null,
                    data: notification,
                    timestamp: notification.created_at,
                    // Use local read status if available, otherwise use API status
                    read: isLocallyRead || notification.is_active === false,
                    model_id: notification.model_id
                };
            });

            setNotifications(transformedNotifications);

            // Calculate unread count
            const unread = transformedNotifications.filter(n => !n.read).length;
            setUnreadCount(unread);

            console.log('📊 Notifications updated:', {
                total: transformedNotifications.length,
                unread: unread,
                locallyRead: localReadIds.length,
                sample: transformedNotifications.slice(0, 3).map(n => ({
                    id: n.id,
                    title: n.title,
                    read: n.read
                }))
            });
        } else if (apiNotifications && apiNotifications.length === 0) {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [apiNotifications, localReadIds]);

    // IMPROVED: Play notification sound with better error handling
    const playNotificationSound = useCallback(() => {
        if (!audioEnabled) {
            console.log('🔇 Audio is disabled by user');
            return;
        }

        try {
            // Try multiple sound sources (from most preferred to fallback)
            const soundSources = [
                '/notification-sound.wav',
                '/sounds/notification.mp3',
                // Fallback to a data URI for a simple beep sound
                'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'
            ];

            let audio;
            let played = false;

            const tryPlaySound = (src) => {
                return new Promise((resolve, reject) => {
                    audio = new Audio(src);
                    audio.volume = 0.5;

                    audio.addEventListener('canplaythrough', () => {
                        audio.play()
                            .then(() => {
                                console.log('✅ Notification sound played successfully');
                                played = true;
                                resolve(true);
                            })
                            .catch(reject);
                    }, { once: true });

                    audio.addEventListener('error', (e) => {
                        console.warn(`⚠️ Failed to load sound from ${src}:`, e);
                        reject(e);
                    }, { once: true });

                    // Set source to trigger loading
                    audio.src = src;
                    audio.load();
                });
            };

            // Try each source in order
            (async () => {
                for (const src of soundSources) {
                    try {
                        await tryPlaySound(src);
                        if (played) break;
                    } catch (err) {
                        console.log(`Failed to play ${src}, trying next...`);
                    }
                }

                if (!played) {
                    console.warn('❌ All notification sound sources failed');
                    // Show a visual indicator instead
                    toast('🔔 New notification', {
                        duration: 1000,
                        position: 'top-center',
                        style: {
                            background: '#4F46E5',
                            color: '#fff',
                        }
                    });
                }
            })();

        } catch (error) {
            console.error('❌ Could not play notification sound:', error);
        }
    }, [audioEnabled]);

    // Listen for new Firebase notifications
    useEffect(() => {
        if (!messaging) {
            console.warn('Firebase messaging not initialized');
            return;
        }

        const unsubscribe = onMessage(messaging, async (payload) => {
            console.log('📩 New Firebase notification received:', payload);

            // Extract notification data
            const notificationData = {
                title: payload.notification?.title || 'New Notification',
                body: payload.notification?.body || '',
                image: payload.notification?.image || null
            };

            // Play notification sound FIRST
            playNotificationSound();

            // Show toast notification
            toast.success(
                `${notificationData.title}\n${notificationData.body}`,
                {
                    duration: 6000,
                    position: 'top-right',
                    icon: '🔔',
                    style: {
                        maxWidth: '400px',
                    }
                }
            );

            // Refresh notifications from API to get the latest data
            try {
                await getNotifications({ page_limit: 50, ordering: '-created_at' });
            } catch (error) {
                console.error('Error refreshing notifications:', error);
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [getNotifications, playNotificationSound]);

    // Mark notification as read (LOCAL ONLY - no API call)
    const markAsRead = useCallback((id) => {
        console.log('🔵 Marking notification as read locally:', id);

        // Add to local read IDs
        setLocalReadIds(prev => {
            if (prev.includes(id)) return prev;
            return [...prev, id];
        });

        // Update notification in state
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, read: true }
                    : notification
            )
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));

        console.log('✅ Notification marked as read locally');
    }, []);

    // Mark all as read (LOCAL ONLY)
    const markAllAsRead = useCallback(() => {
        console.log('🔵 Marking all notifications as read locally...');

        // Get all notification IDs
        const allIds = notifications.map(n => n.id);

        // Add all IDs to local read list
        setLocalReadIds(prev => {
            const newIds = allIds.filter(id => !prev.includes(id));
            return [...prev, ...newIds];
        });

        // Update all notifications in state
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true }))
        );

        // Reset unread count
        setUnreadCount(0);

        console.log('✅ All notifications marked as read locally');

        toast.success('All notifications marked as read', {
            duration: 2000,
            position: 'bottom-center',
        });
    }, [notifications]);


    // Delete notification (LOCAL ONLY)
    const deleteNotification = useCallback((id) => {
        console.log('🗑️ Deleting notification locally:', id);

        // Remove from notifications
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            // Recalculate unread count
            const unread = updated.filter(n => !n.read).length;
            setUnreadCount(unread);
            return updated;
        });

        // Also remove from local read IDs if it was there
        setLocalReadIds(prev => prev.filter(readId => readId !== id));

        toast.success('Notification deleted', {
            duration: 2000,
            position: 'bottom-center',
        });
    }, []);

    // Clear all notifications (LOCAL ONLY)
    const clearAll = useCallback(() => {
        console.log('🗑️ Clearing all notifications locally...');

        // Clear all notifications
        setNotifications([]);
        setUnreadCount(0);

        // Optionally clear local read IDs too
        // setLocalReadIds([]);

        toast.success('All notifications cleared', {
            duration: 2000,
            position: 'bottom-center',
        });
    }, []);

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

    // Clear local read history (useful for testing or user preference)
    const clearLocalReadHistory = useCallback(() => {
        setLocalReadIds([]);
        localStorage.removeItem('readNotifications');
        // Refresh to show current state
        setNotifications(prev =>
            prev.map(notification => ({
                ...notification,
                read: notification.data.is_active === false
            }))
        );
        // Recalculate unread count
        const unread = notifications.filter(n => n.data.is_active !== false).length;
        setUnreadCount(unread);

        toast.info('Local read history cleared', {
            duration: 2000,
            position: 'bottom-center',
        });
    }, [notifications]);

    // Toggle audio on/off
    const toggleAudio = useCallback(() => {
        setAudioEnabled(prev => !prev);
        toast.success(audioEnabled ? 'Notification sounds disabled' : 'Notification sounds enabled', {
            duration: 2000,
            position: 'bottom-center',
        });
    }, [audioEnabled]);

    // Test notification sound
    const testNotificationSound = useCallback(() => {
        playNotificationSound();
        toast.success('Testing notification sound', {
            duration: 2000,
            position: 'top-right',
        });
    }, [playNotificationSound]);

    return {
        notifications,
        unreadCount,
        isLoading,
        audioEnabled,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refreshNotifications,
        clearLocalReadHistory,
        toggleAudio,
        testNotificationSound, // Add this to test the sound
    };
};
// // hooks/useNotifications.js
// import { useState, useEffect, useCallback } from 'react';
// import { onMessage } from 'firebase/messaging';
// import { messaging } from '../firebase/firebase';
// import useAnalytics from './useAnalytics'; // Import your existing hook
//
// export const useNotifications = () => {
//     const [notifications, setNotifications] = useState([]);
//     const [unreadCount, setUnreadCount] = useState(0);
//     const [isLoading, setIsLoading] = useState(true);
//
//     // Get the API functions from your existing hook
//     const {
//         notifications: apiNotifications,
//         getNotifications,
//         markAsRead: apiMarkAsRead
//     } = useAnalytics();
//
//     // Fetch notifications from API on mount
//     useEffect(() => {
//         const fetchNotifications = async () => {
//             try {
//                 setIsLoading(true);
//                 await getNotifications({ page_limit: 50, ordering: '-created_at' });
//             } catch (error) {
//                 console.error('Error fetching notifications:', error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//
//         fetchNotifications();
//     }, []);
//
//     // Update local state when API notifications change
//     useEffect(() => {
//         if (apiNotifications && apiNotifications.length > 0) {
//             // Transform API notifications to match local format
//             const transformedNotifications = apiNotifications.map(notification => ({
//                 id: notification.id,
//                 title: notification.title || 'New Notification',
//                 body: notification.message || '',
//                 image: notification.image || null,
//                 data: notification,
//                 timestamp: notification.created_at,
//                 read: notification.is_active, // Assuming is_active means it's been read
//                 model_id: notification.model_id
//             }));
//
//             setNotifications(transformedNotifications);
//
//             // Calculate unread count
//             const unread = transformedNotifications.filter(n => !n.read).length;
//             setUnreadCount(unread);
//         }
//     }, [apiNotifications]);
//
//     // Listen for new Firebase notifications
//     useEffect(() => {
//         if (!messaging) {
//             console.warn('Firebase messaging not initialized');
//             return;
//         }
//
//         const unsubscribe = onMessage(messaging, async (payload) => {
//             console.log('New Firebase notification received:', payload);
//
//             // Refresh notifications from API when new notification arrives
//             try {
//                 await getNotifications({ page_limit: 50, ordering: '-created_at' });
//
//                 // Show browser notification
//                 if (Notification.permission === 'granted') {
//                     new Notification(
//                         payload.notification?.title || 'New Notification',
//                         {
//                             body: payload.notification?.body || '',
//                             icon: payload.notification?.image || '/logo192.png',
//                             badge: '/logo192.png',
//                             tag: `notification-${Date.now()}`,
//                             requireInteraction: false
//                         }
//                     );
//                 }
//
//                 // Play notification sound (optional)
//                 playNotificationSound();
//             } catch (error) {
//                 console.error('Error refreshing notifications:', error);
//             }
//         });
//
//         return () => {
//             if (unsubscribe) {
//                 unsubscribe();
//             }
//         };
//     }, [getNotifications]);
//
//     // Play notification sound
//     const playNotificationSound = () => {
//         try {
//             const audio = new Audio('/notification-sound.mp3'); // Add sound file to public folder
//             audio.volume = 0.5;
//             audio.play().catch(err => console.log('Audio play failed:', err));
//         } catch (error) {
//             console.log('Could not play notification sound:', error);
//         }
//     };
//
//     // Mark notification as read (calls API)
//     const markAsRead = useCallback(async (id) => {
//         try {
//             // Optimistically update UI
//             setNotifications(prev =>
//                 prev.map(notification =>
//                     notification.id === id
//                         ? { ...notification, read: true }
//                         : notification
//                 )
//             );
//
//             // Call API to mark as read
//             await apiMarkAsRead(id);
//
//             // Refresh notifications to sync with backend
//             await getNotifications({ page_limit: 50, ordering: '-created_at' });
//         } catch (error) {
//             console.error('Error marking notification as read:', error);
//             // Revert optimistic update on error
//             await getNotifications({ page_limit: 50, ordering: '-created_at' });
//         }
//     }, [apiMarkAsRead, getNotifications]);
//
//     // Mark all as read
//     const markAllAsRead = useCallback(async () => {
//         try {
//             // Optimistically update UI
//             setNotifications(prev =>
//                 prev.map(notification => ({ ...notification, read: true }))
//             );
//
//             // Call API for each unread notification
//             const unreadNotifications = notifications.filter(n => !n.read);
//             await Promise.all(
//                 unreadNotifications.map(notification => apiMarkAsRead(notification.id))
//             );
//
//             // Refresh notifications
//             await getNotifications({ page_limit: 50, ordering: '-created_at' });
//         } catch (error) {
//             console.error('Error marking all as read:', error);
//             await getNotifications({ page_limit: 50, ordering: '-created_at' });
//         }
//     }, [notifications, apiMarkAsRead, getNotifications]);
//
//     // Delete notification (if your API supports it)
//     const deleteNotification = useCallback(async (id) => {
//         try {
//             // Optimistically update UI
//             setNotifications(prev => prev.filter(n => n.id !== id));
//
//             // TODO: Call your delete API endpoint here
//             // await deleteNotificationAPI(id);
//
//             // Refresh notifications
//             await getNotifications({ page_limit: 50, ordering: '-created_at' });
//         } catch (error) {
//             console.error('Error deleting notification:', error);
//             await getNotifications({ page_limit: 50, ordering: '-created_at' });
//         }
//     }, [getNotifications]);
//
//     // Clear all notifications
//     const clearAll = useCallback(async () => {
//         try {
//             // Optimistically update UI
//             setNotifications([]);
//
//             // TODO: Call your clear all API endpoint here
//             // await clearAllNotificationsAPI();
//
//             // Refresh notifications
//             await getNotifications({ page_limit: 50, ordering: '-created_at' });
//         } catch (error) {
//             console.error('Error clearing notifications:', error);
//             await getNotifications({ page_limit: 50, ordering: '-created_at' });
//         }
//     }, [getNotifications]);
//
//     // Refresh notifications manually
//     const refreshNotifications = useCallback(async () => {
//         try {
//             setIsLoading(true);
//             await getNotifications({ page_limit: 50, ordering: '-created_at' });
//         } catch (error) {
//             console.error('Error refreshing notifications:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [getNotifications]);
//
//     return {
//         notifications,
//         unreadCount,
//         isLoading,
//         markAsRead,
//         markAllAsRead,
//         deleteNotification,
//         clearAll,
//         refreshNotifications
//     };
// };