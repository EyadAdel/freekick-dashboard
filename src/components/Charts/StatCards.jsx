
import { TrendingUp, TrendingDown } from 'lucide-react';

// Reusable StatCard Component
const StatCard = ({
                      title,
                      value,
                      percentChange,
                      icon: Icon,
                      iconBgColor = 'bg-blue-100',
                      iconColor = 'text-blue-600'
                  }) => {
    const isPositive = percentChange >= 0;
    const isNegative = percentChange < 0;

    return (
        <div className="bg-white flex  px-5 justify-between items-center   rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex  flex-col gap-2  justify-between mb-4">
                <span className="text-sm  text-gray-400 font-medium">{title}
                    <div className="text-2xl font-bold text-secondary-600">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                </span>
                <div className=" ">

                    {percentChange !== undefined && (
                        <div className={`flex items-center gap-1 w-fit px-2 rounded-md py-1 rounded ${
                            isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50'
                        }`}>
                            {isPositive ? (
                                <TrendingUp className="text-green-600" size={14} />
                            ) : isNegative ? (
                                <TrendingDown className="text-red-600" size={14} />
                            ) : null}
                            <span className={`text-sm font-medium ${
                                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
                            }`}>
              {isPositive && '+'}{percentChange}%
            </span>
                        </div>
                    )}
                </div>


            </div>

            <div className={`w-10 h-10 ${iconBgColor} rounded-full flex items-center justify-center`}>
                <Icon className={iconColor} size={20} />
            </div>
        </div>
    );
};
export  default StatCard