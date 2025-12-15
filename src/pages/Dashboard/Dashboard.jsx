// Dashboard.jsx
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from 'react-i18next'; // Import translation hook
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";

// --- Hooks ---
import useAnalytics from "../../hooks/useAnalytics.js";

// --- Components ---
import EmiratesChart from "../../components/Charts/EmiratesChart.jsx";
import StatCard from "../../components/Charts/StatCards.jsx";
import BookingChart from "../../components/Charts/BookingChart.jsx";
import RevenueTrendChart from "../../components/Charts/RevenueTrendChart.jsx";
import TopTeamsChart from "../../components/Charts/TopTeamsChart.jsx";
import NotificationsPanel from "../../components/common/NotificationsPanel.jsx";
import PopularVenues from "../../components/Charts/PopularVenues.jsx";

// --- Icons ---
import {
    Clock, DollarSign,
    CheckCircle, XCircle
} from 'lucide-react';

const Dashboard = () => {
    const { t } = useTranslation('dashboard'); // Initialize translation
    const dispatch = useDispatch();

    const {
        cardAnalytics,
        topEmirates,
        isLoading,
        getAllAnalytics,
        getTopEmirates,
        clearError,
        currentEmiratesPeriod,
        isTopEmiratesLoading,
        error,
    } = useAnalytics();

    const { user } = useSelector((state) => state.auth);
    const { role } = user;

    const permissions = {
        admin: role.is_admin,
        pitch_owner: role.is_pitch_owner,
        sub_admin: role.is_sub_admin,
        sub_pitch_owner: role.is_sub_pitch_owner,
    };

    // Use useMemo for periodOptions to ensure translations update dynamically
    const periodOptions = useMemo(() => [
        { value: 'this_week', label: t('periods.this_week') },
        { value: 'last_week', label: t('periods.last_week') },
        { value: 'this_month', label: t('periods.this_month') },
        { value: 'last_month', label: t('periods.last_month') },
    ], [t]);

    useEffect(() => {
        getAllAnalytics();
    }, [getAllAnalytics]);

    useEffect(() => {
        dispatch(setPageTitle(t('title')));
    }, [dispatch, t]);

    const handlePeriodChange = (newPeriod) => {
        getTopEmirates(newPeriod);
    };

    // Calculate values based on cardAnalytics data
    const confirmedCount = cardAnalytics?.complete_booking || 0;
    const cancelledCount = cardAnalytics?.cancelled_bookings || 0;
    const TotalRevenue = cardAnalytics?.total_revenue || 0;
    const total_earnings = cardAnalytics?.total_earnings || 0;

    // Define stats configuration
    const stats = [
        {
            title: t('stats.completed'),
            value: confirmedCount,
            percentChange: 135,
            icon: CheckCircle,
            iconColor: 'text-secondary-600 opacity-80'
        },
        ...(permissions.admin ? [{
            title: t('stats.active'),
            value: total_earnings,
            percentChange: 3.68,
            icon: Clock,
            iconColor: 'text-secondary-600 opacity-80'
        }] : []),
        {
            title: t('stats.cancelled'),
            value: cancelledCount,
            percentChange: -1.45,
            icon: XCircle,
            iconColor: 'text-red-500'
        },
        {
            title: t('stats.revenue'),
            value: TotalRevenue,
            percentChange: 5.94,
            icon: DollarSign,
            iconColor: 'text-secondary-600 opacity-80'
        }
    ];

    const currentPeriodLabel = periodOptions.find(p => p.value === currentEmiratesPeriod)?.label || t('periods.this_week');

    if (error.cardAnalytics) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-red-800 font-medium">{t('loading.error')}</h3>
                        <p className="text-red-600 text-sm">{error.cardAnalytics}</p>
                    </div>
                    <button
                        onClick={() => clearError('cardAnalytics')}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                    >
                        {t('loading.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <span className="text-sm text-gray-600">{t('loading.data')}</span>
                    </div>
                </div>
            )}

            <section className={'lg:flex gap-4 py-2'}>
                <aside className={'lg:w-3/4'}>
                    <div className={`grid ${!permissions?.admin ? 'grid-cols-3' : 'xl:grid-cols-4 grid-cols-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2'} gap-4 xl:gap-6 mb-8`}>
                        {stats.map((stat, index) => (
                            <StatCard key={index} {...stat} />
                        ))}
                    </div>

                    <div className="lg:mb-8 mb-4 gap-5 grid lg:grid-cols-2">
                        <BookingChart
                            title={t('charts.totalBookings')}
                            height={350}
                            showPeriodSelector={true}
                        />
                        <RevenueTrendChart
                            title={t('charts.revenueTrend')}
                            height={350}
                            showPeriodSelector={true}
                        />
                    </div>

                    <div className="lg:mb-8 mb-4 gap-5 grid lg:grid-cols-2">
                        <EmiratesChart
                            data={topEmirates || {}}
                            loading={isTopEmiratesLoading}
                            error={error?.topEmirates}
                            onRetry={() => getTopEmirates(currentEmiratesPeriod)}
                            title={t('charts.topEmirates')}
                            subtitle={currentPeriodLabel}
                            periodOptions={periodOptions}
                            currentPeriod={currentEmiratesPeriod}
                            onPeriodChange={handlePeriodChange}
                        />
                        <TopTeamsChart
                            title={t('charts.topTeams')}
                            className=""
                            limit={5}
                        />
                    </div>
                </aside>

                <div className="lg:w-1/4">
                    <div className="dashboard-sidebar">
                        <NotificationsPanel />
                    </div>
                    {!permissions.pitch_owner && (
                        <div className="mt-5">
                            <PopularVenues />
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default Dashboard;