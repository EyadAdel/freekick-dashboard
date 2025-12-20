// src/utils/encryption.js
import CryptoJS from 'crypto-js';

/**
 * تشفير X-API-KEY بنفس طريقة Flutter
 * @returns {string} X-API-KEY المشفر
 */
export function encryptXAPIKEY() {
    const apiKey = import.meta.env.VITE_API_KEY || '';
    const password = import.meta.env.VITE_ENCRYPTION_PASSWORD || '';

    if (!apiKey || !password) {
        throw new Error("API_KEY or ENCRYPTION_PASSWORD is missing");
    }

    // إضافة timestamp بالثواني
    const timestamp = Math.floor(Date.now() / 1000);
    const plainText = `${apiKey}///${timestamp}`;

    // توليد salt عشوائي (8 بايتات)
    const salt = CryptoJS.lib.WordArray.random(8);

    // اشتقاق المفتاح والـ IV باستخدام EVP_BytesToKey
    const keyIv = evpBytesToKey(password, salt, 32, 16);

    // التشفير باستخدام AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(plainText, keyIv.key, {
        iv: keyIv.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });

    // تجميع النتيجة النهائية: "Salted__" + salt + ciphertext
    const saltedPrefix = CryptoJS.enc.Utf8.parse("Salted__");
    const combined = saltedPrefix
        .concat(salt)
        .concat(encrypted.ciphertext);

    // تحويل إلى Base64
    return CryptoJS.enc.Base64.stringify(combined);
}

/**
 * دالة مساعدة لاشتقاق المفتاح والـ IV (متوافقة مع OpenSSL EVP_BytesToKey)
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
 * دالة للحصول على X-API-KEY المشفر
 */
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

// ==================== NEW FUNCTIONS FOR REQUEST ENCRYPTION ====================

/**
 * Convert ArrayBuffer to base64 (URL-safe)
 */
export const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

/**
 * Convert string to ArrayBuffer
 */
export const stringToArrayBuffer = (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str);
};

/**
 * Convert ArrayBuffer to string
 */
export const arrayBufferToString = (buffer) => {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
};

/**
 * Generate HMAC-SHA256 signature
 */
const generateHMAC = async (data, key) => {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    return new Uint8Array(signature);
};

/**
 * Fernet encryption implementation
 */
export const encryptFernet = async (data, key) => {
    console.log('🔒 Starting Fernet encryption...');

    try {
        // Parse the base64 key
        const keyBytes = base64ToArrayBuffer(key);

        if (keyBytes.length !== 32) {
            throw new Error(`Invalid key length: ${keyBytes.length} bytes (expected 32)`);
        }

        // Split the key (first 16 bytes for signing, last 16 bytes for encryption)
        const signingKey = keyBytes.slice(0, 16);
        const encryptionKey = keyBytes.slice(16, 32);

        console.log('✓ Key parsed - Signing:', signingKey.length, 'bytes, Encryption:', encryptionKey.length, 'bytes');

        // Generate random IV (16 bytes for AES-128-CBC)
        const iv = crypto.getRandomValues(new Uint8Array(16));

        // Get current timestamp (seconds since epoch)
        const timestamp = Math.floor(Date.now() / 1000);

        // Convert timestamp to 8-byte big-endian
        const timestampBytes = new Uint8Array(8);
        let tempTimestamp = timestamp;
        for (let i = 7; i >= 0; i--) {
            timestampBytes[i] = tempTimestamp & 0xff;
            tempTimestamp >>>= 8;
        }

        // Prepare data for encryption
        let dataBytes;
        if (typeof data === 'string') {
            dataBytes = stringToArrayBuffer(data);
        } else if (typeof data === 'object') {
            dataBytes = stringToArrayBuffer(JSON.stringify(data));
        } else {
            dataBytes = stringToArrayBuffer(String(data));
        }

        console.log('✓ Data prepared, length:', dataBytes.length, 'bytes');

        // Add PKCS7 padding
        const blockSize = 16;
        const paddingLength = blockSize - (dataBytes.length % blockSize);
        const paddedData = new Uint8Array(dataBytes.length + paddingLength);
        paddedData.set(dataBytes);
        for (let i = dataBytes.length; i < paddedData.length; i++) {
            paddedData[i] = paddingLength;
        }

        console.log('✓ Padding added, new length:', paddedData.length, 'bytes');

        // Import encryption key
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            encryptionKey,
            { name: 'AES-CBC', length: 128 },
            false,
            ['encrypt']
        );

        // Encrypt the data
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-CBC', iv: iv },
            cryptoKey,
            paddedData
        );

        const ciphertext = new Uint8Array(encryptedBuffer);
        console.log('✓ Data encrypted, ciphertext length:', ciphertext.length, 'bytes');

        // Prepare data for HMAC signing
        // Fernet signs: Version || Timestamp || IV || Ciphertext
        const signedData = new Uint8Array(1 + 8 + 16 + ciphertext.length);
        signedData[0] = 0x80; // Version byte

        // Add timestamp
        signedData.set(timestampBytes, 1);

        // Add IV
        signedData.set(iv, 9);

        // Add ciphertext
        signedData.set(ciphertext, 25);

        // Generate HMAC
        const hmac = await generateHMAC(signedData, signingKey);
        console.log('✓ HMAC generated, length:', hmac.length, 'bytes');

        // Build final Fernet token
        const tokenBytes = new Uint8Array(signedData.length + hmac.length);
        tokenBytes.set(signedData);
        tokenBytes.set(hmac, signedData.length);

        console.log('✓ Token assembled, total length:', tokenBytes.length, 'bytes');

        // Convert to base64 URL-safe
        const base64Token = arrayBufferToBase64(tokenBytes);

        console.log('✅ Fernet encryption successful!');
        console.log('Token (first 100 chars):', base64Token.substring(0, 100) + '...');

        return base64Token;

    } catch (error) {
        console.error('❌ Fernet encryption failed:', error);
        throw error;
    }
};

/**
 * Main function to encrypt request data
 */
export const encryptRequestData = async (data) => {
    try {
        console.log('🔒 Encrypting request data...');

        const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'FQZZD8get7ltU3UeR3rnYs4lItqxvWHZ3yYlIIqTOuQ=';

        if (!ENCRYPTION_KEY) {
            throw new Error('VITE_ENCRYPTION_KEY environment variable is not set');
        }

        // Encrypt the data using Fernet
        const encryptedData = await encryptFernet(data, ENCRYPTION_KEY);

        console.log('✅ Request data encrypted successfully');

        // Return in the expected format (same as response format)
        return {
            encrypted_data: encryptedData,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Request encryption failed:', error);
        throw new Error(`Encryption failed: ${error.message}`);
    }
};

/**
 * Helper function to check if data should be encrypted
 */
export const shouldEncryptRequest = (config) => {
    // Don't encrypt GET requests
    if (config.method?.toUpperCase() === 'GET') {
        return false;
    }

    // Don't encrypt FormData
    if (config.data instanceof FormData) {
        return false;
    }

    // Don't encrypt if explicitly disabled
    if (config.headers && config.headers['X-No-Encrypt'] === 'true') {
        return false;
    }

    // Encrypt all other non-GET requests
    return true;
};

// Helper function from your api.js (included here for completeness)
export const base64ToArrayBuffer = (base64) => {
    // Convert URL-safe base64 to standard base64
    let standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
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
// // src/utils/encryption.js
// import CryptoJS from 'crypto-js';
//
// /**
//  * تشفير X-API-KEY بنفس طريقة Flutter
//  * @returns {string} X-API-KEY المشفر
//  */
// export function encryptXAPIKEY() {
//     const apiKey = import.meta.env.VITE_API_KEY || '';
//     const password = import.meta.env.VITE_ENCRYPTION_PASSWORD || '';
//
//     if (!apiKey || !password) {
//         throw new Error("API_KEY or ENCRYPTION_PASSWORD is missing");
//     }
//
//     // إضافة timestamp بالثواني
//     const timestamp = Math.floor(Date.now() / 1000);
//     const plainText = `${apiKey}///${timestamp}`;
//
//     // توليد salt عشوائي (8 بايتات)
//     const salt = CryptoJS.lib.WordArray.random(8);
//
//     // اشتقاق المفتاح والـ IV باستخدام EVP_BytesToKey
//     const keyIv = evpBytesToKey(password, salt, 32, 16);
//
//     // التشفير باستخدام AES-256-CBC
//     const encrypted = CryptoJS.AES.encrypt(plainText, keyIv.key, {
//         iv: keyIv.iv,
//         mode: CryptoJS.mode.CBC,
//         padding: CryptoJS.pad.Pkcs7,
//     });
//
//     // تجميع النتيجة النهائية: "Salted__" + salt + ciphertext
//     const saltedPrefix = CryptoJS.enc.Utf8.parse("Salted__");
//     const combined = saltedPrefix
//         .concat(salt)
//         .concat(encrypted.ciphertext);
//
//     // تحويل إلى Base64
//     return CryptoJS.enc.Base64.stringify(combined);
// }
//
// /**
//  * دالة مساعدة لاشتقاق المفتاح والـ IV (متوافقة مع OpenSSL EVP_BytesToKey)
//  */
// function evpBytesToKey(password, salt, keyLen, ivLen) {
//     const passwordBytes = CryptoJS.enc.Utf8.parse(password);
//     let dtot = CryptoJS.lib.WordArray.create();
//     let d = CryptoJS.lib.WordArray.create();
//
//     while (dtot.sigBytes < keyLen + ivLen) {
//         d = CryptoJS.MD5(d.concat(passwordBytes).concat(salt));
//         dtot = dtot.concat(d);
//     }
//
//     return {
//         key: CryptoJS.lib.WordArray.create(dtot.words.slice(0, keyLen / 4)),
//         iv: CryptoJS.lib.WordArray.create(
//             dtot.words.slice(keyLen / 4, (keyLen + ivLen) / 4)
//         ),
//     };
// }
//
// /**
//  * دالة للحصول على X-API-KEY المشفر
//  */
// export function getEncryptedApiKey() {
//     try {
//         const encrypted = encryptXAPIKEY();
//         console.log('✅ X-API-KEY encrypted successfully:', encrypted.substring(0, 50) + '...');
//         return encrypted;
//     } catch (error) {
//         console.error("❌ Error encrypting API key:", error);
//         return '';
//     }
// }