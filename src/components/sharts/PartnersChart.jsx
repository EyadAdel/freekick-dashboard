import React from 'react';
import { Users } from 'lucide-react';
import BarChart from './BarChart';

const PartnersChart = ({
                           data = {},
                           title = "Top Partners",
                           subtitle = "This Week",
                           loading = false,
                           error = null,
                           onRetry,
                           className = "",
                           maxItems = 6,
                       }) => {
    return (
        <BarChart
            data={data}
            title={title}
            subtitle={subtitle}
            loading={loading}
            error={error}
            onRetry={onRetry}
            className={className}
            maxItems={maxItems}
            icon={Users}
            iconColor="text-purple-500"
            valueLabel="Bookings"
            totalLabel="Total Partners Bookings"
            colors={[
                'bg-purple-500',
                'bg-blue-500',
                'bg-green-500',
                'bg-yellow-500',
                'bg-red-500',
                'bg-indigo-500',
            ]}
        />
    );
};

export default PartnersChart;