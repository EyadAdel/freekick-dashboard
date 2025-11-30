// src/utils/fileUtils.js

/**
 * Generates a unique filename by prepending a timestamp
 * and replacing spaces with underscores.
 *
 * @param {string} originalFileName - The original name of the file
 * @returns {string} - e.g., "1732992000_my_image.png"
 */
export const generateUniqueFileName = (originalFileName) => {
    if (!originalFileName || typeof originalFileName !== 'string') {
        return `file_${Date.now()}`;
    }

    const timestamp = Date.now();

    // Remove spaces and other potentially problematic characters
    const cleanName = originalFileName
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove special characters except dots, dashes, underscores

    return `${timestamp}_${cleanName}`;
};