// components/NotificationInitializer.jsx
import { useEffect } from 'react';
import { requestNotificationPermission } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';

const NotificationInitializer = () => {
    const { user } = useAuth();

    useEffect(() => {
        // Only request permission if user is logged in
        if (user) {
            const initializeNotifications = async () => {
                // Wait a bit before asking for permission (better UX)
                setTimeout(async () => {
                    const token = await requestNotificationPermission();

                    if (token) {
                        console.log('Notifications initialized successfully');
                    } else {
                        console.log('User declined notifications or they are not supported');
                    }
                }, 2000); // Wait 2 seconds after login
            };

            initializeNotifications();
        }
    }, [user]);

    // This component doesn't render anything
    return null;
};

export default NotificationInitializer;