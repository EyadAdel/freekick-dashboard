// src/services/api.js
import axios from 'axios';
import {
    getEncryptedApiKey,
    encryptRequestData,
    shouldEncryptRequest,
    decryptResponseData
} from '../utils/encryption.js';

// Check if response contains encrypted data
const isEncryptedResponse = (data) => {
    return data && typeof data === 'object' && 'encrypted_data' in data;
};

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.freekickapp.com',
    timeout: 30000,
});

// Request interceptor
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

        // 🔥 NEW: CONVERT FORMDATA TO OBJECT FIRST (before encryption check)
        if (config.data instanceof FormData) {
            console.log('📋 FormData detected, checking for files...');

            // Check if FormData has files
            let hasFiles = false;
            for (let [key, value] of config.data.entries()) {
                if (value instanceof File || value instanceof Blob) {
                    hasFiles = true;
                    console.log(`  - File found: ${key} (${value.name || 'blob'})`);
                }
            }

            if (!hasFiles) {
                // Convert FormData to plain object for encryption
                console.log('✅ No files found, converting FormData to object...');
                const obj = {};
                for (let [key, value] of config.data.entries()) {
                    if (obj[key]) {
                        if (Array.isArray(obj[key])) {
                            obj[key].push(value);
                        } else {
                            obj[key] = [obj[key], value];
                        }
                    } else {
                        obj[key] = value;
                    }
                }
                config.data = obj;
                console.log('✅ FormData converted to:', JSON.stringify(obj).substring(0, 200) + '...');
            } else {
                console.log('⚠️ Files detected, will skip encryption for this FormData');
            }
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
                // Encrypt the request data
                const encryptedPayload = await encryptRequestData(config.data);
                console.log('✅ Data encrypted successfully');
                console.log('Encrypted payload:', JSON.stringify(encryptedPayload).substring(0, 200) + '...');

                config.data = encryptedPayload;

                // Add header to indicate encrypted content
                config.headers['X-Encrypted'] = 'true';
                config.headers['Content-Type'] = 'application/json';

                console.log('✅ Headers updated with X-Encrypted flag');

            } catch (encryptionError) {
                console.error('❌ Request encryption failed:', encryptionError);
                console.error('Encryption error details:', encryptionError.message);

                // Add error header but continue with unencrypted data
                config.headers['X-Encryption-Error'] = 'true';
                console.warn('⚠️ Sending unencrypted data due to encryption failure');
            }
        } else {
            console.log('⚠️ ENCRYPTION DISABLED - Skipping encryption');
            console.log('Reason:');
            if (config.method?.toUpperCase() === 'GET') console.log('  - GET request');
            if (config.data instanceof FormData) console.log('  - FormData with files detected');
            if (config.headers && config.headers['X-No-Encrypt'] === 'true') console.log('  - X-No-Encrypt header set');
        }

        // Handle Content-Type dynamically (after potential encryption)
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
            console.log('📁 FormData with files, removing Content-Type header');
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
// Response interceptor
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
                const decryptedData = await decryptResponseData(response.data.encrypted_data);
                response.data = decryptedData;
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
    async (error) => {
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

                try {
                    const decryptedError = await decryptResponseData(data.encrypted_data);
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
                } catch (decryptError) {
                    console.error('Failed to decrypt error response:', decryptError);
                    return Promise.reject(error);
                }
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
        const finalConfig = {
            ...config,
            method,
            url,
            headers: {
                ...config.headers,
                'X-Require-Encryption': 'true'
            }
        };

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