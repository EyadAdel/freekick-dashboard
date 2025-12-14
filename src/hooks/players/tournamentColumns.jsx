import { Trophy } from 'lucide-react';
import { formatDate, formatAmount } from './formatters.js';
import {getImageUrl} from "../../utils/imageUtils.js";
//
// export const getTournamentColumns = (t) => [
//     {
//         header: t ? t('tournament:name', 'Tournament') : 'Tournament',
//         accessor: 'name',
//         sortable: true,
//         sortKey: 'name',
//         render: (tournament) => (
//             <div className="flex items-center gap-3">
//                 {tournament.images && tournament.images.length > 0 ? (
//                     <img
//                         src={getImageUrl(tournament.images[0].image)}
//                         alt={tournament.name}
//                         className="w-10 h-10 rounded-lg object-cover"
//                         onError={(e) => {
//                             e.target.onerror = null;
//                             e.target.src = 'https://via.placeholder.com/40';
//                         }}
//                     />
//                 ) : (
//                     <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
//                         <Trophy className="w-5 h-5 text-primary-600" />
//                     </div>
//                 )}
//                 <div className="flex-1 min-w-0">
//                     <p className="text-sm font-semibold text-gray-900 truncate">{tournament.name}</p>
//                     <p className="text-xs text-gray-500 truncate">
//                         {tournament.subtitle || tournament.description || (t ? t('tournament:noDescription', 'No description') : 'No description')}
//                     </p>
//                 </div>
//             </div>
//         )
//     },
//     {
//         header: t ? t('tournament:status', 'Status') : 'Status',
//         accessor: 'status',
//         sortable: true,
//         sortKey: 'status',
//         align: 'center',
//         render: (tournament) => {
//             const statusColors = {
//                 upcoming: 'bg-blue-100 text-blue-700',
//                 ongoing: 'bg-yellow-100 text-yellow-700',
//                 completed: 'bg-green-100 text-green-700',
//                 cancelled: 'bg-red-100 text-red-700',
//                 won: 'bg-purple-100 text-purple-700',
//                 qualify: 'bg-green-100 text-green-700',
//                 lost: 'bg-gray-100 text-gray-700'
//             };
//
//             const statusTranslations = t ? {
//                 upcoming: t('players:playersDetail.filters.status.options.upcoming'),
//                 ongoing: t('players:playersDetail.filters.status.options.ongoing'),
//                 completed: t('players:playersDetail.filters.status.options.completed'),
//                 cancelled: t('players:playersDetail.filters.status.options.cancelled'),
//                 won: t('players:playersDetail.filters.status.options.won'),
//                 qualify: t('players:playersDetail.filters.status.options.qualify'),
//                 lost: t('players:playersDetail.filters.status.options.lost')
//             } : {};
//
//             return (
//                 <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
//                     statusColors[tournament.status] || 'bg-gray-100 text-gray-700'
//                 }`}>
//                     {t ? (statusTranslations[tournament.status] || tournament.status?.charAt(0).toUpperCase() + tournament.status?.slice(1) || 'N/A')
//                         : (tournament.status ? tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1) : 'N/A')}
//                 </span>
//             );
//         }
//     },
//     {
//         header: t ? t('tournament:startDate', 'Start Date') : 'Start Date',
//         accessor: 'start_date',
//         sortable: true,
//         sortKey: 'start_date',
//         align: 'center',
//         render: (tournament) => (
//             <div className="flex flex-col items-center">
//                 <span className="text-sm text-gray-600">
//                     {formatDate(tournament.start_date)}
//                 </span>
//                 <span className="text-xs text-gray-400">
//                     {tournament.start_time || 'N/A'}
//                 </span>
//             </div>
//         )
//     },
//     {
//         header: t ? t('tournament:endDate', 'End Date') : 'End Date',
//         accessor: 'end_date',
//         sortable: true,
//         sortKey: 'end_date',
//         align: 'center',
//         render: (tournament) => (
//             <div className="flex flex-col items-center">
//                 <span className="text-sm text-gray-600">
//                     {formatDate(tournament.end_date)}
//                 </span>
//                 <span className="text-xs text-gray-400">
//                     {tournament.end_time || 'N/A'}
//                 </span>
//             </div>
//         )
//     },
//     {
//         header: t ? t('tournament:format', 'Format') : 'Format',
//         accessor: 'scoring_system',
//         sortable: true,
//         sortKey: 'scoring_system',
//         align: 'center',
//         render: (tournament) => {
//             const formatTranslations = t ? {
//                 round_robin: t('players:playersDetail.filters.format.options.roundRobin'),
//                 knockout: t('players:playersDetail.filters.format.options.knockout'),
//                 double_elimination: t('players:playersDetail.filters.format.options.doubleElimination'),
//                 single_elimination: t('players:playersDetail.filters.format.options.singleElimination')
//             } : {};
//
//             return (
//                 <span className="text-sm text-gray-600 capitalize">
//                     {t ? (formatTranslations[tournament.scoring_system] ||
//                             tournament.scoring_system?.replace(/_/g, ' ') || 'N/A')
//                         : (tournament.scoring_system?.replace(/_/g, ' ') || 'N/A')}
//                 </span>
//             );
//         }
//     },
//     {
//         header: t ? t('tournament:participants', 'Participants') : 'Participants',
//         accessor: 'joined_users',
//         align: 'center',
//         render: (tournament) => (
//             <div className="flex items-center justify-center">
//                 <div className="flex -space-x-2">
//                     {tournament.joined_users?.slice(0, 3).map((user, idx) => (
//                         <div key={idx} className="relative">
//                             {user.image ? (
//                                 <img
//                                     src={getImageUrl(user.image)}
//                                     alt={user.name}
//                                     className="w-6 h-6 rounded-full border-2 border-white"
//                                     onError={(e) => {
//                                         e.target.onerror = null;
//                                         e.target.parentElement.innerHTML =
//                                             `<div class="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">
//                                                 ${user.name?.charAt(0)?.toUpperCase() || 'U'}
//                                             </div>`;
//                                     }}
//                                 />
//                             ) : (
//                                 <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">
//                                     {user.name?.charAt(0)?.toUpperCase() || 'U'}
//                                 </div>
//                             )}
//                         </div>
//                     ))}
//                 </div>
//                 {tournament.joined_users && tournament.joined_users.length > 3 && (
//                     <span className="text-xs text-gray-500 ml-1">
//                         +{tournament.joined_users.length - 3}
//                     </span>
//                 )}
//             </div>
//         )
//     },
//     {
//         header: t ? t('tournament:entryFee', 'Entry Fee') : 'Entry Fee',
//         accessor: 'entry_fee',
//         sortable: true,
//         sortKey: 'entry_fee',
//         align: 'right',
//         render: (tournament) => (
//             <span className="text-sm font-semibold text-primary-600">
//                 {formatAmount(tournament.entry_fee || 0)}
//             </span>
//         )
//     }
// ];
export const getTournamentColumns = (t) => [
    {
        header: t ? t('players:playersDetail.filters.status.options.tournament', 'Tournament') : 'Tournament',
        accessor: 'name',
        sortable: true,
        sortKey: 'name',
        render: (tournament) => (
            <div className="flex items-center gap-3">
                {tournament.images && tournament.images.length > 0 ? (
                    <img
                        src={getImageUrl(tournament.images[0].image)}
                        alt={tournament.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/40';
                        }}
                    />
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-primary-600" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{tournament.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                        {tournament.subtitle || tournament.description || (t ? t('players:playersDetail.noDescription', 'No description') : 'No description')}
                    </p>
                </div>
            </div>
        )
    },
    // Update other headers to use players namespace
    {
        header: t ? t('players:playersDetail.filters.status.label', 'Status') : 'Status',
        accessor: 'status',
        sortable: true,
        sortKey: 'status',
        align: 'center',
        render: (tournament) => {
            const statusColors = {
                upcoming: 'bg-blue-100 text-blue-700',
                ongoing: 'bg-yellow-100 text-yellow-700',
                completed: 'bg-green-100 text-green-700',
                cancelled: 'bg-red-100 text-red-700',
                won: 'bg-purple-100 text-purple-700',
                qualify: 'bg-green-100 text-green-700',
                lost: 'bg-gray-100 text-gray-700'
            };

            const statusTranslations = t ? {
                upcoming: t('players:playersDetail.filters.status.options.upcoming'),
                ongoing: t('players:playersDetail.filters.status.options.ongoing'),
                completed: t('players:playersDetail.filters.status.options.completed'),
                cancelled: t('players:playersDetail.filters.status.options.cancelled'),
                won: t('players:playersDetail.filters.status.options.won'),
                qualify: t('players:playersDetail.filters.status.options.qualify'),
                lost: t('players:playersDetail.filters.status.options.lost')
            } : {};

            return (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[tournament.status] || 'bg-gray-100 text-gray-700'
                }`}>
                    {t ? (statusTranslations[tournament.status] || tournament.status?.charAt(0).toUpperCase() + tournament.status?.slice(1) || 'N/A')
                        : (tournament.status ? tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1) : 'N/A')}
                </span>
            );
        }
    },
    {
        header: t ? t('players:playersDetail.startDate', 'Start Date') : 'Start Date',
        accessor: 'start_date',
        sortable: true,
        sortKey: 'start_date',
        align: 'center',
        render: (tournament) => (
            <div className="flex flex-col items-center">
                <span className="text-sm text-gray-600">
                    {formatDate(tournament.start_date)}
                </span>
                <span className="text-xs text-gray-400">
                    {tournament.start_time || 'N/A'}
                </span>
            </div>
        )
    },
    {
        header: t ? t('players:playersDetail.endDate', 'End Date') : 'End Date',
        accessor: 'end_date',
        sortable: true,
        sortKey: 'end_date',
        align: 'center',
        render: (tournament) => (
            <div className="flex flex-col items-center">
                <span className="text-sm text-gray-600">
                    {formatDate(tournament.end_date)}
                </span>
                <span className="text-xs text-gray-400">
                    {tournament.end_time || 'N/A'}
                </span>
            </div>
        )
    },
    {
        header: t ? t('players:playersDetail.filters.format.label', 'Format') : 'Format',
        accessor: 'scoring_system',
        sortable: true,
        sortKey: 'scoring_system',
        align: 'center',
        render: (tournament) => {
            const formatTranslations = t ? {
                round_robin: t('players:playersDetail.filters.format.options.roundRobin'),
                knockout: t('players:playersDetail.filters.format.options.knockout'),
                double_elimination: t('players:playersDetail.filters.format.options.doubleElimination'),
                single_elimination: t('players:playersDetail.filters.format.options.singleElimination')
            } : {};

            return (
                <span className="text-sm text-gray-600 capitalize">
                    {t ? (formatTranslations[tournament.scoring_system] ||
                            tournament.scoring_system?.replace(/_/g, ' ') || 'N/A')
                        : (tournament.scoring_system?.replace(/_/g, ' ') || 'N/A')}
                </span>
            );
        }
    },
    {
        header: t ? t('players:playersDetail.participants', 'Participants') : 'Participants',
        accessor: 'joined_users',
        align: 'center',
        render: (tournament) => (
            <div className="flex items-center justify-center">
                <div className="flex -space-x-2">
                    {tournament.joined_users?.slice(0, 3).map((user, idx) => (
                        <div key={idx} className="relative">
                            {user.image ? (
                                <img
                                    src={getImageUrl(user.image)}
                                    alt={user.name}
                                    className="w-6 h-6 rounded-full border-2 border-white"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.parentElement.innerHTML =
                                            `<div class="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">
                                                ${user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>`;
                                    }}
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {tournament.joined_users && tournament.joined_users.length > 3 && (
                    <span className="text-xs text-gray-500 ml-1">
                        +{tournament.joined_users.length - 3}
                    </span>
                )}
            </div>
        )
    },
    {
        header: t ? t('players:playersDetail.entryFee', 'Entry Fee') : 'Entry Fee',
        accessor: 'entry_fee',
        sortable: true,
        sortKey: 'entry_fee',
        align: 'right',
        render: (tournament) => (
            <span className="text-sm font-semibold text-primary-600">
                {formatAmount(tournament.entry_fee || 0)}
            </span>
        )
    }
];