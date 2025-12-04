// src/utils/fallbackImages.js
export const getFallbackImage = (text = 'Image', width = 64, height = 40) => {
    // Create a data URL for a simple colored rectangle with text
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background color based on banner type or random
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
    return canvas.toDataURL();
};

// Pre-create common fallback images
export const fallbackImages = {
    small: getFallbackImage('Banner', 64, 40),
    large: getFallbackImage('Banner Image', 800, 400),
    preview: getFallbackImage('Preview', 800, 400),
};