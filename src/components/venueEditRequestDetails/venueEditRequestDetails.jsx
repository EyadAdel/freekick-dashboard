import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import hook
import ArrowIcon from "../../components/common/ArrowIcon.jsx";
import { venuesEditRequestsService } from "../../services/venuesEditRequests/venuesEditRequestsService.js";
import { surfaceTypesService } from "../../services/surfaceTypes/surfaceTypesService.js";
import { venueSportsService } from "../../services/venueSports/venueSportsService.js";
import { IMAGE_BASE_URL } from "../../utils/ImageBaseURL.js";
import { showConfirm } from "../../components/showConfirm.jsx";

import {
    MapPin, Phone, Mail, User,
    Coffee, Shield, Info,
    CheckCircle2, XCircle, Image as ImageIcon,
    Clock, Layers, AlertTriangle
} from 'lucide-react';

// --- Helper Components ---

// 1. Header Component
const Header = ({ onBack, onAccept, onReject, isUpdating, request, t }) => (
    <div className="bg-white shadow-sm z-10 relative">
        <div className="mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
                {/* Rotate based on language direction in CSS if needed, or keep standard */}
                <ArrowIcon className="w-8 h-8 transform rotate-90 rtl:-rotate-90" />
                <span className="font-medium">{t('header.back')}</span>
            </button>

            {request?.accepted === null && (
                <div className="flex gap-3">
                    <button
                        onClick={onReject}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                    >
                        <XCircle size={16} />
                        <span>{t('header.reject')}</span>
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        {isUpdating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/> : <CheckCircle2 size={16} />}
                        <span>{t('header.accept')}</span>
                    </button>
                </div>
            )}
        </div>
    </div>
);

// 2. Profile Card Component
const RequestProfileCard = ({ request, displayData, formatAmount, formatTime, handleWhatsAppClick, handleEmailClick, t }) => {
    const coverImage = request.images_request?.[0]
        ? `${IMAGE_BASE_URL}${request.images_request[0].image || request.images_request[0]}`
        : 'https://via.placeholder.com/400x300?text=No+Image';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
            {/* Image & Overlay */}
            <div className="relative h-56 w-full">
                <img
                    src={coverImage}
                    alt="Venue Cover"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Error+Loading'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${
                        request.is_active
                            ? 'bg-green-500/90 text-white'
                            : 'bg-gray-500/90 text-white'
                    }`}>
                        {request.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {request.is_active ? t('status.active') : t('status.inactive')}
                    </span>
                </div>

                <div className="absolute top-4 left-4 rtl:right-4 rtl:left-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${
                        request.venue_type === 'indoor'
                            ? 'bg-purple-500/90 text-white'
                            : 'bg-amber-500/90 text-white'
                    }`}>
                        {request.venue_type ? t(`venueType.${request.venue_type}`) : t('venueType.general')}
                    </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white rtl:text-right">
                    <h2 className="text-2xl font-bold leading-tight mb-1 drop-shadow-md">
                        {displayData.name || t('defaults.noName')}
                    </h2>
                    <div className="flex items-center gap-2 text-sm opacity-90 rtl:flex-row-reverse rtl:justify-end">
                        <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span className="truncate">{request.city}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timings */}
            <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center text-sm">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-0.5">{t('profile.availableFrom')}</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <Clock size={14} className="text-green-600"/> {formatTime(request.available_from)}
                    </span>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex flex-col text-end">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-0.5">{t('profile.availableTo')}</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1 justify-end">
                        {formatTime(request.available_to)} <Clock size={14} className="text-red-600"/>
                    </span>
                </div>
            </div>

            {/* Price */}
            <div className="p-6 text-center border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('profile.pricePerHour')}</p>
                <div className="text-3xl font-extrabold text-primary-600 flex items-center justify-center gap-1">
                    {formatAmount(request.price_per_hour)}
                </div>
            </div>

            {/* Contact Info */}
            <div className="p-5 space-y-4 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-1 text-start">{t('profile.contactInfo')}</h3>

                {/* Contact Person */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <User size={16} />
                    </div>
                    <div className="overflow-hidden text-start">
                        <p className="text-xs text-gray-500">{t('profile.contactPerson')}</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {request.contact_name}
                        </p>
                    </div>
                </div>

                {/* Detailed Phone */}
                <div className="w-full text-start flex items-center gap-3 group/btn p-1 rounded-md">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                        <Phone size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">{t('profile.phone')}</p>
                        <p className="text-sm font-medium text-gray-900" dir="ltr">
                            {request.phone_number}
                        </p>
                    </div>
                </div>

                {/* Detailed Email */}
                <div className="w-full text-start flex items-center gap-3 group/btn p-1 rounded-md">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                        <Mail size={16} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs text-gray-500">{t('profile.email')}</p>
                        <p className="text-sm font-medium text-gray-900 truncate" title={request.email}>
                            {request.email}
                        </p>
                    </div>
                </div>

                {/* --- NEW ACTION BUTTONS SECTION --- */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                        onClick={() => handleWhatsAppClick(request.phone_number)}
                        disabled={!request.phone_number}
                        className="w-full px-4 py-2.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-600 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Phone className="w-4 h-4"/>
                        {t('actions.whatsapp')}
                    </button>
                    <button
                        onClick={() => handleEmailClick(request.email)}
                        disabled={!request.email}
                        className="w-full px-4 py-2.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-600 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Mail className="w-4 h-4"/>
                        {t('actions.email')}
                    </button>
                </div>
            </div>

            {/* Request Status */}
            {request.accepted !== null && (
                <div className={`p-4 text-center text-sm font-bold ${
                    request.accepted ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {request.accepted ? t('status.requestAccepted') : t('status.requestRejected')}
                </div>
            )}

            {/* Map Link */}
            {request.latitude && request.longitude && (
                <div className="p-5">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-32 bg-gray-100 rounded-xl overflow-hidden relative group border border-gray-200 shadow-inner"
                    >
                        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] opacity-20 bg-center bg-cover"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 group-hover:bg-black/5 transition-colors">
                            <div className="bg-white p-2 rounded-full shadow-lg mb-1 transform group-hover:-translate-y-1 transition-transform duration-300">
                                <MapPin size={20} className="text-red-500" fill="currentColor" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
                                {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                            </span>
                        </div>
                    </a>
                </div>
            )}
        </div>
    );
};

// 3. Gallery Component
const RequestGallery = ({ images, activeImage, setActiveImage, t }) => {
    if (!images || images.length === 0) return (
        <div className="mb-6 p-10 bg-white rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50"/>
            <p>{t('gallery.noImages')}</p>
        </div>
    );

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="text-primary-600" size={20}/>
                {t('gallery.title')}
            </h3>

            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative h-[450px] w-full rounded-xl overflow-hidden group">
                    <img
                        src={activeImage ? `${IMAGE_BASE_URL}${activeImage}` : ''}
                        alt="Request Main"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=Error'; }}
                    />
                </div>

                {images.length > 1 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-hide">
                        {images.map((imgObj, idx) => {
                            const src = `${IMAGE_BASE_URL}${imgObj.image || imgObj}`;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(imgObj.image || imgObj)}
                                    className={`relative h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 ${
                                        activeImage === (imgObj.image || imgObj)
                                            ? 'ring-2 ring-primary-500 ring-offset-2 opacity-100 scale-100'
                                            : 'opacity-50 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0'
                                    }`}
                                >
                                    <img
                                        src={src}
                                        alt={`Thumb ${idx}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100x100?text=Error'; }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// 4. Info Section
const RequestInfoSection = ({ request, displayData, surfaceTypes, playTypes, t, currentLang }) => {

    // Logic to find surface name
    const getSurfaceName = (id) => {
        if (!surfaceTypes || surfaceTypes.length === 0) return t('defaults.loading');
        const type = surfaceTypes.find(t => t.id === id);
        return type?.translations?.[currentLang]?.name || type?.translations?.en?.name || type?.name || t('defaults.unknownType');
    };

    // Logic to find play type name
    const getPlayTypeName = (id) => {
        if (!playTypes || playTypes.length === 0) return `ID: ${id}`;
        const type = playTypes.find(t => t.id === id);
        return type?.translations?.[currentLang]?.name || type?.translations?.en?.name || type?.name || `ID: ${id}`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary-500" /> {t('info.title')}
                </h3>
            </div>

            <div className="p-6 space-y-8">
                {/* 1. Description */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('info.description')}</h4>
                    <p className="text-gray-600 text-sm leading-7 whitespace-pre-wrap">
                        {displayData.description || t('defaults.noDescription')}
                    </p>
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                {/* 2. Specs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 w-full md:gap-4 gap-1">
                    {/* Surface */}
                    <div className="flex items-center w-full gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                            <Layers size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">{t('info.surface')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {getSurfaceName(request.surface_type)}
                            </p>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                            <MapPin size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">{t('info.address')}</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {displayData.address || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Play Types */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        {t('info.sports')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {request.venue_play_type?.map((id, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-center shadow-sm">
                                <span className="font-bold text-gray-700 text-xs">
                                    {getPlayTypeName(id)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 5. Addons Section
const RequestAddonsSection = ({ addons, formatAmount, t, currentLang }) => {
    if (!addons || addons.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-orange-500" /> {t('addons.title')} ({addons.length})
                </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {addons.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-orange-200 hover:shadow-sm transition-all bg-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                                {item.addon?.icon ? (
                                    <img
                                        src={`${IMAGE_BASE_URL}${item.addon.icon}`}
                                        alt={item.addon?.translations?.[currentLang]?.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <Layers className="text-gray-400" />
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">
                                    {item.addon?.translations?.[currentLang]?.name || item.addon?.translations?.en?.name || t('addons.unknown')}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{t('addons.minOrder')}: {item.min_number}</div>
                            </div>
                        </div>
                        <div className="font-extrabold text-green-600 text-sm">
                            {formatAmount(item.price)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 6. Policies Section
const RequestPoliciesSection = ({ request, displayData, t }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" /> {t('policies.title')}
                </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 text-sm border-b pb-2 border-gray-100">{t('policies.rules')}</h4>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-gray-700 whitespace-pre-line">
                        {displayData.rules_and_regulations || t('defaults.noRules')}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 text-sm border-b pb-2 border-gray-100">{t('policies.configuration')}</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center text-gray-700">
                            <span>{t('policies.cancellation')}</span>
                            <span className="font-bold text-gray-900">{request.minimum_cancellation_hours} {t('policies.hours')}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700">
                            <span>{t('policies.advanceBooking')}</span>
                            <span className="font-bold text-gray-900">{request.advance_booking_days} {t('policies.days')}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700">
                            <span>{t('policies.splitBooking')}</span>
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${request.allow_split_booking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {request.allow_split_booking ? t('policies.allowed') : t('policies.denied')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700">
                            <span>{t('policies.recurringBooking')}</span>
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${request.allow_recurring_booking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {request.allow_recurring_booking ? t('policies.allowed') : t('policies.denied')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---

const VenueEditRequestDetails = () => {
    const { t, i18n } = useTranslation('venueEditRequestDetails');
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Get data from useLocation
    const request = location.state?.data?.requestData || location.state?.requestData;
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeImage, setActiveImage] = useState(null);

    // 2. State for meta data
    const [surfaceTypes, setSurfaceTypes] = useState([]);
    const [playTypes, setPlayTypes] = useState([]);

    // 3. Effect to fetch surface and play types
    useEffect(() => {
        const fetchMetaData = async () => {
            try {
                // Fetch both concurrently
                const [surfaceData, playData] = await Promise.all([
                    surfaceTypesService.getAllSurfaceTypes(),
                    venueSportsService.getAll()
                ]);

                setSurfaceTypes(surfaceData.results);
                setPlayTypes(playData.results);
            } catch (error) {
                console.error("Failed to fetch metadata", error);
            }
        };

        fetchMetaData();
    }, []);

    useEffect(() => {
        if (request?.images_request && request.images_request.length > 0) {
            // Check if it's an object or string
            const firstImg = request.images_request[0];
            setActiveImage(firstImg.image || firstImg);
        }
    }, [request]);

    // --- Handlers ---
    const handleAccept = async () => {
        if (!request?.id) return;
        setIsUpdating(true);
        try {
            await venuesEditRequestsService.acceptRequest(request.id);
            setTimeout(() => navigate(-1), 500);
        } catch (error) {
            console.error("Accept failed", error);
            setIsUpdating(false);
        }
    };

    const handleReject = async () => {
        if (!request?.id) return;
        const isConfirmed = await showConfirm({
            title: t('alerts.rejectTitle'),
            text: t('alerts.rejectText'),
            confirmButtonText: t('alerts.confirmReject'),
            icon: 'warning'
        });

        if (!isConfirmed) return;

        setIsUpdating(true);
        try {
            await venuesEditRequestsService.deleteRequest(request.id);
            setTimeout(() => navigate(-1), 500);
        } catch (error) {
            console.error("Reject/Delete failed", error);
            setIsUpdating(false);
        }
    };

    // --- Helper Functions ---
    const formatAmount = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return `${t('common.currency', { defaultValue: 'AED' })} 0`;
        return `${t('common.currency', { defaultValue: 'AED' })} ${Math.abs(num).toLocaleString()}`;
    };

    const formatTime = (time) => {
        if (!time) return 'N/A';
        return time.substring(0, 5); // 00:00
    };

    const handleWhatsAppClick = (phone) => {
        if (!phone) return;
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
    };

    const handleEmailClick = (email) => {
        if (!email) return;
        window.open(`mailto:${email}`, '_blank');
    };

    // --- Loading/Error State ---
    if (!request) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">{t('alerts.noData')}</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                    {t('alerts.goBack')}
                </button>
            </div>
        );
    }

    // Access nested data safely based on current language
    const { translations, available_addons } = request;
    const currentLang = i18n.language;
    // Fallback logic: Try current language -> Try 'en' -> Empty object
    const displayData = translations?.en || translations?.en || {};

    return (
        <div className="min-h-screen bg-gray-50 pb-10" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <Header
                onBack={() => navigate(-1)}
                onAccept={handleAccept}
                onReject={handleReject}
                isUpdating={isUpdating}
                request={request}
                t={t}
            />

            <div className="mx-auto py-6 px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Sticky) */}
                    <div className="col-span-1">
                        <div className="sticky top-6 h-fit space-y-6">
                            <RequestProfileCard
                                request={request}
                                displayData={displayData}
                                formatAmount={formatAmount}
                                formatTime={formatTime}
                                handleWhatsAppClick={handleWhatsAppClick}
                                handleEmailClick={handleEmailClick}
                                t={t}
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <RequestGallery
                            images={request.images_request}
                            activeImage={activeImage}
                            setActiveImage={setActiveImage}
                            t={t}
                        />

                        <RequestInfoSection
                            request={request}
                            displayData={displayData}
                            surfaceTypes={surfaceTypes}
                            playTypes={playTypes}
                            t={t}
                            currentLang={currentLang}
                        />

                        <RequestAddonsSection
                            addons={available_addons}
                            formatAmount={formatAmount}
                            t={t}
                            currentLang={currentLang}
                        />

                        <RequestPoliciesSection
                            request={request}
                            displayData={displayData}
                            t={t}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VenueEditRequestDetails;