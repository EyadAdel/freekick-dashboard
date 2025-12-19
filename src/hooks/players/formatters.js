export const formatDate = (dateTime, options = {}) => {
    if (!dateTime) return 'N/A';

    const defaultOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'  // Add this line

    };

    return new Date(dateTime).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

export const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';

    return new Date(dateTime).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'  // Add this line

    });
};

export const formatAmount = (amount, currency = 'AED') => {
    if (amount === undefined || amount === null) return `${currency} 0`;

    const num = parseFloat(amount);
    if (isNaN(num)) return `${currency} 0`;

    return `${num >= 0 ? '' : '-'}${currency} ${Math.abs(num).toLocaleString()}`;
};

export const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

export const getAmountColor = (amount) => {
    if (amount === undefined || amount === null) return 'text-gray-600';

    const num = parseFloat(amount);
    return num >= 0 ? 'text-green-600' : 'text-red-600';
};