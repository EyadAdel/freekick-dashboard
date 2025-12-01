import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
    fetchCardAnalytics,
    fetchRevenueTrend,
    fetchTopPartners,
    fetchWeeklyBookingAnalytics,
    fetchAllAnalytics,
    clearAnalyticsError,
    resetAnalyticsData,
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

    const getRevenueTrend = useCallback((params) => {
        dispatch(fetchRevenueTrend(params));
    }, [dispatch]);

    const getTopPartners = useCallback((limit) => {
        dispatch(fetchTopPartners(limit));
    }, [dispatch]);

    const getWeeklyBookingAnalytics = useCallback((params) => {
        dispatch(fetchWeeklyBookingAnalytics(params));
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
        getTopPartners,
        getWeeklyBookingAnalytics,
        clearError,
        resetData,
        // Helper computed properties
        isLoading: useCallback(() => Object.values(analyticsState.loading).some(loading => loading), [analyticsState.loading]),
        hasError: useCallback(() => Object.values(analyticsState.error).some(error => error !== null), [analyticsState.error]),
    };
};

export default useAnalytics;