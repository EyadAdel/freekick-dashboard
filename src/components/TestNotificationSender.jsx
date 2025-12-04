// Updated TestNotificationSender.jsx
import React, { useState } from 'react';
import api from "../services/api.js";

export default function TestNotificationSender() {
    const [token, setToken] = useState('');
    const [title, setTitle] = useState('Test Notification');
    const [body, setBody] = useState('This is a test notification');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const sendTestNotification = async () => {
        if (!token) {
            alert('Please enter a token');
            return;
        }

        setLoading(true);
        try {
            // Using your backend server
            const response = await fetch('https://api.freekickapp.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    title: title,
                    body: body
                })
            });

            const data = await response.json();
            setResult(data);
            console.log('Notification sent:', data);

            if (data.success) {
                alert('✅ Notification sent successfully! Check your browser.');
            } else {
                alert('❌ Failed to send notification: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            setResult({ error: error.message });
            alert('Error sending notification: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fill token from localStorage
    React.useEffect(() => {
        const savedToken = localStorage.getItem('fcm_token');
        if (savedToken) {
            setToken(savedToken);
        }
    }, []);

    return (
        <div style={{
            padding: '20px',
            maxWidth: '500px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h2>Test Firebase Notifications</h2>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                    FCM Token:
                </label>
                <textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        height: '80px'
                    }}
                    placeholder="Paste FCM token here"
                />
                <button
                    onClick={() => {
                        const savedToken = localStorage.getItem('fcm_token');
                        if (savedToken) setToken(savedToken);
                    }}
                    style={{
                        marginTop: '5px',
                        padding: '5px 10px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    }}
                >
                    Use Saved Token
                </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                    Title:
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #ccc'
                    }}
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                    Message:
                </label>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                        height: '60px'
                    }}
                />
            </div>

            <button
                onClick={sendTestNotification}
                disabled={loading}
                style={{
                    padding: '12px 24px',
                    background: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    width: '100%'
                }}
            >
                {loading ? 'Sending...' : 'Send Test Notification'}
            </button>

            {result && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '5px',
                    border: '1px solid #dee2e6'
                }}>
                    <h4>Result:</h4>
                    <pre style={{
                        background: '#e9ecef',
                        padding: '10px',
                        borderRadius: '3px',
                        overflow: 'auto',
                        fontSize: '12px'
                    }}>
            {JSON.stringify(result, null, 2)}
          </pre>
                </div>
            )}

            <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
                <h4>📋 Setup Instructions:</h4>
                <ol style={{ margin: '0', paddingLeft: '20px' }}>
                    <li><strong>Install backend dependencies:</strong>
                        <pre style={{ background: '#e9ecef', padding: '5px', margin: '5px 0' }}>
npm install express cors firebase-admin
            </pre>
                    </li>
                    <li><strong>Get serviceAccountKey.json:</strong>
                        <ul>
                            <li>Firebase Console → Project Settings → Service Accounts</li>
                            <li>Click "Generate new private key"</li>
                            <li>Save as <code>serviceAccountKey.json</code> in project root</li>
                        </ul>
                    </li>
                    <li><strong>Start backend server:</strong>
                        <pre style={{ background: '#e9ecef', padding: '5px', margin: '5px 0' }}>
node server.js
            </pre>
                    </li>
                    <li><strong>Test notifications!</strong></li>
                </ol>
            </div>
        </div>
    );
}