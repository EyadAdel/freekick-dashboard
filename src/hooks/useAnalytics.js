import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
    fetchCardAnalytics,
    fetchRevenueTrend,
    fetchTopEmirates,
    fetchWeeklyBookingAnalytics,
    fetchAllAnalytics,
    clearAnalyticsError,
    resetAnalyticsData,
    setEmiratesPeriod,
    setBookingPeriod,
    fetchBookingChartAnalytics,
    fetchTopTeams,
    setTeamsPeriod,
    fetchNotifications,
    fetchNotificationById,
    markNotificationAsRead,
    clearNotifications,
} from '../features/dashboard/analyticsSlice.js';

const useAnalytics = () => {
    const dispatch = useDispatch();
    const analyticsState = useSelector((state) => state.analytics);

    const getAllAnalytics = useCallback(() => {
        dispatch(fetchAllAnalytics());
    }, [dispatch]);

    const getCardAnalytics = useCallback(() => {
        dispatch(fetchCardAnalytics());
    }, [dispatch]);

    const getRevenueTrend = useCallback((period = 'this_week') => {
        dispatch(fetchRevenueTrend(period));
    }, [dispatch]);

    const getTopEmirates = useCallback((period = 'this_week') => {
        dispatch(setEmiratesPeriod(period));
        dispatch(fetchTopEmirates(period));
    }, [dispatch]);

    const getWeeklyBookingAnalytics = useCallback((params) => {
        dispatch(fetchWeeklyBookingAnalytics(params));
    }, [dispatch]);

    const getBookingChartAnalytics = useCallback((period = 'this_week') => {
        dispatch(setBookingPeriod(period));
        dispatch(fetchBookingChartAnalytics(period));
    }, [dispatch]);

    const getTopTeams = useCallback((period = 'this_week') => {
        dispatch(setTeamsPeriod(period));
        dispatch(fetchTopTeams(period));
    }, [dispatch]);

    // Notification methods
    const getNotifications = useCallback((params = {}) => {
        dispatch(fetchNotifications(params));
    }, [dispatch]);

    const getNotificationById = useCallback((id) => {
        dispatch(fetchNotificationById(id));
    }, [dispatch]);

    const markAsRead = useCallback((id) => {
        dispatch(markNotificationAsRead(id));
    }, [dispatch]);

    const clearAllNotifications = useCallback(() => {
        dispatch(clearNotifications());
    }, [dispatch]);

    const clearError = useCallback((errorType) => {
        dispatch(clearAnalyticsError({ errorType }));
    }, [dispatch]);

    const resetData = useCallback(() => {
        dispatch(resetAnalyticsData());
    }, [dispatch]);

    return {
        ...analyticsState,
        getAllAnalytics,
        getCardAnalytics,
        getRevenueTrend,
        getTopEmirates,
        getWeeklyBookingAnalytics,
        getBookingChartAnalytics,
        getTopTeams,
        getNotifications,
        getNotificationById,
        markAsRead,
        clearAllNotifications,
        clearError,
        resetData,

        isLoading: analyticsState.loading.all,
        isCardAnalyticsLoading: analyticsState.loading.cardAnalytics,
        isRevenueTrendLoading: analyticsState.loading.revenueTrend,
        isTopEmiratesLoading: analyticsState.loading.topEmirates,
        isWeeklyBookingsLoading: analyticsState.loading.weeklyBookings,
        isBookingChartLoading: analyticsState.loading.bookingChart,
        isTopTeamsLoading: analyticsState.loading.topTeams,
        isNotificationsLoading: analyticsState.loading.notifications,
        isNotificationDetailLoading: analyticsState.loading.notificationDetail,

        hasError: Object.values(analyticsState.error).some(error => error !== null),
    };
};

export default useAnalytics;