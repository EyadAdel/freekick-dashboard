import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import Translation Hook

import {
    MapPin, Star, Phone, Mail, User,
    Trophy, Coffee, LayoutGrid, Shield, Info,
    CheckCircle2, XCircle, Image as ImageIcon,
    Clock, Calendar, Layers, Edit, Loader2
} from 'lucide-react';

// --- Services ---
import { venuesService } from '../../services/venues/venuesService';
import { daysOfWeekService } from '../../services/daysOfWeek/daysOfWeekService.js';
import { surfaceTypesService } from '../../services/surfaceTypes/surfaceTypesService.js';

// --- Components ---
import ArrowIcon from '../../components/common/ArrowIcon';
import VenuesForm from './VenuesForm'; // Ensure this path is correct

// --- Utils ---
import { IMAGE_BASE_URL } from "../../utils/ImageBaseURL.js";

// --- Helper: Language Translation for Backend Data ---
const getTrans = (obj, lang = 'en') => {
    return obj?.[lang] || obj?.en || {};
};

// ==========================================
// COMPONENT: Simple Status Toggle
// ==========================================
const SimpleToggle = ({ isActive, onToggle, isLoading, t }) => {
    return (
        <div className="flex items-center gap-3">
            {/* The flex layout and gap automatically swap order and spacing in RTL */}
            <span className={`text-sm font-medium transition-colors ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {isActive ? t('status.active', 'Active') : t('status.inactive', 'Inactive')}
            </span>

            <button
                type="button"
                onClick={onToggle}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
                    isActive ? 'bg-green-600' : 'bg-gray-200'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className="sr-only">Use setting</span>
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isActive
                            ? 'translate-x-5 rtl:-translate-x-5' // Moves right in LTR, moves left in RTL
                            : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
};
// --- Updated Header Component (Normal Scroll, Simple Design) ---
const Header = ({ onBack, onUpdate, isEditing, t, isActive, onToggleStatus, isToggling }) => (
    <div className="bg-white shadow-sm mb-6 z-10 relative">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">

            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-3 group text-gray-500 hover:text-primary-700 transition-colors self-start sm:self-auto"
            >
                <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
                    <ArrowIcon className="w-6 h-6 transform rotate-90 text-gray-400 group-hover:text-primary-600 rtl:-rotate-90" />
                </div>
                <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{t('header.backToVenues', 'Back to Venues')}</span>
                    <span className="block font-bold text-gray-900 leading-tight">{t('header.venueDetails', 'Venue Details')}</span>
                </div>
            </button>

            {!isEditing && (
                <div className="flex items-center gap-5 self-end sm:self-auto">
                    {/* Active/Inactive Simple Toggle */}
                    <SimpleToggle
                        isActive={isActive}
                        onToggle={onToggleStatus}
                        isLoading={isToggling}
                        t={t}
                    />

                    <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

                    {/* Update Button */}
                    <button
                        onClick={onUpdate}
                        className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 hover:shadow-lg transition-all duration-300"
                    >
                        <Edit size={16} />
                        <span>{t('header.updateVenue', 'Update Venue')}</span>
                    </button>
                </div>
            )}
        </div>
    </div>
);

// --- VenueProfileCard Component ---
const VenueProfileCard = ({ venue, daysList, t }) => {
    console.log(venue,"venuevenuevenue")
    const backendTrans = getTrans(venue.translations);
    const mainImage = venue.images?.[0]?.image
        ? `${IMAGE_BASE_URL}${venue.images[0].image}`
        : 'https://via.placeholder.com/400x300';

    const getDayName = (dayId) => {
        if (daysList && daysList.length > 0) {
            const day = daysList.find(d => d.id === dayId);
            if (day) {
                return day.translations?.name || day.day || `${t('card.day')} ${dayId}`;
            }
        }
        return `${t('card.day')} ${dayId}`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
            {/* Image & Overlay */}
            <div className="relative h-56 w-full">
                <img
                    src={mainImage}
                    alt="Venue Cover"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${
                        venue.is_active
                            ? 'bg-green-500/90 text-white'
                            : 'bg-red-500/90 text-white'
                    }`}>
                        {venue.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {venue.is_active ? t('status.active') : t('status.inactive')}
                    </span>
                </div>

                {/* Type Badge */}
                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${
                        venue.venue_type === 'indoor'
                            ? 'bg-purple-500/90 text-white'
                            : 'bg-orange-500/90 text-white'
                    }`}>
                        {venue.venue_type==="indoor"?t('status.venueTypeIndoor'):t('status.venueTypeOutdoor')}
                    </span>
                </div>

                {/* Title & Location */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-2xl font-bold leading-tight mb-1 drop-shadow-md">
                        {backendTrans.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                        <div className="flex items-center text-yellow-400">
                            <span className="font-bold mr-1">{venue.rate}</span>
                            <Star size={14} fill="currentColor" />
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span className="truncate">{venue.city}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timings */}
            <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center text-sm">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-0.5">{t('card.opens')}</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <Clock size={14} className="text-green-600"/> {venue.available_from?.slice(0, 5)}
                    </span>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex flex-col text-right">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-0.5">{t('card.closes')}</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1">
                        {venue.available_to?.slice(0, 5)} <Clock size={14} className="text-red-600"/>
                    </span>
                </div>
            </div>

            {/* Price */}
            <div className="p-6 text-center border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('card.pricePerHour')}</p>
                <div className="text-3xl font-extrabold text-primary-600 flex items-center justify-center gap-1">
                    <span className="text-lg text-gray-400 font-medium">{t('card.currency')}</span>
                    {Math.floor(Number(venue.price_per_hour))}
                </div>
            </div>

            {/* Contact Info */}
            <div className="p-5 space-y-4 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-1">{t('card.contactInfo')}</h3>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <User size={16} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs text-gray-500">{t('card.manager')}</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {venue.contact_name || venue.owner_info?.contact_name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                        <Phone size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">{t('card.phone')}</p>
                        <p dir={'ltr'} className="text-sm font-medium text-gray-900">
                            {venue.phone_number || venue.owner_info?.contact_phone}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                        <Mail size={16} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs text-gray-500">{t('card.email')}</p>
                        <p className="text-sm font-medium text-gray-900 truncate" title={venue.email}>
                            {venue.email || venue.owner_info?.email}
                        </p>
                    </div>
                </div>
            </div>

            {/* Closed Days */}
            {venue.closed_days && venue.closed_days.length > 0 && (
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Calendar size={14} className="text-red-500"/> {t('card.closedDays')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {venue.closed_days.map(dayId => (
                            <span key={dayId} className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold uppercase rounded-md border border-red-100">
                                {getDayName(dayId)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Map Link */}
            {venue.latitude && venue.longitude && (
                <div className="p-5">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}
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
                                {t('card.openMap')}
                            </span>
                        </div>
                    </a>
                </div>
            )}
        </div>
    );
};

// --- VenueGallery Component ---
const VenueGallery = ({ images, activeImage, setActiveImage, t }) => {
    if (!images || images.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="text-primary-600" size={20}/>
                {t('gallery.title')}
            </h3>

            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative h-[450px] w-full rounded-xl overflow-hidden group">
                    <img
                        src={activeImage ? `${IMAGE_BASE_URL}${activeImage}` : 'https://via.placeholder.com/800x400'}
                        alt="Venue Main"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {images.length > 1 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-hide">
                        {images.map((img, idx) => (
                            <button
                                key={img.id}
                                onClick={() => setActiveImage(img.image)}
                                className={`relative h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 ${
                                    activeImage === img.image
                                        ? 'ring-2 ring-primary-500 ring-offset-2 opacity-100 scale-100'
                                        : 'opacity-50 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0'
                                }`}
                            >
                                <img
                                    src={`${IMAGE_BASE_URL}${img.image}`}
                                    alt={`Thumb ${idx}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- VenueInfoSection Component ---
const VenueInfoSection = ({ venue, surfaceList, t }) => {
    const backendTrans = getTrans(venue.translations);

    // Helper to get Surface Name from ID
    const getSurfaceName = (surfaceId) => {
        if (!surfaceList || !surfaceId) return null;
        const surface = surfaceList.find(s => s.id === surfaceId);
        if (surface) {
            return getTrans(surface.translations).name || surface.name;
        }
        return t('info.unknownSurface');
    };

    const surfaceName = getSurfaceName(venue.surface_type);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary-500" /> {t('info.title')}
                </h3>
            </div>

            <div className="p-6 space-y-8">
                {/* 1. Description Text */}
                <div>
                    <p className="text-gray-600 text-sm leading-7 whitespace-pre-wrap">
                        {backendTrans.description || t('info.noDescription')}
                    </p>
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                {/* 2. Basic Specs Grid (Including Surface) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Surface Type Display */}
                    {surfaceName && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                <Layers size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400">{t('info.surface')}</p>
                                <p className="text-sm font-semibold text-gray-900">{surfaceName}</p>
                            </div>
                        </div>
                    )}

                    {/* Dimensions */}
                    {venue.dimensions && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                                <LayoutGrid size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400">{t('info.size')}</p>
                                <p className="text-sm font-semibold text-gray-900">{venue.dimensions}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Sports & Activities */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        {t('info.sportsActivities')}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {venue.venue_play_type?.map((sport) => (
                            <div key={sport.id} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl text-center hover:border-blue-400 hover:shadow-md transition-all group">
                                <div className="w-10 h-10 mb-2 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    {sport.icon ? (
                                        <img src={`${IMAGE_BASE_URL}${sport.icon}`} alt="" className="w-6 h-6 object-contain" />
                                    ) : (
                                        <Trophy className="w-5 h-5 text-blue-500" />
                                    )}
                                </div>
                                <span className="font-bold text-gray-700 text-xs">{getTrans(sport.translations).name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Amenities */}
                {venue.amenites_info && venue.amenites_info.length > 0 && (
                    <>
                        <div className="w-full h-px bg-gray-100"></div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                                {t('info.facilities')}
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {venue.amenites_info.map((amenity) => (
                                    <div key={amenity.id} className="flex items-center gap-2 px-4 py-2 bg-purple-50/50 border border-purple-100 rounded-lg text-purple-900 font-medium text-xs">
                                        {amenity.icon ? (
                                            <img src={`${IMAGE_BASE_URL}${amenity.icon}`} alt="" className="w-4 h-4 object-contain" />
                                        ) : (
                                            <LayoutGrid size={14}/>
                                        )}
                                        {getTrans(amenity.translations).name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// --- VenueAddonsSection Component ---
const VenueAddonsSection = ({ addons, t }) => {
    if (!addons || addons.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-orange-500" /> {t('addons.title')}
                </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {addons.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-orange-200 hover:shadow-sm transition-all bg-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                                <img
                                    src={`${IMAGE_BASE_URL}${item.addon.icon}`}
                                    alt={getTrans(item.addon.translations).name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">{getTrans(item.addon.translations).name}</div>
                                <div className="text-xs text-gray-500 mt-1">{t('addons.minOrder')}: {item.min_number}</div>
                            </div>
                        </div>
                        <div className="font-extrabold text-green-600 text-sm">{t('card.currency')} {item.price}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- VenuePoliciesSection Component ---
const VenuePoliciesSection = ({ venue, t }) => {
    const backendTrans = getTrans(venue.translations);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" /> {t('policies.title')}
                </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 text-sm border-b pb-2 border-gray-100">{t('policies.venueRules')}</h4>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-gray-700">
                        {backendTrans.rules_and_regulations || t('policies.noRules')}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 text-sm border-b pb-2 border-gray-100">{t('policies.bookingTerms')}</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center text-gray-700">
                            <span>{t('policies.cancellationNotice')}</span>
                            <span className="font-bold text-gray-900">{venue.minimum_cancellation_hours} {t('policies.hours')}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700">
                            <span>{t('policies.advanceBooking')}</span>
                            <span className="font-bold text-gray-900">{venue.advance_booking_days} {t('policies.days')}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700">
                            <span>{t('policies.splitPayment')}</span>
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${venue.allow_split_booking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {venue.allow_split_booking ? t('policies.allowed') : t('policies.notAllowed')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main View Component ---
const VenueDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { t } = useTranslation('venueDetails'); // Initialize translation namespace

    const venueId = id;

    // --- State ---
    const [venue, setVenue] = useState(null);
    const [daysList, setDaysList] = useState([]);
    const [surfaceList, setSurfaceList] = useState([]);
    const [activeImage, setActiveImage] = useState(null);
    const [loading, setLoading] = useState(true);

    // Toggle for Edit Mode
    const [isEditing, setIsEditing] = useState(false);
    // Key to force refresh after update
    const [refreshKey, setRefreshKey] = useState(0);

    // Toggle for IsActive loading state
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchAllDetails = async () => {
            if (!venueId) {
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                // Fetch venue, days, and surface types in parallel
                const [venueRes, daysRes, surfacesRes] = await Promise.all([
                    venuesService.getVenueById(venueId, true),
                    daysOfWeekService.getAll({ all_languages: true }),
                    surfaceTypesService.getAllSurfaceTypes()
                ]);

                // Handle Venues Data
                const venueData = venueRes.data;
                setVenue(venueData);
                if (venueData.images && venueData.images.length > 0) {
                    setActiveImage(venueData.images[0].image);
                }

                // Handle Days Data
                if (daysRes && daysRes.results) {
                    setDaysList(daysRes.results);
                }

                // Handle Surface Data
                if (surfacesRes) {
                    const surfaces = Array.isArray(surfacesRes) ? surfacesRes : (surfacesRes.results || []);
                    setSurfaceList(surfaces);
                }

            } catch (error) {
                console.error("Failed to fetch details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllDetails();
    }, [venueId, refreshKey]);

    // --- Handlers ---
    const handleUpdateSuccess = () => {
        setIsEditing(false); // Return to view mode
        setRefreshKey(prev => prev + 1); // Trigger useEffect to reload data
    };

    const handleToggleStatus = async () => {
        if (!venue || isTogglingStatus) return;

        setIsTogglingStatus(true);
        try {
            const newStatus = !venue.is_active;
            // Call the update service
            await venuesService.updateVenue(venue.id, { is_active: newStatus });

            // Update local state immediately for better UX
            setVenue(prev => ({
                ...prev,
                is_active: newStatus
            }));
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setIsTogglingStatus(false);
        }
    };

    // --- Render Conditions ---

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!venueId || !venue) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <p className="text-gray-500 mb-4">{t('messages.notFound')}</p>
                <button onClick={() => navigate('/venues')} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                    {t('messages.back')}
                </button>
            </div>
        );
    }

    // Render Edit Form
    if (isEditing) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Optional: You can keep header or remove it based on design preference.
                     If removing header, add a cancel button inside VenuesForm. */}
                <div className="mx-auto py-6 px-4 md:px-8">
                    <VenuesForm
                        initialData={{ data: venue }}
                        onCancel={() => setIsEditing(false)}
                        onSuccess={handleUpdateSuccess}
                    />
                </div>
            </div>
        );
    }

    // Render Details View
    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Header
                onBack={() => navigate(-1)}
                onUpdate={() => setIsEditing(true)}
                isEditing={isEditing}
                t={t}
                isActive={venue.is_active}
                onToggleStatus={handleToggleStatus}
                isToggling={isTogglingStatus}
            />

            <div className="mx-auto py-6 px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Sticky) */}
                    <div className="col-span-1">
                        <div className="sticky top-6 h-fit space-y-6">
                            <VenueProfileCard venue={venue} daysList={daysList} t={t} />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <VenueGallery
                            images={venue.images}
                            activeImage={activeImage}
                            setActiveImage={setActiveImage}
                            t={t}
                        />
                        <VenueInfoSection venue={venue} surfaceList={surfaceList} t={t} />
                        <VenueAddonsSection addons={venue.venue_addons} t={t} />
                        <VenuePoliciesSection venue={venue} t={t} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VenueDetails;