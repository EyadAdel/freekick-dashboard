import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import RevenueOverviewChart from "../../components/Charts/RevenueOverviewChart.jsx";
import BookingPerVenues from "../../components/Charts/BookingPerVenues.jsx";
import Transactions from "../RevenueOverview/Transactions.jsx";
import TeamLeaderboardActivity from "../../components/Charts/TeamActivityChart.jsx";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import { useDispatch } from "react-redux";

function Reports(props) {
    const { t } = useTranslation(['reports', 'common']);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('reports:title')));
    }, [dispatch, t]);

    return (
        <div className="space-y-5 xl:px-14 py-3 mx-auto">
            {/* First row with three charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RevenueOverviewChart />
                <BookingPerVenues />
            </div>
            <TeamLeaderboardActivity />

            {/* Second row with Transactions */}
            <Transactions />
        </div>
    );
}

export default Reports;