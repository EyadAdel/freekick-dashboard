import { useState } from 'react';

// ⚠️ For testing only - copy your encryption functions here
function encryptXAPIKEY() {
    // Simulated values for testing
    const apiKey = 'r9NgGxF7.480nAsff66gUBN4SSDe7WOOaaQuWW84A';
    const password = 'M9fT02XbZ6rLp74v20KdV1WhC3eYj0Gs';

    const timestamp = Math.floor(Date.now() / 1000);
    const plainText = `${apiKey}///${timestamp}`;

    return `SIMULATED_ENCRYPTED_KEY_${plainText.length}_chars`;
}

export default function EncryptionTest() {
    const [encryptedKey, setEncryptedKey] = useState('');
    const [plainTextPreview, setPlainTextPreview] = useState('');
    const [testResult, setTestResult] = useState(null);

    const testEncryption = () => {
        try {
            const apiKey = 'r9NgGxF7.480nAsff66gUBN4SSDe7WOOaaQuWW84A';
            const timestamp = Math.floor(Date.now() / 1000);
            const plain = `${apiKey}///${timestamp}`;

            setPlainTextPreview(plain);

            const encrypted = encryptXAPIKEY();
            setEncryptedKey(encrypted);

            // Validation checks
            const checks = {
                hasValue: encrypted.length > 0,
                isBase64: /^[A-Za-z0-9+/=]+$/.test(encrypted),
                hasMinLength: encrypted.length > 50,
                containsTimestamp: plain.includes('///')
            };

            setTestResult(checks);
        } catch (error) {
            console.error('Test failed:', error);
            setTestResult({ error: error.message });
        }
    };

    const makeTestRequest = async () => {
        try {
            // Simulated API call
            console.log('Making test request with encrypted key...');
            alert('Check browser console for network tab details');
        } catch (error) {
            console.error('Request failed:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <span className="text-4xl">🔐</span>
                        API Encryption Test
                    </h1>

                    <div className="space-y-6">
                        {/* Test Button */}
                        <div className="flex gap-4">
                            <button
                                onClick={testEncryption}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                🧪 Test Encryption
                            </button>

                            <button
                                onClick={makeTestRequest}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                📡 Make Test API Call
                            </button>
                        </div>

                        {/* Plain Text Preview */}
                        {plainTextPreview && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-2">📝 Plain Text (Before Encryption):</h3>
                                <code className="text-sm text-gray-600 break-all bg-white p-3 rounded block">
                                    {plainTextPreview}
                                </code>
                            </div>
                        )}

                        {/* Encrypted Result */}
                        {encryptedKey && (
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <h3 className="font-semibold text-green-700 mb-2">🔒 Encrypted X-API-KEY:</h3>
                                <code className="text-sm text-green-600 break-all bg-white p-3 rounded block">
                                    {encryptedKey}
                                </code>
                                <p className="text-sm text-gray-500 mt-2">Length: {encryptedKey.length} characters</p>
                            </div>
                        )}

                        {/* Validation Results */}
                        {testResult && !testResult.error && (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h3 className="font-semibold text-blue-700 mb-3">✅ Validation Checks:</h3>
                                <div className="space-y-2">
                                    {Object.entries(testResult).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2">
                                            <span className="text-2xl">{value ? '✅' : '❌'}</span>
                                            <span className="text-gray-700">
                        {key === 'hasValue' && 'Has encrypted value'}
                                                {key === 'isBase64' && 'Valid Base64 format'}
                                                {key === 'hasMinLength' && 'Sufficient length (>50 chars)'}
                                                {key === 'containsTimestamp' && 'Contains timestamp marker'}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {testResult?.error && (
                            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                <h3 className="font-semibold text-red-700 mb-2">❌ Error:</h3>
                                <code className="text-sm text-red-600">{testResult.error}</code>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mt-6">
                            <h3 className="font-semibold text-yellow-800 mb-2">📋 How to Verify in Network Tab:</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                <li>Open Chrome DevTools (F12)</li>
                                <li>Go to <strong>Network</strong> tab</li>
                                <li>Click "Make Test API Call" button</li>
                                <li>Click on the request in the Network tab</li>
                                <li>Look for <strong>X-API-KEY</strong> header in Request Headers</li>
                                <li>Verify <strong>x-api-version: v2</strong> is also present</li>
                            </ol>
                        </div>

                        {/* Expected Headers */}
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <h3 className="font-semibold text-purple-700 mb-2">📋 Expected Headers:</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex gap-2">
                                    <span className="font-mono text-purple-600">X-API-KEY:</span>
                                    <span className="text-gray-600">U2FsdGVkX1+... (Base64 encrypted)</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-mono text-purple-600">x-api-version:</span>
                                    <span className="text-gray-600">v2</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-mono text-purple-600">Content-Type:</span>
                                    <span className="text-gray-600">application/json</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}