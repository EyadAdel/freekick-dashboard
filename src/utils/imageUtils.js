import {IMAGE_BASE_URL} from "./ImageBaseURL.js";


export const isFullUrl = (str) => {
    if (!str) return false;
    return str.startsWith('http://') ||
        str.startsWith('https://') ||
        str.startsWith('data:') ||
        str.startsWith('blob:');
};

/**
 * Get image URL - if it's already a URL, return as-is, otherwise add base URL
 * @param {string} image - Image URL or filename
 * @returns {string|null} - Full image URL or null
 */
export const getImageUrl = (image) => {
    if (!image) return null;

    // If it's already a full URL, return as-is
    if (isFullUrl(image)) {
        return image;
    }

    // Otherwise, assume it's a filename and add base URL
    return `${IMAGE_BASE_URL}${image}`;
};

/**
 * Simple extract filename from URL
 * @param {string} url - URL to extract filename from
 * @returns {string} - Filename
 */
export const extractFilename = (url) => {
    if (!url) return '';

    // If it's not a URL, return as-is (already a filename)
    if (!isFullUrl(url)) {
        return url;
    }

    // Extract filename from URL
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        return path.split('/').pop() || url;
    } catch {
        // If URL parsing fails, try simple split
        return url.split('/').pop() || url;
    }
};