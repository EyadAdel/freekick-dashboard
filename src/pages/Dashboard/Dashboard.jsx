// Dashboard.jsx
import React from 'react';
import useAnalytics from "../../hooks/useAnalytics.js";
import { useEffect, useState } from "react";
import EmiratesChart from "../../components/Charts/EmiratesChart.jsx";
import StatCard from "../../components/Charts/StatCards.jsx";
import BookingChart from "../../components/Charts/BookingChart.jsx";
import RevenueTrendChart from "../../components/Charts/RevenueTrendChart.jsx";

import { FaCalendarDays } from "react-icons/fa6";
import TopTeamsChart from "../../components/Charts/TopTeamsChart.jsx";
import NotificationsPanel from "../../components/common/NotificationsPanel.jsx";
import PopularVenues from "../../components/Charts/PopularVenues.jsx";
import {useDispatch} from "react-redux";
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";
import {
    Clock, MapPin, DollarSign,
    CheckCircle, XCircle, ArrowLeft
} from 'lucide-react';
import NotificationHandler from "../../components/NotificationHandler.jsx";
const Dashboard = () => {
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

    const [periodOptions] = useState([
        { value: 'this_week', label: 'This Week' },
        { value: 'last_week', label: 'Last Week' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
    ]);

    useEffect(() => {
        getAllAnalytics();
    }, [getAllAnalytics]);

    const handlePeriodChange = (newPeriod) => {
        getTopEmirates(newPeriod);
    };

    // Calculate values based on cardAnalytics data
    const confirmedCount = cardAnalytics?.complete_booking || 0;
    const cancelledCount = cardAnalytics?.cancelled_bookings || 0;
    const TotalRevenue = cardAnalytics?.total_revenue || 0;
    const total_earnings = cardAnalytics?.total_earnings || 0;
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Dashboard'));
    }, [dispatch]);
    // Define stats configuration
    const stats = [
        {
            title: 'Completed Bookings',
            value: confirmedCount,
            percentChange: 135,
            icon:CheckCircle,
            iconColor: 'text-secondary-600 opacity-80'
        },
        {
            title: 'Active Bookings',
            value: total_earnings,
            percentChange: 3.68,
            icon:Clock,
            iconColor: 'text-secondary-600 opacity-80'
        },
        {
            title: 'Canceled Bookings',
            value: cancelledCount,
            percentChange: -1.45,
            icon:XCircle,
            iconColor: 'text-red-500'
        },
        {
            title: 'Total Revenue',
            value: TotalRevenue,
            percentChange: 5.94,
            icon:DollarSign,
            iconColor: 'text-secondary-600 opacity-80'
        }
    ];

    const currentPeriodLabel = periodOptions.find(p => p.value === currentEmiratesPeriod)?.label || 'This Week';



    if (error.cardAnalytics) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-red-800 font-medium">Error loading analytics</h3>
                        <p className="text-red-600 text-sm">{error.cardAnalytics}</p>
                    </div>
                    <button
                        onClick={() => clearError('cardAnalytics')}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Stats Cards */}
            {isLoading &&
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="text-sm text-gray-600">Loading data...</span>
            </div>
            </div>
        }
        {/*<NotificationHandler />*/}
            <section className={'lg:flex gap-4 '}>
                <aside className={'lg:w-3/4'}>
                    <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2  xl:grid-cols-4 gap-4 xl:gap-6 mb-8">
                        {stats.map((stat, index) => (
                            <StatCard key={index} {...stat} />
                        ))}
                    </div>
                    <div className="lg:mb-8 mb-4  gap-5 grid lg:grid-cols-2 ">
                        <BookingChart
                            title="Booking Trends"
                            height={350}
                            showPeriodSelector={true}
                        />
                        <RevenueTrendChart
                            title="Revenue Trend"
                            height={350}
                            showPeriodSelector={true}
                        />
                    </div>
                    <div className="lg:mb-8 mb-4  gap-5 grid lg:grid-cols-2  ">
                        <EmiratesChart
                            data={topEmirates || {}}
                            loading={isTopEmiratesLoading}
                            error={error?.topEmirates}
                            onRetry={() => getTopEmirates(currentEmiratesPeriod)}
                            title="Top Emirates"
                            subtitle={currentPeriodLabel}
                            periodOptions={periodOptions}
                            currentPeriod={currentEmiratesPeriod}
                            onPeriodChange={handlePeriodChange}
                        />
                        <TopTeamsChart
                            title="Top 5  Teams"
                            className=""
                            limit={5}
                        />
                    </div>

                </aside>
                <aside>

                </aside>
                <div className=" lg:w-1/4">
                    <div className="dashboard-sidebar">
                        <NotificationsPanel />
                    </div>
                    <div className=" mt-5">
                        <PopularVenues />
                    </div>
                </div>
            </section>


        </>
    );
};

export default Dashboard;