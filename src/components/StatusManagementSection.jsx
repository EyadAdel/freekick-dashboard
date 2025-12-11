import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Reusable Status Badge
export const StatusBadge = ({ isActive }) => {
    const { t } = useTranslation('statusManagement');

    const style = isActive
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-red-100 text-red-800 border border-red-200';

    return (
        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${style} whitespace-nowrap`}>
            {isActive ? t('active') : t('inactive')}
        </span>
    );
};

const StatusManagementSection = ({
                                     title,
                                     name,
                                     items = [],
                                     statusType,
                                     emptyMessage,
                                     onApprove,
                                     onReject,
                                     rejectLabel,
                                     approveLabel,
                                     renderIcon,
                                     renderHeader,
                                     renderMeta,
                                     idKey = 'id',
                                     isActiveKey = 'is_active'
                                 }) => {
    const { t } = useTranslation('statusManagement');

    // Helper to get translated status label
    const getStatusLabel = (type) => {
        if (type === 'approved') return t('approved');
        if (type === 'rejected') return t('rejected');
        return t('pending');
    };

    return (
        <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-lg w-full shadow-md border border-primary-100 mb-4 sm:mb-6 overflow-hidden">
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-primary-100 bg-gradient-to-r from-primary-50 to-white">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                            statusType === 'approved' ? 'bg-primary-100' :
                                statusType === 'rejected' ? 'bg-red-50' : 'bg-orange-50'
                        }`}>
                            {statusType === 'approved' ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600" /> :
                                statusType === 'rejected' ? <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" /> :
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />}
                        </div>
                        <div>
                            {/* Title is usually passed as a prop, ensure parent translates it, or use t(title) if title is a key */}
                            <h2 className="text-sm sm:text-base font-bold text-secondary-600">{title}</h2>
                            <p className="text-xs text-gray-600">
                                {items.length} {items.length === 1 ? name?.single : name?.group}
                            </p>
                        </div>
                    </div>
                    <span className={`px-2 sm:px-2.5 py-0.5 pb-1.5 rounded-full text-xs font-semibold ${
                        statusType === 'approved' ? 'bg-primary-100 text-primary-700' :
                            statusType === 'rejected' ? 'bg-red-100 text-red-600' :
                                'bg-orange-100 text-orange-600'
                    }`}>
                        {getStatusLabel(statusType)}
                    </span>
                </div>
            </div>

            {items.length > 0 ? (
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 max-h-64 h-auto custom-scrollbar overflow-auto">
                    <div
                        className="space-y-2 sm:space-y-2.5 h-auto overflow-y-auto pr-1 sm:pr-2"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#cbd5e1 transparent'
                        }}
                    >
                        {items.map((item) => (
                            <div
                                key={item[idKey]}
                                className="bg-white rounded-lg border border-primary-100 p-2.5 sm:p-3 hover:shadow-md hover:border-primary-300 transition-all duration-200"
                            >
                                <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
                                    <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">

                                        {renderIcon && (
                                            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                                {renderIcon(item)}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                                                {renderHeader ? renderHeader(item) : (
                                                    <span className="font-semibold text-secondary-600 text-xs sm:text-sm truncate">
                                                        #{item[idKey]}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 flex-wrap">
                                                {renderMeta ? renderMeta(item) : ""}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Side */}
                                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-3 justify-between sm:justify-end">
                                        <div className="text-left sm:text-right">
                                            <StatusBadge isActive={item[isActiveKey]} />
                                        </div>
                                        <div className="flex gap-1.5">
                                            {(statusType === 'pending' || statusType === 'rejected') && (
                                                <button
                                                    className="flex items-center gap-1 sm:gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                                                    onClick={() => onApprove(item)}
                                                >
                                                    <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                                                    {/* Fallback to t('approve') if prop not provided */}
                                                    <span className="hidden sm:inline">{approveLabel || t('approve')}</span>
                                                    <span className="sm:hidden">✓</span>
                                                </button>
                                            )}
                                            {(statusType === 'approved') && (
                                                <button
                                                    className="flex items-center gap-1 sm:gap-1.5 bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                                                    onClick={() => onReject(item)}
                                                >
                                                    <XCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                                                    {/* Fallback to t('reject') if prop not provided */}
                                                    <span className="hidden sm:inline">{rejectLabel || t('reject')}</span>
                                                    <span className="sm:hidden">✕</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-4 sm:p-6 text-center text-gray-500 text-xs sm:text-sm">
                    {emptyMessage}
                </div>
            )}
        </div>
    );
};

export default StatusManagementSection;