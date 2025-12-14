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