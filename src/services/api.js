// src/services/api.js
import axios from 'axios';
import {
    getEncryptedApiKey,
    encryptRequestData,
    shouldEncryptRequest,

    base64ToArrayBuffer,
    stringToArrayBuffer
} from '../utils/encryption.js';

// Use the imported functions directly, don't redeclare them
// Remove these duplicate declarations:
// const base64ToArrayBuffer = ...
// const stringToArrayBuffer = ...

// Fernet decryption implementation - FIXED VERSION
const decryptFernetLocal = async (encryptedData, key) => {
    let encryptedBytes;

    try {
        // First, decode the base64 URL-safe string
        encryptedBytes = base64ToArrayBuffer(encryptedData);
    } catch (e) {
        console.error('Failed to decode base64:', e);
        throw new Error('Invalid base64 encoding');
    }

    console.log('🔍 Fernet token structure analysis:');
    console.log('Total length:', encryptedBytes.length);
    console.log('Version byte:', `0x${encryptedBytes[0].toString(16)} (${encryptedBytes[0]})`);

    // Fernet version check - should be 0x80 (128 in decimal)
    const version = encryptedBytes[0];
    if (version !== 0x80) {
        console.warn(`Warning: Fernet version is 0x${version.toString(16)}, but continuing anyway`);
    }

    // Fernet structure:
    // Version (1) | Timestamp (8) | IV (16) | Ciphertext (variable) | HMAC (32)
    const timestamp = encryptedBytes.slice(1, 9);
    const iv = encryptedBytes.slice(9, 25);
    const hmacStart = encryptedBytes.length - 32;
    const ciphertext = encryptedBytes.slice(25, hmacStart);
    const hmac = encryptedBytes.slice(hmacStart);

    console.log('✓ Parsed structure:');
    console.log('  Timestamp bytes:', timestamp.length);
    console.log('  IV bytes:', iv.length);
    console.log('  Ciphertext bytes:', ciphertext.length);
    console.log('  HMAC bytes:', hmac.length);

    // Get the Fernet key
    const keyBytes = base64ToArrayBuffer(key);

    if (keyBytes.length !== 32) {
        console.error(`❌ Key should be 32 bytes, but got ${keyBytes.length} bytes`);
        throw new Error(`Invalid key length: ${keyBytes.length} bytes (expected 32)`);
    }

    console.log('✓ Key length:', keyBytes.length, 'bytes');

    // Fernet splits the 32-byte key
    const signingKey = keyBytes.slice(0, 16);
    const encryptionKey = keyBytes.slice(16, 32);

    console.log('✓ Derived keys - Signing:', signingKey.length, 'bytes, Encryption:', encryptionKey.length, 'bytes');

    try {
        // Import the encryption key for AES-128-CBC
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            encryptionKey,
            {
                name: 'AES-CBC',
                length: 128
            },
            false,
            ['decrypt']
        );

        console.log('✓ AES-CBC key imported successfully');

        // IMPORTANT: Check if ciphertext length is multiple of 16 (AES block size)
        if (ciphertext.length % 16 !== 0) {
            console.warn(`⚠️ Ciphertext length ${ciphertext.length} is not multiple of 16, may indicate parsing error`);
        }

        // Decrypt the ciphertext
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv: iv
            },
            cryptoKey,
            ciphertext
        );

        const decryptedBytes = new Uint8Array(decryptedBuffer);

        console.log('✓ Decrypted buffer length:', decryptedBytes.length);
        console.log('✓ Last 20 bytes of decrypted data (hex):',
            Array.from(decryptedBytes.slice(-20)).map(b => b.toString(16).padStart(2, '0')).join(' '));

        // Try to detect padding more carefully
        const lastByte = decryptedBytes[decryptedBytes.length - 1];
        console.log('✓ Last byte value:', lastByte, `(0x${lastByte.toString(16)})`);

        // Check if there's PKCS7 padding
        let unpaddedBytes;
        if (lastByte > 0 && lastByte <= 16) {
            // Verify PKCS7 padding
            let isValidPadding = true;
            for (let i = 0; i < lastByte; i++) {
                if (decryptedBytes[decryptedBytes.length - 1 - i] !== lastByte) {
                    isValidPadding = false;
                    break;
                }
            }

            if (isValidPadding) {
                console.log('✓ Valid PKCS7 padding detected, removing', lastByte, 'bytes');
                unpaddedBytes = decryptedBytes.slice(0, decryptedBytes.length - lastByte);
            } else {
                console.log('⚠️ Invalid PKCS7 padding bytes, keeping all bytes');
                unpaddedBytes = decryptedBytes;
            }
        } else {
            // No valid padding detected, keep all bytes
            console.log('⚠️ No valid PKCS7 padding detected, keeping all bytes');
            unpaddedBytes = decryptedBytes;
        }

        const decoder = new TextDecoder('utf-8');
        const result = decoder.decode(unpaddedBytes);

        console.log('✅ Fernet decryption successful!');
        console.log('Result length:', result.length);
        console.log('Result preview (first 200 chars):', result.substring(0, 200));

        // Check if result looks like JSON
        const trimmedResult = result.trim();
        if ((trimmedResult.startsWith('{') && trimmedResult.endsWith('}')) ||
            (trimmedResult.startsWith('[') && trimmedResult.endsWith(']'))) {
            console.log('✓ Result appears to be JSON');
        } else {
            console.log('✓ Result appears to be plain text');
        }

        return result;
    } catch (cryptoError) {
        console.error('❌ Crypto operation failed:', cryptoError);
        throw cryptoError;
    }
};

// Main decryption function - FIXED
const decryptDataLocal = async (encryptedData) => {
    const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'FQZZD8get7ltU3UeR3rnYs4lItqxvWHZ3yYlIIqTOuQ=';

    console.log('🔐 Starting decryption process...');
    console.log('Encrypted data:', encryptedData.substring(0, 100) + '...');

    // Handle encoding detection
    const { data: processedData, encoding } = handleDoubleEncoding(encryptedData);
    console.log(`✓ Using ${encoding} encoded data`);

    try {
        const decrypted = await decryptFernetLocal(processedData, ENCRYPTION_KEY);
        return decrypted;
    } catch (error) {
        console.error('❌ Fernet decryption failed:', error.message);

        // Additional debugging
        console.log('🔧 Debug info:');
        console.log('- Key length:', ENCRYPTION_KEY.length);
        console.log('- Processed data length:', processedData.length);
        console.log('- Encoding type:', encoding);

        throw new Error(`Decryption failed: ${error.message}`);
    }
};

// Check if response contains encrypted data
const isEncryptedResponse = (data) => {
    return data && typeof data === 'object' && 'encrypted_data' in data;
};

const handleDoubleEncoding = (encryptedData) => {
    console.log('🔍 Analyzing encoding...');
    console.log('Original data length:', encryptedData.length);

    // Try different decoding approaches
    try {
        // Approach 1: Direct base64 decode
        const decoded1 = base64ToArrayBuffer(encryptedData);
        console.log('✓ Direct base64 decode length:', decoded1.length);

        // Check if it looks like a Fernet token (starts with version 0x80)
        if (decoded1[0] === 0x80) {
            console.log('✓ Direct decode gives valid Fernet token');
            return { data: encryptedData, encoding: 'single' };
        }
    } catch (e) {
        console.log('✗ Direct decode failed');
    }

    try {
        // Approach 2: Try decoding once
        const decodedOnce = atob(encryptedData.replace(/-/g, '+').replace(/_/g, '/'));
        console.log('✓ Single decode length:', decodedOnce.length);

        // Convert to ArrayBuffer to check first byte
        const decodedOnceBuffer = stringToArrayBuffer(decodedOnce);
        if (decodedOnceBuffer[0] === 0x80) {
            console.log('✓ Single decode gives valid Fernet token');
            return { data: decodedOnce, encoding: 'double' };
        }

        // Check if string starts with 'gAAAAA' (base64 for version 0x80)
        if (decodedOnce.startsWith('gAAAAA')) {
            console.log('✓ String starts with gAAAAA, appears to be base64 Fernet');
            return { data: decodedOnce, encoding: 'double' };
        }
    } catch (e) {
        console.log('✗ Single decode failed');
    }

    // Default: return original
    console.log('⚠️ Could not determine encoding, using original');
    return { data: encryptedData, encoding: 'unknown' };
};

// Decrypt response data
const decryptResponseData = async (data) => {
    if (isEncryptedResponse(data)) {
        try {
            console.log('🔐 Encrypted response detected, attempting decryption...');
            console.log('Encrypted data field exists, length:', data.encrypted_data?.length || 0);

            const decryptedString = await decryptDataLocal(data.encrypted_data);
            console.log('✅ Decryption successful, decrypted length:', decryptedString.length);

            // Try to parse as JSON, otherwise return as string
            try {
                const parsed = JSON.parse(decryptedString);
                console.log('✓ Successfully parsed as JSON');
                return parsed;
            } catch (parseError) {
                console.log('⚠️ Could not parse as JSON, returning as string');
                return decryptedString;
            }
        } catch (error) {
            console.error('❌ Failed to decrypt response:', error.message);
            console.error('Error details:', error);

            // Return the original encrypted data for debugging
            return {
                decryption_error: error.message,
                original_data: data.encrypted_data?.substring(0, 100) + '...'
            };
        }
    }
    return data;
};

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.freekickapp.com',
    timeout: 30000,
});

// Enhanced request interceptor with better debugging
api.interceptors.request.use(
    async (config) => {
        console.log('🚀 Request interceptor started...');

        // Add encrypted API key header
        try {
            const encryptedKey = getEncryptedApiKey();
            if (encryptedKey) {
                config.headers['X-API-KEY'] = encryptedKey;
                console.log('✅ API key encrypted and added to headers');
            }
        } catch (error) {
            console.error('Failed to encrypt API key:', error);
        }

        // Add API version header
        config.headers['x-api-version'] = 'v3';

        // Add authorization token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('✅ Auth token added');
        }

        // ENCRYPT REQUEST DATA IF NEEDED
        console.log('🔍 Checking if request should be encrypted...');
        console.log('Method:', config.method);
        console.log('Data type:', typeof config.data);
        console.log('Is FormData?', config.data instanceof FormData);

        if (config.data && shouldEncryptRequest(config)) {
            console.log('🔒 ENCRYPTION ENABLED - Encrypting request data...');
            console.log('Original data:', JSON.stringify(config.data).substring(0, 200) + '...');

            try {
                // Test encryption first
                const testEncryption = await encryptRequestData({ test: "encryption_test" });
                console.log('✅ Test encryption successful:', testEncryption.encrypted_data.substring(0, 50) + '...');

                // Encrypt the actual request data
                const encryptedPayload = await encryptRequestData(config.data);
                console.log('✅ Actual data encrypted successfully');
                console.log('Encrypted payload:', JSON.stringify(encryptedPayload).substring(0, 200) + '...');

                config.data = encryptedPayload;

                // Add header to indicate encrypted content
                config.headers['X-Encrypted'] = 'true';
                config.headers['Content-Type'] = 'application/json';

                console.log('✅ Headers updated with X-Encrypted flag');

            } catch (encryptionError) {
                console.error('❌ Request encryption failed:', encryptionError);
                console.error('Encryption error details:', encryptionError.message);
                console.error('Encryption stack:', encryptionError.stack);

                // Add error header but continue with unencrypted data
                config.headers['X-Encryption-Error'] = 'true';
                console.warn('⚠️ Sending unencrypted data due to encryption failure');
            }
        } else {
            console.log('⚠️ ENCRYPTION DISABLED - Skipping encryption');
            console.log('Reason:');
            if (config.method?.toUpperCase() === 'GET') console.log('  - GET request');
            if (config.data instanceof FormData) console.log('  - FormData detected');
            if (config.headers && config.headers['X-No-Encrypt'] === 'true') console.log('  - X-No-Encrypt header set');
        }

        // Handle Content-Type dynamically (after potential encryption)
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
            console.log('📁 FormData detected, removing Content-Type header');
        } else if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
            console.log('📄 Setting Content-Type to application/json');
        }

        console.log('📤 FINAL API Request Configuration:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: {
                hasAuth: !!token,
                hasApiKey: !!config.headers['X-API-KEY'],
                encrypted: !!config.headers['X-Encrypted'],
                contentType: config.headers['Content-Type']
            },
            dataPreview: config.data ? JSON.stringify(config.data).substring(0, 200) + '...' : 'No data'
        });

        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor remains the same
api.interceptors.response.use(
    async (response) => {
        console.log('📥 API Response:', {
            url: response.config.url,
            status: response.status,
            statusText: response.statusText
        });

        // Check if response contains encrypted data
        if (response.data && isEncryptedResponse(response.data)) {
            console.log('🔐 Encrypted response detected, decrypting...');

            try {
                response.data = await decryptResponseData(response.data);
                console.log('✅ Response decrypted successfully');
            } catch (error) {
                console.error('❌ Decryption error in interceptor:', error);

                // Don't reject, just return the original data with error flag
                response.data = {
                    _decryptionError: true,
                    error: error.message,
                    originalData: response.data
                };
            }
        } else {
            console.log('📄 Plain response (no encryption)');
        }

        return response;
    },
    (error) => {
        console.error('❌ API Response Error:', {
            url: error.config?.url,
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message
        });

        if (error.response) {
            const { status, data } = error.response;

            // Check if error response is encrypted
            if (data && isEncryptedResponse(data)) {
                console.log('🔐 Encrypted error response detected, attempting to decrypt...');

                // Try to decrypt the error response
                return decryptResponseData(data)
                    .then(decryptedError => {
                        console.error('Decrypted error:', decryptedError);

                        // Create a new error with decrypted message
                        const decryptedErrorObj = new Error(
                            decryptedError.message || decryptedError.error || 'Unknown error'
                        );
                        decryptedErrorObj.response = {
                            ...error.response,
                            data: decryptedError
                        };
                        decryptedErrorObj.status = status;

                        return Promise.reject(decryptedErrorObj);
                    })
                    .catch(decryptError => {
                        console.error('Failed to decrypt error response:', decryptError);
                        return Promise.reject(error);
                    });
            }

            switch (status) {
                case 401:
                    console.error('🔐 Unauthorized - clearing tokens');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    break;
                case 403:
                    console.error('🚫 Forbidden - insufficient permissions');
                    break;
                case 404:
                    console.error('🔍 Not Found');
                    break;
                case 500:
                    console.error('💥 Server Error');
                    break;
                case 502:
                    console.error('🌐 Bad Gateway');
                    break;
                case 503:
                    console.error('⏸️ Service Unavailable');
                    break;
                default:
                    console.error(`❌ Error ${status}`);
            }
        } else if (error.request) {
            console.error('📡 No response from server - possible network issue');
        } else {
            console.error('⚙️ Request setup error:', error.message);
        }

        return Promise.reject(error);
    }
);

// Helper functions
export const encryptedApiCall = async (method, url, data = null, config = {}) => {
    try {
        // Ensure encryption headers are set
        const finalConfig = {
            ...config,
            method,
            url,
            headers: {
                ...config.headers,
                'X-Require-Encryption': 'true'
            }
        };

        // Add data for non-GET requests
        if (method.toUpperCase() !== 'GET' && data !== null) {
            finalConfig.data = data;
        }

        return await api(finalConfig);
    } catch (error) {
        console.error(`❌ Encrypted API call failed for ${method} ${url}:`, error);
        throw error;
    }
};

export const postEncrypted = (url, data, config) =>
    encryptedApiCall('POST', url, data, config);

export const putEncrypted = (url, data, config) =>
    encryptedApiCall('PUT', url, data, config);

export const patchEncrypted = (url, data, config) =>
    encryptedApiCall('PATCH', url, data, config);

/**
 * Enhanced test function
 */
export const testEncryption = async (testData = { test: "Hello, World!", number: 42, timestamp: Date.now() }) => {
    console.log('🧪 STARTING ENCRYPTION TEST...');

    try {
        const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

        console.log('1. Checking environment...');
        console.log('VITE_ENCRYPTION_KEY exists?', !!ENCRYPTION_KEY);
        console.log('Key length:', ENCRYPTION_KEY?.length || 'Not found');

        if (!ENCRYPTION_KEY) {
            throw new Error('VITE_ENCRYPTION_KEY is not set in environment variables');
        }

        console.log('2. Testing encryption...');
        const encrypted = await encryptRequestData(testData);
        console.log('✅ Encryption test passed');
        console.log('Encrypted data type:', typeof encrypted);
        console.log('Has encrypted_data field?', 'encrypted_data' in encrypted);
        console.log('Encrypted data (first 100 chars):', encrypted.encrypted_data.substring(0, 100) + '...');

        console.log('3. Testing decryption...');
        const decrypted = await decryptDataLocal(encrypted.encrypted_data);
        console.log('✅ Decryption test passed');
        console.log('Decrypted data:', decrypted.substring(0, 200) + '...');

        console.log('4. Verifying data integrity...');
        const parsed = JSON.parse(decrypted);
        console.log('Parsed data matches original?', JSON.stringify(parsed) === JSON.stringify(testData));

        return {
            success: true,
            original: testData,
            encrypted,
            decrypted: parsed
        };
    } catch (error) {
        console.error('❌ Encryption test failed:', error);
        console.error('Error stack:', error.stack);
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
};

// Export utility functions
export {
    decryptDataLocal as decryptData,
    decryptResponseData,
    isEncryptedResponse,
    decryptFernetLocal as decryptFernet
};

export default api;
// // src/services/api.js
// import axios from 'axios';
// import { getEncryptedApiKey } from '../utils/encryption';
//
// // Create axios instance with default config
// const api = axios.create({
//     baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.freekickapp.com',
//     timeout: 30000,
// });
//
// // Request interceptor
// api.interceptors.request.use(
//     (config) => {
//         // Add encrypted API key header
//         try {
//             const encryptedKey = getEncryptedApiKey();
//             if (encryptedKey) {
//                 config.headers['X-API-KEY'] = encryptedKey;
//             }
//         } catch (error) {
//             console.error('Failed to encrypt API key:', error);
//         }
//
//         // Add API version header
//         config.headers['x-api-version'] = 'v3';
//
//         // Add authorization token if available
//         const token = localStorage.getItem('authToken');
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//
//         // Handle Content-Type dynamically
//         if (config.data instanceof FormData) {
//             // Let the browser set Content-Type for FormData (with boundary)
//             delete config.headers['Content-Type'];
//         } else if (!config.headers['Content-Type']) {
//             // Default to JSON for other requests
//             config.headers['Content-Type'] = 'application/json';
//         }
//
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );
//
// // Response interceptor
// api.interceptors.response.use(
//     (response) => {
//         return response;
//     },
//     (error) => {
//         console.error('❌ API Response Error:', {
//             url: error.config?.url,
//             status: error.response?.status,
//             data: error.response?.data,
//             message: error.message
//         });
//
//         if (error.response) {
//             const { status } = error.response;
//             switch (status) {
//                 case 401:
//                     console.error('🔐 Unauthorized - clearing tokens');
//                     localStorage.removeItem('authToken');
//                     localStorage.removeItem('refreshToken');
//                     break;
//                 case 403:
//                     console.error('🚫 Forbidden - insufficient permissions');
//                     break;
//                 case 404:
//                     console.error('🔍 Not Found');
//                     break;
//                 case 500:
//                     console.error('💥 Server Error');
//                     break;
//                 default:
//                     console.error(`❌ Error ${status}`);
//             }
//         } else if (error.request) {
//             console.error('📡 No response from server');
//         } else {
//             console.error('⚙️ Request setup error');
//         }
//
//         return Promise.reject(error);
//     }
// );
//
// export default api;