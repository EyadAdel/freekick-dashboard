import axios from 'axios';
import api from "../api.js";

const API_BASE_URL='/advertisement/events'
class TicketsService {
    /**
     * Get all tickets with pagination and filters
     * @param {Object} params - Query parameters (page, page_limit, search, ordering)
     */
    async getAllTickets(params = {}) {
        try {
            const response = await api.get(API_BASE_URL, { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get a single ticket by ID
     * @param {number} id - Ticket ID
     */
    async getTicketById(id) {
        try {
            const response = await api.get(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Create a new ticket
     * @param {Object} ticketData - Ticket data
     */
    async createTicket(ticketData) {
        try {
            const response = await api.post(`${API_BASE_URL}/`, ticketData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Update a ticket
     * @param {number} id - Ticket ID
     * @param {Object} ticketData - Updated ticket data
     */
    async updateTicket(id, ticketData) {
        try {
            const response = await api.patch(`${API_BASE_URL}/${id}/`, ticketData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Delete a ticket
     * @param {number} id - Ticket ID
     */
    async deleteTicket(id) {
        try {
            const response = await api.delete(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Track ticket click
     * @param {number} id - Ticket ID
     */
    async trackTicketClick(id) {
        try {
            const response = await api.post(`${API_BASE_URL}/${id}/click`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Handle API errors
     */
    handleError(error) {
        if (error.response) {
            return {
                message: error.response.data.message || 'An error occurred',
                status: error.response.status,
                data: error.response.data
            };
        } else if (error.request) {
            return {
                message: 'No response from server',
                status: 500
            };
        } else {
            return {
                message: error.message || 'An unexpected error occurred',
                status: 500
            };
        }
    }
}

export default new TicketsService();