import React from 'react';
import { Phone, Calendar, Wallet, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContact } from '../../hooks/useContact';
import { getImageUrl } from "../../utils/imageUtils.js";

const PlayerProfileCard = ({
                               player,
                               onStatusToggle,
                               isUpdatingStatus,
                               formatDate,
                               calculateAge,
                               formatAmount
                           }) => {
    const { t } = useTranslation(['players', 'common']);
    const { handleWhatsAppClick } = useContact();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="bg-primary-50 p-6 text-white">
                <div className="flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full backdrop-blur-sm flex items-center justify-center mb-3 border-2">
                        {player.image ? (
                            <img
                                className="w-full h-full rounded-full object-cover"
                                src={getImageUrl(player.image)}
                                alt={player.name}
                            />
                        ) : (
                            <User className="w-12 h-12 text-gray-400" />
                        )}
                    </div>
                    <h2 className="text-xl text-gray-900 font-bold">{player.name}</h2>
                    <p className="text-gray-400 text-sm">{player.user_code}</p>
                    <div className="mt-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                            player.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                        }`}>
                            {player.is_active
                                ? t('status.active')
                                : t('status.inactive')
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b">
                <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{player.num_of_points || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('playersPage.points')}</div>
                </div>
                <div className="text-center border-x border-gray-200">
                    <div className="text-2xl font-bold text-primary-600">{player.num_of_booking || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('playersPage.bookings')}</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{player.num_of_tournaments || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('playersPage.tournaments')}</div>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500">{t('playersPage.phone')}</p>
                        <p className="text-sm font-medium">{player.phone || t('playersPage.noPhone')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500">{t('playersDetail.birthDate', 'Birth Date')}</p>
                        <p className="text-sm font-medium">{formatDate(player.date_of_birth)}</p>
                        <p className="text-xs text-gray-400">
                            {t('playersDetail.age', 'Age')}: {calculateAge(player.date_of_birth)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500">{t('playersPage.walletBalance')}</p>
                        <p className="text-lg font-bold text-primary-600">{formatAmount(player.wallet_balance)}</p>
                    </div>
                </div>
            </div>

            <div className="p-6 pt-0 space-y-2">
                <button
                    onClick={() => handleWhatsAppClick(player.phone, `Hello ${player.name}!`)}
                    disabled={!player.phone}
                    className="w-full px-4 py-2.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-600 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Phone className="w-4 h-4" />
                    WhatsApp
                </button>

                {player.is_active ? (
                    <button
                        disabled={isUpdatingStatus}
                        onClick={() => onStatusToggle(false)}
                        className="w-full px-4 py-2.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUpdatingStatus
                            ? t('common:buttons.updating', 'Updating...')
                            : t('playersDetail.buttons.suspend')
                        }
                    </button>
                ) : (
                    <button
                        disabled={isUpdatingStatus}
                        onClick={() => onStatusToggle(true)}
                        className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUpdatingStatus
                            ? t('common:buttons.updating', 'Updating...')
                            : t('playersDetail.buttons.activate')
                        }
                    </button>
                )}
            </div>
        </div>
    );
};

export default PlayerProfileCard;