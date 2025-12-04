import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const NotificationDebugger = () => {
    const [debugInfo, setDebugInfo] = useState({
        browserSupport: false,
        serviceWorkerSupport: false,
        pushSupport: false,
        permission: 'unknown',
        messagingInitialized: false,
        serviceWorkers: [],
        hasToken: false,
        isHttps: false,
        hostname: '',
    });

    const [testStatus, setTestStatus] = useState('');

    useEffect(() => {
        checkDebugInfo();
    }, []);

    const checkDebugInfo = async () => {
        const info = {
            browserSupport: 'Notification' in window,
            serviceWorkerSupport: 'serviceWorker' in navigator,
            pushSupport: 'PushManager' in window,
            permission: Notification.permission,
            messagingInitialized: false,
            serviceWorkers: [],
            hasToken: !!localStorage.getItem('fcm_token'),
            isHttps: window.location.protocol === 'https:',
            hostname: window.location.hostname,
        };

        // Check service workers
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                info.serviceWorkers = registrations.map(reg => reg.scope);
            } catch (error) {
                console.error('Error checking service workers:', error);
            }
        }

        setDebugInfo(info);
    };

    const requestPermission = async () => {
        setTestStatus('Requesting permission...');
        try {
            const { requestNotificationPermission } = await import('../firebase/firebase');
            const token = await requestNotificationPermission();

            if (token) {
                setTestStatus(`✅ Success! Token: ${token.substring(0, 20)}...`);
            } else {
                setTestStatus('❌ Failed to get token');
            }

            await checkDebugInfo();
        } catch (error) {
            setTestStatus(`❌ Error: ${error.message}`);
        }
    };

    const testNotification = () => {
        if (Notification.permission === 'granted') {
            new Notification('Test Notification', {
                body: 'This is a test notification from your app!',
                icon: '/logo192.png',
            });
            setTestStatus('✅ Test notification sent!');
        } else {
            setTestStatus('❌ Permission not granted');
        }
    };

    const checkServiceWorker = async () => {
        try {
            const response = await fetch('/firebase-messaging-sw.js');
            if (response.ok) {
                setTestStatus('✅ Service worker file is accessible');
            } else {
                setTestStatus(`❌ Service worker returned status: ${response.status}`);
            }
        } catch (error) {
            setTestStatus(`❌ Cannot access service worker: ${error.message}`);
        }
    };

    const StatusIcon = ({ status }) => {
        if (status) {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        }
        return <XCircle className="w-5 h-5 text-red-500" />;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <Bell className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                    Notification System Debugger
                </h2>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <StatusIcon status={debugInfo.browserSupport} />
                        <h3 className="font-semibold">Browser Support</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                        Notifications API: {debugInfo.browserSupport ? 'Yes' : 'No'}
                    </p>
                    <p className="text-sm text-gray-600">
                        Service Workers: {debugInfo.serviceWorkerSupport ? 'Yes' : 'No'}
                    </p>
                    <p className="text-sm text-gray-600">
                        Push API: {debugInfo.pushSupport ? 'Yes' : 'No'}
                    </p>
                </div>

                <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <StatusIcon status={debugInfo.permission === 'granted'} />
                        <h3 className="font-semibold">Permission Status</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                        Current: <span className="font-mono">{debugInfo.permission}</span>
                    </p>
                </div>

                <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <StatusIcon status={debugInfo.isHttps || debugInfo.hostname === 'localhost'} />
                        <h3 className="font-semibold">Security</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                        Protocol: {window.location.protocol}
                    </p>
                    <p className="text-sm text-gray-600">
                        Hostname: {debugInfo.hostname}
                    </p>
                    {!debugInfo.isHttps && debugInfo.hostname !== 'localhost' && (
                        <p className="text-xs text-red-600 mt-2">
                            ⚠️ HTTPS required for production
                        </p>
                    )}
                </div>

                <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <StatusIcon status={debugInfo.serviceWorkers.length > 0} />
                        <h3 className="font-semibold">Service Workers</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                        Registered: {debugInfo.serviceWorkers.length}
                    </p>
                    {debugInfo.serviceWorkers.map((scope, i) => (
                        <p key={i} className="text-xs text-gray-500 truncate">
                            {scope}
                        </p>
                    ))}
                </div>
            </div>

            {/* FCM Token Status */}
            <div className="p-4 border rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <StatusIcon status={debugInfo.hasToken} />
                    <h3 className="font-semibold">FCM Token</h3>
                </div>
                {debugInfo.hasToken ? (
                    <p className="text-sm text-gray-600 font-mono break-all">
                        {localStorage.getItem('fcm_token')}
                    </p>
                ) : (
                    <p className="text-sm text-gray-600">No token stored</p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                    onClick={requestPermission}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Request Permission
                </button>
                <button
                    onClick={testNotification}
                    disabled={debugInfo.permission !== 'granted'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Send Test Notification
                </button>
                <button
                    onClick={checkServiceWorker}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Check Service Worker
                </button>
            </div>

            {/* Status Message */}
            {testStatus && (
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <p className="text-sm font-mono break-all">{testStatus}</p>
                    </div>
                </div>
            )}

            {/* Troubleshooting Tips */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Tips:</h3>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Ensure the site is running on HTTPS (not required for localhost)</li>
                    <li>Check that firebase-messaging-sw.js is in the /public folder</li>
                    <li>Verify Firebase config matches your project settings</li>
                    <li>Clear browser cache and reload if you updated the service worker</li>
                    <li>Check browser console for detailed error messages</li>
                    <li>Ensure VAPID key is correct in firebase.js</li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationDebugger;