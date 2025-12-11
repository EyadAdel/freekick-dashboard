import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    MapPin, CheckCircle2, XCircle,
    Info, Users, Calendar,
    Edit, LayoutGrid, Layers, Crown, Building2, Maximize
} from 'lucide-react';

// --- Services ---
import { pitchesService } from '../../services/pitches/pitchesService.js';
import { venuesService } from '../../services/venues/venuesService.js';

// --- Components ---
import ArrowIcon from '../../components/common/ArrowIcon';
import VenuesForm from './PitchesForm.jsx';

// --- Utils ---
import { IMAGE_BASE_URL } from "../../utils/ImageBaseURL.js";

// --- Helper: Language Translation ---
const getTrans = (obj, lang = 'en') => {
    if (!obj) return {};
    if (obj.name) return obj;
    return obj?.[lang] || obj?.en || {};
};

// --- Header Component ---
const Header = ({ onBack, onUpdate, isEditing, t }) => (
    <div className="bg-white shadow-sm   top-0">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors group"
            >
                <div className="p-1 rounded-full group-hover:bg-primary-50 transition-colors">
                    <ArrowIcon className="w-6 h-6 sm:w-8 sm:h-8 transform rotate-90 rtl:-rotate-90" />
                </div>
                <span className="font-medium text-sm sm:text-base">{t('header.backToPitches', 'Back to Pitches')}</span>
            </button>

            {!isEditing && (
                <button
                    onClick={onUpdate}
                    className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm active:scale-95 transform duration-150"
                >
                    <Edit size={16} />
                    <span className="hidden sm:inline">{t('header.updatePitch', 'Update Pitch')}</span>
                    <span className="sm:hidden">{t('header.update', 'Update')}</span>
                </button>
            )}
        </div>
    </div>
);

// --- PitchProfileCard Component ---
const PitchProfileCard = ({ pitch, venueName, t, currentLang }) => {
    const backendTrans = getTrans(pitch.translations, currentLang);
    const mainImage = pitch.image
        ? `${IMAGE_BASE_URL}${pitch.image}`
        : 'https://via.placeholder.com/400x300';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group h-full flex flex-col">
            {/* Image & Overlay */}
            <div className="relative h-56 sm:h-64 lg:h-72 w-full shrink-0">
                <img
                    src={mainImage}
                    alt="Pitch Cover"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${
                        pitch.is_active
                            ? 'bg-green-500/90 text-white'
                            : 'bg-red-500/90 text-white'
                    }`}>
                        {pitch.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {pitch.is_active ? t('status.active', 'Active') : t('status.inactive', 'Inactive')}
                    </span>
                </div>

                {/* Primary Badge */}
                {pitch.is_primary && (
                    <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-10">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm bg-yellow-500/90 text-white">
                            <Crown size={12} />
                            {t('status.primary', 'Primary')}
                        </span>
                    </div>
                )}

                {/* Title & Size */}
                <div className="absolute bottom-4 left-4 right-4 text-white rtl:text-right">
                    <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-1 drop-shadow-md line-clamp-2">
                        {backendTrans.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm opacity-90 rtl:justify-end">
                        <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span className="font-semibold">{pitch.size} {t('card.players', 'Players')}</span>
                        </div>
                        {pitch.venue && (
                            <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span className="truncate max-w-[120px] sm:max-w-[180px]">
                                    {venueName || `${t('card.venueId', 'Venue ID')}: ${pitch.venue}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 border-b border-gray-100 divide-x divide-gray-100 rtl:divide-x-reverse">
                <div className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('card.bookings', 'Bookings')}</span>
                    <span className="text-base sm:text-lg font-bold text-gray-900">{pitch.num_of_bookings}</span>
                </div>
                <div className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('card.created', 'Created')}</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {new Date(pitch.created_at).toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                </div>
            </div>

            {/* Price */}
            <div className="p-4 sm:p-6 text-center bg-gray-50/50">
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('card.pricePerHour', 'Price Per Hour')}</p>
                <div className="text-2xl sm:text-3xl font-extrabold text-primary-600 flex items-center justify-center gap-1">
                    <span className="text-base sm:text-lg text-gray-400 font-medium">{t(`card.priceAED`)}</span>
                    {Math.floor(Number(pitch.price_per_hour))}
                    <span className="text-xs text-gray-400 font-normal self-end mb-1">.00</span>
                </div>
            </div>

            {/* --- Info Row --- */}
            <div className="p-4 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4 bg-white flex-grow">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{t('card.playersCapacity', 'Players Capacity')}</p>
                        <p className="text-sm font-medium truncate">
                            {pitch.size} vs {pitch.size} ({pitch.size * 2} {t('common.max', 'Max')})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{t('card.venue', 'Venue')}</p>
                        <p className="text-sm font-medium text-primary-600 hover:underline cursor-pointer truncate">
                            {venueName || `Venue ID: ${pitch.venue}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{t('card.pitchSize', 'Pitch Size')}</p>
                        <p className="text-sm font-medium">{pitch.size}-a-side</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PitchInfoSection Component ---
const PitchInfoSection = ({ pitch, parentPitchName, t, currentLang }) => {
    const backendTrans = getTrans(pitch.translations, currentLang);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary-500" /> {t('info.title', 'Pitch Details')}
                </h3>
            </div>

            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                {/* 1. Description Text */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {t('info.description', 'Description')}
                    </h4>
                    <p className="text-gray-600 text-sm leading-6 sm:leading-7 whitespace-pre-wrap">
                        {backendTrans.description || t('info.noDescription', 'No description provided for this pitch.')}
                    </p>
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                {/* 2. Technical Specs */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        {t('info.specifications', 'Specifications')}
                    </h4>
                    {/* Changed grid for better mobile response */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">

                        {/* Size / Capacity */}
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                                <Users size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold text-gray-500">{t('info.sizeLabel', 'Pitch Size')}</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">{pitch.size}-a-side</p>
                            </div>
                        </div>

                        {/* Primary Status */}
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                                <LayoutGrid size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold text-gray-500">{t('info.typeLabel', 'Type')}</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {pitch.is_primary ? t('info.mainPitch', 'Main Pitch') : t('info.subPitch', 'Sub Pitch')}
                                </p>
                            </div>
                        </div>

                        {/* Parent Pitch Info */}
                        {pitch.parent_pitch && (
                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 shrink-0">
                                    <Layers size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold text-gray-500">{t('info.parentPitch', 'Parent Pitch')}</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {parentPitchName || `ID: ${pitch.parent_pitch}`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                {/* 3. Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="shrink-0" />
                        <span>{t('card.created', 'Created')}: {new Date(pitch.created_at).toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="shrink-0" />
                        <span>{t('card.updated', 'Last Updated')}: {new Date(pitch.updated_at).toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const PitchDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('pitchDetails'); // Use specific namespace
    const currentLang = i18n.language;

    const { pitchId } = location.state || {};

    // --- State ---
    const [pitch, setPitch] = useState(null);
    const [venueName, setVenueName] = useState(null);
    const [parentPitchName, setParentPitchName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // --- Data Fetching: Pitch Details ---
    useEffect(() => {
        const fetchPitchDetails = async () => {
            if (!pitchId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // 1. Fetch Pitch Data
                const response = await pitchesService.getPitchById(pitchId);

                if (response && response.data) {
                    const pitchData = response.data;
                    setPitch(pitchData);

                    // 2. Fetch Venues Data (for Display Name)
                    if (pitchData.venue) {
                        try {
                            const venueRes = await venuesService.getVenueById(pitchData.venue);
                            const venueData = venueRes.data;
                            const vTrans = getTrans(venueData.translations, currentLang);
                            if (vTrans && vTrans.name) setVenueName(vTrans.name);
                        } catch (venueError) {
                            console.error("Failed to fetch venue details:", venueError);
                        }
                    }

                    // 3. Fetch Parent Pitch Data (for Display Name)
                    if (pitchData.parent_pitch) {
                        try {
                            const parentRes = await pitchesService.getPitchById(pitchData.parent_pitch);
                            const parentData = parentRes.data;
                            const pTrans = getTrans(parentData.translations, currentLang);
                            if (pTrans && pTrans.name) setParentPitchName(pTrans.name);
                        } catch (parentError) {
                            console.error("Failed to fetch parent pitch details:", parentError);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch pitch details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPitchDetails();
    }, [pitchId, refreshKey, currentLang]);

    // --- Handlers ---
    const handleUpdateSuccess = () => {
        setIsEditing(false);
        setRefreshKey(prev => prev + 1); // Trigger re-fetch of details
    };

    // --- Render ---
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!pitchId || !pitch) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <p className="text-gray-500 mb-4">{t('messages.notFound', 'Pitch not found')}</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                    {t('messages.back', 'Go Back')}
                </button>
            </div>
        );
    }

    // --- Edit Mode (Shows VenuesForm) ---
    if (isEditing) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className=" mx-auto py-6 ">
                    <VenuesForm
                        initialData={null}
                        pitchDetails={{ data: pitch }}
                        onCancel={() => setIsEditing(false)}
                        onSuccess={handleUpdateSuccess}
                    />
                </div>
            </div>
        );
    }

    // --- View Mode ---
    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Header
                onBack={() => navigate(-1)}
                onUpdate={() => setIsEditing(true)}
                isEditing={isEditing}
                t={t}
            />

            <div className=" mx-auto py-6 ">
                {/*
                    Mobile: Stacked (grid-cols-1)
                    Tablet/Desktop: 2/3 columns (grid-cols-1 lg:grid-cols-3)
                */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column (Sticky on Large Screens) */}
                    <div className="col-span-1">
                        <div className="lg:sticky lg:top-24 h-fit space-y-6">
                            <PitchProfileCard pitch={pitch} venueName={venueName} t={t} currentLang={currentLang} />
                        </div>
                    </div>

                    {/* Right Column (Scrollable Content) */}
                    <div className="lg:col-span-2 space-y-6">
                        <PitchInfoSection pitch={pitch} parentPitchName={parentPitchName} t={t} currentLang={currentLang} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PitchDetails;