import React, {useEffect} from 'react';
import RevenueOverviewChart from "../../components/Charts/RevenueOverviewChart.jsx";
import BookingPerVenues from "../../components/Charts/BookingPerVenues.jsx";
import Transactions from "../RevenueOverview/Transactions.jsx";
import TeamActivityChart from "../../components/Charts/TeamActivityChart.jsx";
import BarChart from "../../components/Charts/BarChart.jsx";
import TeamLeaderboardActivity from "../../components/Charts/TeamActivityChart.jsx";
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";
import {useDispatch} from "react-redux"; // Add this import

function Reports(props) {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Reports'));
    }, [dispatch]);

    return (
        <div className="space-y-5 xl:px-14 py-3 mx-auto">
            {/* First row with three charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RevenueOverviewChart />
                <BookingPerVenues />
            </div>
            <TeamLeaderboardActivity /> {/* Add Team Activity Chart */}

            {/* Second row with Transactions */}
            <Transactions />
        </div>
    );
}

export default Reports;