import useAnalytics from "../../hooks/useAnalytics.js";
import { useEffect } from "react";
import { CheckCircle, Clock, DollarSign, XCircle, TrendingUp, MapPin, Users, Calendar } from "lucide-react";
// import EmiratesChart from "../../components/charts/EmiratesChart.jsx";
import PartnersChart from "../../components/sharts/PartnersChart.jsx";
// import BarChart from "../../components/charts/BarChart.jsx";

const Dashboard = () => {
    const {
        cardAnalytics,
        revenueTrend,
        topPartners,
        weeklyBookings,
        isLoading,
        getAllAnalytics,
        clearError,
        isCardAnalyticsLoading,
        isTopPartnersLoading,
        error,
    } = useAnalytics();

    useEffect(() => {
        // Fetch all analytics on component mount
        getAllAnalytics();
    }, [getAllAnalytics]);

    // Calculate values based on cardAnalytics data
    const confirmedCount = cardAnalytics?.complete_booking || 0;
    const cancelledCount = cardAnalytics?.cancelled_bookings || 0;
    const paidCount = cardAnalytics?.complete_booking || 0; // Same as confirmed for now
    const pendingCount = cardAnalytics?.pending_bookings || 0;

    // Extract emirates data from topPartners or use mock data
    // Assuming topPartners might contain emirates data, or you need to fetch separately
    // For now, let's assume topPartners contains partner data

    // Mock emirates data (replace with actual API call if needed)
    const emiratesData = {
        "Abu Dhabi": 24,
        "Dubai": 18,
        "Sharjah": 16,
        "Fujairah": 12,
        "Umm Al Quwain": 9,
        "Ras Al Khaimah": 7,
        "Ajman": 5,
    };

    // Transform topPartners data if it's in a different format
    const transformPartnersData = () => {
        if (!topPartners) return {};

        // If topPartners is an array
        if (Array.isArray(topPartners)) {
            return topPartners.reduce((acc, partner) => {
                if (partner.name && partner.value !== undefined) {
                    acc[partner.name] = partner.value;
                }
                return acc;
            }, {});
        }

        // If topPartners is already an object
        if (typeof topPartners === 'object' && topPartners !== null) {
            return topPartners;
        }

        return {};
    };

    const partnersData = transformPartnersData();

    // If loading all analytics
    if (isLoading()) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading analytics...</div>
            </div>
        );
    }

    // If there's an error loading card analytics
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
            {/* Header */}


            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-900">
                                {isCardAnalyticsLoading ? '...' : confirmedCount}
                            </div>
                            <div className="text-sm text-gray-500">Confirmed</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-900">
                                {isCardAnalyticsLoading ? '...' : pendingCount}
                            </div>
                            <div className="text-sm text-gray-500">Pending</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-900">
                                {isCardAnalyticsLoading ? '...' : cancelledCount}
                            </div>
                            <div className="text-sm text-gray-500">Cancelled</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-900">
                                {isCardAnalyticsLoading ? '...' : paidCount}
                            </div>
                            <div className="text-sm text-gray-500">Paid</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Emirates Chart */}
                {/*<EmiratesChart*/}
                {/*    data={emiratesData}*/}
                {/*    loading={false} // Set to true if you fetch this separately*/}
                {/*    error={null}*/}
                {/*    onRetry={() => console.log('Retry emirates')}*/}
                {/*    title="Top Emirates"*/}
                {/*    subtitle="This Week"*/}
                {/*/>*/}

                {/*/!* Partners Chart *!/*/}
                {/*<PartnersChart*/}
                {/*    data={partnersData}*/}
                {/*    loading={isTopPartnersLoading}*/}
                {/*    error={error.topPartners}*/}
                {/*    onRetry={() => clearError('topPartners')}*/}
                {/*    title="Top Partners"*/}
                {/*    subtitle="This Week"*/}
                {/*/>*/}
            </div>

            {/*/!* Revenue Trend *!/*/}
            {/*{revenueTrend && (*/}
            {/*    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">*/}
            {/*        <div className="flex items-center justify-between mb-4">*/}
            {/*            <div>*/}
            {/*                <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>*/}
            {/*                <p className="text-sm text-gray-500">Monthly revenue overview</p>*/}
            {/*            </div>*/}
            {/*            <TrendingUp className="text-blue-500" size={20} />*/}
            {/*        </div>*/}
            {/*        <div className="bg-gray-50 p-4 rounded-lg">*/}
            {/*            <pre className="text-xs overflow-auto max-h-60">*/}
            {/*                {JSON.stringify(revenueTrend, null, 2)}*/}
            {/*            </pre>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}

            {/*/!* Weekly Bookings *!/*/}
            {/*{weeklyBookings && (*/}
            {/*    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">*/}
            {/*        <div className="flex items-center justify-between mb-4">*/}
            {/*            <div>*/}
            {/*                <h2 className="text-lg font-semibold text-gray-900">Weekly Bookings</h2>*/}
            {/*                <p className="text-sm text-gray-500">Bookings by week</p>*/}
            {/*            </div>*/}
            {/*            <Calendar className="text-green-500" size={20} />*/}
            {/*        </div>*/}
            {/*        <div className="bg-gray-50 p-4 rounded-lg">*/}
            {/*            <pre className="text-xs overflow-auto max-h-60">*/}
            {/*                {JSON.stringify(weeklyBookings, null, 2)}*/}
            {/*            </pre>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}

            {/* Raw Data Debug (optional - remove in production) */}
            {/*<div className="mt-8 p-4 bg-gray-50 rounded-lg">*/}
            {/*    <details>*/}
            {/*        <summary className="cursor-pointer text-sm font-medium text-gray-700">*/}
            {/*            Debug Data*/}
            {/*        </summary>*/}
            {/*        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">*/}
            {/*            <div>*/}
            {/*                <h4 className="text-sm font-medium mb-2">Top Partners Data:</h4>*/}
            {/*                <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-60">*/}
            {/*                    {JSON.stringify(topPartners, null, 2)}*/}
            {/*                </pre>*/}
            {/*            </div>*/}
            {/*            <div>*/}
            {/*                <h4 className="text-sm font-medium mb-2">Transformed Partners Data:</h4>*/}
            {/*                <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-60">*/}
            {/*                    {JSON.stringify(partnersData, null, 2)}*/}
            {/*                </pre>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </details>*/}
            {/*</div>*/}
        </>
    );
};

export default Dashboard;