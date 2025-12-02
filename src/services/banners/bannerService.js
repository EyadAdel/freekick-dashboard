import api from "../api.js";

const API_URL = '/advertisement/banners/';

const bannerService = {
    async getBanners(params = {}) {
        const response = await api.get(API_URL, { params });
        return response.data;
    },

    async getBannerById(id) {
        const response = await api.get(`${API_URL}${id}/`);
        return response.data;
    },

    async createBanner(data) {
        const response = await api.post(API_URL, data);
        return response.data;
    },

    async updateBanner(id, data) {
        const response = await api.put(`${API_URL}${id}/`, data);
        return response.data;
    },

    async partialUpdateBanner(id, data) {
        const response = await api.patch(`${API_URL}${id}/`, data);
        return response.data;
    },

    async deleteBanner(id) {
        await api.delete(`${API_URL}${id}/`);
    }
};

export default bannerService;