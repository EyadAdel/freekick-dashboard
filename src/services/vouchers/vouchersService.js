
const BASE_URL = `/advertisement/coupons`;
import api from '../api.js'
// Get list of vouchers
export const getVouchers = async (params = {}) => {
    const response = await api.get(BASE_URL + '/', { params });
    return response.data;
};

// Create new voucher
export const createVoucher = async (data) => {
    const response = await api.post(BASE_URL + '/', data);
    return response.data;
};

// Get single voucher by ID
export const getVoucherById = async (id) => {
    const response = await api.get(`${BASE_URL}/${id}/`);
    return response.data;
};

// Update voucher (full update)
export const updateVoucher = async (id, data) => {
    const response = await api.put(`${BASE_URL}/${id}/`, data);
    return response.data;
};

// Partial update voucher
export const patchVoucher = async (id, data) => {
    const response = await api.patch(`${BASE_URL}/${id}/`, data);
    return response.data;
};

// Delete voucher
export const deleteVoucher = async (id) => {
    await api.delete(`${BASE_URL}/${id}/`);
};

// Get voucher analytics
export const getVoucherAnalytics = async () => {
    const response = await api.get(`${BASE_URL}/analytics/`);
    return response.data;
};

// Validate voucher code
export const validateVoucherCode = async (code) => {
    const response = await api.get(BASE_URL + '/', {
        params: { code, is_active: true }
    });
    if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0];
    }
    throw new Error('Voucher not found or inactive');
};

const vouchersService = {
    getVouchers,
    createVoucher,
    getVoucherById,
    updateVoucher,
    patchVoucher,
    deleteVoucher,
    getVoucherAnalytics,
    validateVoucherCode,
};

export default vouchersService;

