// src/utils/encryption.js
import CryptoJS from 'crypto-js';

/**
 * Convert ArrayBuffer to base64
 */
export const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

/**
 * Convert string to ArrayBuffer
 */
export const stringToArrayBuffer = (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str);
};

/**
 * Helper: Convert base64 to ArrayBuffer
 */
export const base64ToArrayBuffer = (base64) => {
    let standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (standardBase64.length % 4) {
        standardBase64 += '=';
    }
    const binaryString = atob(standardBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

/**
 * EVP_BytesToKey implementation (matches Python backend)
 * This derives a key and IV from a password and salt using MD5
 */
function evpBytesToKey(password, salt, keyLen, ivLen) {
    const passwordBytes = CryptoJS.enc.Utf8.parse(password);
    let dtot = CryptoJS.lib.WordArray.create();
    let d = CryptoJS.lib.WordArray.create();

    while (dtot.sigBytes < keyLen + ivLen) {
        d = CryptoJS.MD5(d.concat(passwordBytes).concat(salt));
        dtot = dtot.concat(d);
    }

    return {
        key: CryptoJS.lib.WordArray.create(dtot.words.slice(0, keyLen / 4)),
        iv: CryptoJS.lib.WordArray.create(
            dtot.words.slice(keyLen / 4, (keyLen + ivLen) / 4)
        ),
    };
}

/**
 * ✅ FIXED: Encrypt data using OpenSSL-compatible AES-CBC
 * This matches your Python backend's encrypt_text function
 */
export const encryptData = (data, password) => {
    console.log('🔒 Starting OpenSSL-compatible AES-CBC encryption...');

    try {
        // Convert data to JSON string
        const jsonString = typeof data === 'object' ? JSON.stringify(data) : String(data);
        console.log('✓ Data prepared:', jsonString.substring(0, 100) + '...');

        // Generate random salt (8 bytes, like OpenSSL)
        const salt = CryptoJS.lib.WordArray.random(8);
        console.log('✓ Salt generated:', salt.toString());

        // Derive key and IV from password and salt (32 bytes key, 16 bytes IV)
        const keyIv = evpBytesToKey(password, salt, 32, 16);
        console.log('✓ Key and IV derived');

        // Encrypt using AES-256-CBC with PKCS7 padding
        const encrypted = CryptoJS.AES.encrypt(jsonString, keyIv.key, {
            iv: keyIv.iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        // Add "Salted__" prefix and salt (OpenSSL format)
        const saltedPrefix = CryptoJS.enc.Utf8.parse("Salted__");
        const combined = saltedPrefix.concat(salt).concat(encrypted.ciphertext);

        // Convert to Base64
        const base64Result = CryptoJS.enc.Base64.stringify(combined);

        console.log('✅ Encryption successful!');
        console.log('Result length:', base64Result.length);
        console.log('Result preview:', base64Result.substring(0, 50) + '...');

        return base64Result;

    } catch (error) {
        console.error('❌ Encryption failed:', error);
        throw error;
    }
};

/**
 * ✅ FIXED: Decrypt data using OpenSSL-compatible AES-CBC
 * This matches your Python backend's decrypt_text function
 */
export const decryptData = (encryptedBase64, password) => {
    console.log('🔓 Starting OpenSSL-compatible AES-CBC decryption...');

    try {
        // Decode Base64
        const encryptedBytes = CryptoJS.enc.Base64.parse(encryptedBase64);

        // Extract salt (skip "Salted__" prefix which is 8 bytes)
        const saltedPrefix = CryptoJS.lib.WordArray.create(encryptedBytes.words.slice(0, 2));
        const salt = CryptoJS.lib.WordArray.create(encryptedBytes.words.slice(2, 4));
        const ciphertext = CryptoJS.lib.WordArray.create(encryptedBytes.words.slice(4));

        console.log('✓ Extracted salt and ciphertext');

        // Derive key and IV from password and salt
        const keyIv = evpBytesToKey(password, salt, 32, 16);
        console.log('✓ Key and IV derived');

        // Decrypt
        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: ciphertext },
            keyIv.key,
            {
                iv: keyIv.iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            }
        );

        const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

        if (!decryptedString) {
            throw new Error('Decryption failed - empty result');
        }

        console.log('✅ Decryption successful!');
        console.log('Result preview:', decryptedString.substring(0, 100) + '...');

        return decryptedString;

    } catch (error) {
        console.error('❌ Decryption failed:', error);
        throw error;
    }
};

/**
 * ✅ FIXED: Encrypt request data for backend
 * Uses the ENCRYPTION_KEY from environment
 */
export const encryptRequestData = async (data) => {
    try {
        console.log('🔒 Encrypting request data...');
        console.log('📊 FULL DATA TO ENCRYPT:', JSON.stringify(data, null, 2));

        const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'FQZZD8get7ltU3UeR3rnYs4lItqxvWHZ3yYlIIqTOuQ=';

        if (!ENCRYPTION_KEY) {
            throw new Error('VITE_ENCRYPTION_KEY environment variable is not set');
        }

        console.log('🔑 Using encryption key (first 10 chars):', ENCRYPTION_KEY.substring(0, 10) + '...');
        console.log('🔑 Key length:', ENCRYPTION_KEY.length, 'characters');

        // Encrypt using OpenSSL-compatible method
        const encryptedData = encryptData(data, ENCRYPTION_KEY);

        console.log('✅ Request encryption successful');
        console.log('Token preview:', encryptedData.substring(0, 50) + '...');
        console.log('Token length:', encryptedData.length);
        console.log('Starts with U2FsdGVkX1?', encryptedData.startsWith('U2FsdGVkX1'));

        // VERIFY: Try to decrypt what we just encrypted to make sure it's correct
        try {
            const verification = decryptData(encryptedData, ENCRYPTION_KEY);
            console.log('✅ VERIFICATION: Can decrypt back to:', verification);
            const verifyParsed = JSON.parse(verification);
            console.log('✅ VERIFICATION: Parsed JSON:', JSON.stringify(verifyParsed, null, 2));
            console.log('✅ VERIFICATION: Data integrity check PASSED');
        } catch (verifyError) {
            console.error('❌ VERIFICATION FAILED:', verifyError);
            throw new Error('Local encryption verification failed - cannot send to backend');
        }

        // Return in the format backend expects
        const payload = {
            encrypted_data: encryptedData
        };

        console.log('📦 Final payload structure:', Object.keys(payload));
        console.log('📦 encrypted_data field exists?', 'encrypted_data' in payload);

        return payload;

    } catch (error) {
        console.error('❌ Request encryption failed:', error);
        throw error;
    }
};

/**
 * ✅ FIXED: Decrypt response data from backend
 */
export const decryptResponseData = async (encryptedData) => {
    try {
        console.log('🔓 Decrypting response data...');

        const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'FQZZD8get7ltU3UeR3rnYs4lItqxvWHZ3yYlIIqTOuQ=';

        if (!ENCRYPTION_KEY) {
            throw new Error('VITE_ENCRYPTION_KEY environment variable is not set');
        }

        // Decrypt using OpenSSL-compatible method
        const decryptedString = decryptData(encryptedData, ENCRYPTION_KEY);

        console.log('✅ Response decryption successful');

        // Try to parse as JSON
        try {
            return JSON.parse(decryptedString);
        } catch (parseError) {
            console.log('⚠️ Could not parse as JSON, returning as string');
            return decryptedString;
        }

    } catch (error) {
        console.error('❌ Response decryption failed:', error);
        throw error;
    }
};

/**
 * Check if request should be encrypted
 * ✅ ENCRYPT ALL REQUESTS with data (POST, PATCH, PUT, DELETE, etc.)
 */
/**
 * Check if request should be encrypted
 * ✅ ENCRYPT ALL REQUESTS with data (POST, PATCH, PUT, DELETE, etc.)
 */
const formDataToObject = (formData) => {
    const obj = {};
    for (let [key, value] of formData.entries()) {
        // Handle multiple values for same key
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
    return obj;
};

/**
 * Check if FormData contains files
 */
const formDataHasFiles = (formData) => {
    for (let [key, value] of formData.entries()) {
        if (value instanceof File || value instanceof Blob) {
            return true;
        }
    }
    return false;
};

/**
 * Updated: Check if request should be encrypted
 */
export const shouldEncryptRequest = (config) => {
    // Don't encrypt GET requests
    if (config.method?.toUpperCase() === 'GET') {
        console.log('⚠️ Skipping encryption: GET request');
        return false;
    }

    // Handle FormData specially
    if (config.data instanceof FormData) {
        // Only skip if FormData contains actual files
        if (formDataHasFiles(config.data)) {
            console.log('⚠️ Skipping encryption: FormData with files detected');
            return false;
        } else {
            console.log('✅ Will encrypt FormData (no files)');
            return true;
        }
    }

    // Explicit opt-out
    if (config.headers?.['X-No-Encrypt'] === 'true') {
        console.log('⚠️ Skipping encryption: X-No-Encrypt header set');
        return false;
    }

    console.log('✅ Will encrypt this request:', config.method?.toUpperCase());
    return true;
};/**
 * Encrypt X-API-KEY header (separate encryption for API key)
 */
export function encryptXAPIKEY() {
    const apiKey = import.meta.env.VITE_API_KEY || '';
    const password = import.meta.env.VITE_ENCRYPTION_PASSWORD || '';

    if (!apiKey || !password) {
        throw new Error("API_KEY or ENCRYPTION_PASSWORD is missing");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const plainText = `${apiKey}///${timestamp}`;
    const salt = CryptoJS.lib.WordArray.random(8);
    const keyIv = evpBytesToKey(password, salt, 32, 16);

    const encrypted = CryptoJS.AES.encrypt(plainText, keyIv.key, {
        iv: keyIv.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });

    const saltedPrefix = CryptoJS.enc.Utf8.parse("Salted__");
    const combined = saltedPrefix.concat(salt).concat(encrypted.ciphertext);

    return CryptoJS.enc.Base64.stringify(combined);
}

export function getEncryptedApiKey() {
    try {
        const encrypted = encryptXAPIKEY();
        console.log('✅ X-API-KEY encrypted successfully:', encrypted.substring(0, 50) + '...');
        return encrypted;
    } catch (error) {
        console.error("❌ Error encrypting API key:", error);
        return '';
    }
}

/**
 * Test function to verify encryption/decryption
 */
export const testEncryption = async () => {
    console.log('🧪 STARTING ENCRYPTION TEST...');

    try {
        const testData = {
            test: "Hello, World!",
            number: 42,
            timestamp: Date.now()
        };

        console.log('1. Original data:', testData);

        const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
        if (!ENCRYPTION_KEY) {
            throw new Error('VITE_ENCRYPTION_KEY is not set');
        }

        console.log('2. Encrypting...');
        const encrypted = encryptData(testData, ENCRYPTION_KEY);
        console.log('✅ Encrypted:', encrypted.substring(0, 100) + '...');

        console.log('3. Decrypting...');
        const decrypted = decryptData(encrypted, ENCRYPTION_KEY);
        const parsed = JSON.parse(decrypted);
        console.log('✅ Decrypted:', parsed);

        console.log('4. Verifying...');
        const matches = JSON.stringify(parsed) === JSON.stringify(testData);
        console.log('✅ Data matches:', matches);

        return {
            success: true,
            original: testData,
            encrypted,
            decrypted: parsed,
            matches
        };
    } catch (error) {
        console.error('❌ Encryption test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
/**
 * Encrypt query parameters for GET requests
 */
export const encryptQueryParams = (params, password) => {
    try {
        const encrypted = encryptData(params, password);
        // URL-safe base64
        return encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } catch (error) {
        console.error('❌ Query param encryption failed:', error);
        throw error;
    }
};