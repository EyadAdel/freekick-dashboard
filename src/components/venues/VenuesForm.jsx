import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainInput from './../MainInput.jsx';
import MuiPhoneInput from '../../components/common/MuiPhoneInput.jsx';

// --- I18N IMPORTS ---
import { useTranslation } from 'react-i18next';
import useAutoTranslation from '../../hooks/useTranslation.js';

// --- UTILS ---
import { generateUniqueFileName } from '../../utils/fileUtils.js';
import { IMAGE_BASE_URL } from '../../utils/ImageBaseURL.js';

// --- SERVICES ---
import { venuesService } from '../../services/venues/venuesService.js';
import { uploadService } from '../../services/upload/uploadService.js';
import { amenitiesService } from '../../services/amenities/amenitiesService.js';
import { addonsService } from '../../services/addons/addonsService.js';
import { venueSportsService } from '../../services/venueSports/venueSportsService.js';
import { surfaceTypesService } from '../../services/surfaceTypes/surfaceTypesService.js';
import { daysOfWeekService } from '../../services/daysOfWeek/daysOfWeekService.js';
import { stuffTypeListService } from '../../services/stuff/stuffService.js';
import { citiesListService } from '../../services/citiesList/citiesListService.js';

// --- GOOGLE MAPS IMPORTS ---
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

// --- ICONS & UI ---
import {
    MapPin, Phone, Mail, User, Clock,
    Layers, Save, X, Globe, UploadCloud, Trash2,
    CheckSquare, DollarSign, Loader2, Edit, Image as ImageIcon,
    Shield, Check, ChevronDown, Crosshair, Calendar, AlertCircle, Map as MapIcon,
    RefreshCw, Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from "react-redux";

// --- GOOGLE MAPS CONFIG ---
const GOOGLE_MAPS_API_KEY = "AIzaSyAeWD187O4GPg0j8V-gEOlHLmPqUPp-TeA";
const LIBRARIES = ['places']; // Required for search/autocomplete

const DEFAULT_CENTER = { lat: 24.4539, lng: 54.3773 }; // Abu Dhabi

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.75rem'
};

// --- REUSABLE COMPONENT FOR TRANSLATABLE FIELDS ---
const TranslationInput = ({
                              label,
                              value,
                              onChange,
                              loading,
                              isManual,
                              onReset,
                              error,
                              isTextArea = false,
                              rows = 3,
                              placeholder
                          }) => {
    const getAppLanguage = () => {
        if (typeof window === 'undefined') return 'en';
        try {
            return localStorage.getItem('appLanguage') || 'en';
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            return 'en';
        }
    };

    const appLanguage = getAppLanguage();
    const isRTL = appLanguage === 'ar';

    const getButtonPosition = () => {
        if (label.includes('(AR)') || isRTL) return 'left-0 ml-1';
        return 'right-0 mr-1';
    };

    const getLoadingPosition = () => {
        if (label.includes('(AR)') || isRTL) return 'left-0 ml-1';
        return 'right-0 mr-1';
    };

    return (
        <div className="relative w-full">
            {isTextArea ? (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                    <textarea
                        rows={rows}
                        className={`w-full p-3 border rounded-lg bg-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm ${
                            error ? 'border-red-500' : 'border-gray-300'
                        } ${isRTL ? 'text-right' : 'text-left'}`}
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    />
                </div>
            ) : (
                <MainInput
                    label={label}
                    value={value}
                    onChange={onChange}
                    error={error}
                    dir={isRTL ? 'rtl' : 'ltr'}
                />
            )}

            {loading && !isManual && (
                <span
                    className={`absolute top-0 ${getLoadingPosition()} text-xs text-blue-500 mt-2 animate-pulse`}
                >
                    Translating...
                </span>
            )}

            {isManual && (
                <button
                    type="button"
                    onClick={onReset}
                    className={`absolute top-0 ${getButtonPosition()} mt-1 text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100 z-10 transition-colors`}
                    title="Reset to Auto-Translation"
                >
                    <RefreshCw size={10} /> Auto
                </button>
            )}
        </div>
    );
};

const VenuesForm = ({ onCancel, onSuccess, initialData = null }) => {
    const { user } = useSelector((state) => state.auth);
    const RoleIsAdmin = user?.role?.is_admin;
    const { t, i18n } = useTranslation('venueForm');

    // --- STATE ---
    const [formData, setFormData] = useState({
        translations: { en: { name: "", description: "", address: "", rules_and_regulations: "", cancellation_policy: "" }, ar: { name: "", description: "", address: "", rules_and_regulations: "", cancellation_policy: "" } },
        owner: "", city: "", address: "", contact_name: "", phone_number: "", email: "",
        venue_type: "", surface_type: "", price_per_hour: "", advance_booking_days: "", minimum_cancellation_hours: "",
        latitude: "", longitude: "", available_from: "", available_to: "",
        allow_split_booking: false, allow_recurring_booking: false, is_active: false,
        images: [], venue_play_type: [], amenities: [], closed_days: [], venue_addons: []
    });

    const [options, setOptions] = useState({ amenities: [], playTypes: [], surfaceTypes: [], addons: [], days: [], owners: [], cities: [] });
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- TRANSLATION STATE ---
    const [activeField, setActiveField] = useState(null);
    const [manualEdits, setManualEdits] = useState({
        en: { name: false, description: false, address: false, rules_and_regulations: false, cancellation_policy: false },
        ar: { name: false, description: false, address: false, rules_and_regulations: false, cancellation_policy: false }
    });

    // --- GOOGLE MAPS STATE ---
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES
    });
    const [map, setMap] = useState(null);
    const [searchResult, setSearchResult] = useState(null);
    const autocompleteRef = useRef(null);

    const fileInputRef = useRef(null);

    // --- HELPER: PROCESS SERVER IMAGES ---
    const processImage = (imgObj) => {
        if (!imgObj) return null;
        const urlString = (typeof imgObj === 'object' && imgObj.image) ? imgObj.image : imgObj;
        return typeof urlString === 'string' ? (urlString.startsWith('http') ? urlString : `${IMAGE_BASE_URL}${urlString}`) : null;
    };

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchAllOptions = async () => {
            try {
                const [amenitiesRes, playTypesRes, surfaceRes, addonsRes, daysRes, ownersRes] = await Promise.all([
                    amenitiesService.getAllAmenities(), venueSportsService.getAll({ all_languages: true }), surfaceTypesService.getAllSurfaceTypes(),
                    addonsService.getAll({ all_languages: true }), daysOfWeekService.getAll({ all_languages: true }), stuffTypeListService.getStuffListByType('pitch_owner')
                ]);
                const citiesRes = citiesListService.getAll();
                setOptions({
                    amenities: amenitiesRes.results || amenitiesRes || [], playTypes: playTypesRes.results || playTypesRes || [],
                    surfaceTypes: surfaceRes.results || surfaceRes || [], addons: addonsRes.results || addonsRes || [],
                    days: daysRes.results || daysRes || [], owners: ownersRes.results || ownersRes || [], cities: citiesRes
                });
            } catch (error) {
                console.error("Failed to load form options", error);
                toast.error(t('messages.loadFail'));
            } finally { setLoadingOptions(false); }
        };
        fetchAllOptions();
    }, [t]);

    // --- EDIT MODE POPULATE ---
    useEffect(() => {
        const data = initialData?.data || initialData;
        if (data) {
            setFormData({
                translations: {
                    en: { name: data.translations?.en?.name || "", description: data.translations?.en?.description || "", address: data.translations?.en?.address || "", rules_and_regulations: data.translations?.en?.rules_and_regulations || "", cancellation_policy: data.translations?.en?.cancellation_policy || "" },
                    ar: { name: data.translations?.ar?.name || "", description: data.translations?.ar?.description || "", address: data.translations?.ar?.address || "", rules_and_regulations: data.translations?.ar?.rules_and_regulations || "", cancellation_policy: data.translations?.ar?.cancellation_policy || "" }
                },
                owner: data.owner?.id || data.owner || "", city: data.city || "", address: data.translations?.en?.address || data.address || "",
                contact_name: data.contact_name || data.owner_info?.contact_name || "", phone_number: data.phone_number || data.owner_info?.contact_phone || "", email: data.email || data.owner_info?.email || "",
                venue_type: data.venue_type || "", surface_type: data.surface_type?.id || data.surface_type || "", price_per_hour: data.price_per_hour || "",
                advance_booking_days: data.advance_booking_days || "", minimum_cancellation_hours: data.minimum_cancellation_hours || "",
                available_from: data.available_from || "", available_to: data.available_to || "",
                allow_split_booking: data.allow_split_booking ?? false, allow_recurring_booking: data.allow_recurring_booking ?? false, is_active: data.is_active ?? false,
                latitude: data.latitude ? parseFloat(data.latitude) : "", longitude: data.longitude ? parseFloat(data.longitude) : "",
                images: data.images ? data.images.map(processImage).filter(Boolean) : [],
                venue_play_type: data.venue_play_type?.map(i => (typeof i === 'object' ? i.id : i)) || [],
                amenities: data.amenities?.map(i => (typeof i === 'object' ? i.id : i)) || [],
                closed_days: data.closed_days?.map(i => (typeof i === 'object' ? i.id : i)) || [],
                venue_addons: data.venue_addons?.map(item => ({ addon: item.addon?.id || item.addon, price: item.price, min_number: item.min_number })) || []
            });
            setManualEdits({ en: { name: true, description: true, address: true, rules_and_regulations: true, cancellation_policy: true }, ar: { name: true, description: true, address: true, rules_and_regulations: true, cancellation_policy: true } });
        }
    }, [initialData]);

    // --- TRANSLATION HOOKS ---
    const { translatedText: arName, loading: loadArName } = useAutoTranslation(activeField === 'en' ? formData.translations.en.name : "", 'ar');
    const { translatedText: enName, loading: loadEnName } = useAutoTranslation(activeField === 'ar' ? formData.translations.ar.name : "", 'en');
    const { translatedText: arDesc, loading: loadArDesc } = useAutoTranslation(activeField === 'en' ? formData.translations.en.description : "", 'ar');
    const { translatedText: enDesc, loading: loadEnDesc } = useAutoTranslation(activeField === 'ar' ? formData.translations.ar.description : "", 'en');
    const { translatedText: arAddr, loading: loadArAddr } = useAutoTranslation(activeField === 'en' ? formData.translations.en.address : "", 'ar');
    const { translatedText: enAddr, loading: loadEnAddr } = useAutoTranslation(activeField === 'ar' ? formData.translations.ar.address : "", 'en');
    const { translatedText: arRules, loading: loadArRules } = useAutoTranslation(activeField === 'en' ? formData.translations.en.rules_and_regulations : "", 'ar');
    const { translatedText: enRules, loading: loadEnRules } = useAutoTranslation(activeField === 'ar' ? formData.translations.ar.rules_and_regulations : "", 'en');
    const { translatedText: arPolicy, loading: loadArPolicy } = useAutoTranslation(activeField === 'en' ? formData.translations.en.cancellation_policy : "", 'ar');
    const { translatedText: enPolicy, loading: loadEnPolicy } = useAutoTranslation(activeField === 'ar' ? formData.translations.ar.cancellation_policy : "", 'en');

    const useSyncTranslation = (targetLang, field, text) => {
        useEffect(() => {
            const sourceLang = targetLang === 'en' ? 'ar' : 'en';
            if (activeField === sourceLang && text && !manualEdits[targetLang][field]) {
                setFormData(prev => ({ ...prev, translations: { ...prev.translations, [targetLang]: { ...prev.translations[targetLang], [field]: text } } }));
            }
        }, [text, activeField, manualEdits, targetLang, field]);
    };
    useSyncTranslation('ar', 'name', arName); useSyncTranslation('en', 'name', enName);
    useSyncTranslation('ar', 'description', arDesc); useSyncTranslation('en', 'description', enDesc);
    useSyncTranslation('ar', 'address', arAddr); useSyncTranslation('en', 'address', enAddr);
    useSyncTranslation('ar', 'rules_and_regulations', arRules); useSyncTranslation('en', 'rules_and_regulations', enRules);
    useSyncTranslation('ar', 'cancellation_policy', arPolicy); useSyncTranslation('en', 'cancellation_policy', enPolicy);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };
    const handleTranslationChange = (lang, field, value) => {
        setActiveField(lang);
        setManualEdits(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: true } }));
        setFormData(prev => ({ ...prev, translations: { ...prev.translations, [lang]: { ...prev.translations[lang], [field]: value } } }));
    };
    const resetManualEdit = (lang, field) => {
        setManualEdits(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: false } }));
        const otherLang = lang === 'en' ? 'ar' : 'en';
        setActiveField(otherLang);
    };
    const handleMultiSelectToggle = (field, id) => setFormData(prev => ({ ...prev, [field]: (prev[field] || []).includes(id) ? prev[field].filter(x => x !== id) : [...(prev[field] || []), id] }));
    const handleAddonToggle = (addonId, checked) => setFormData(prev => ({ ...prev, venue_addons: checked ? [...prev.venue_addons, { addon: addonId, price: "", min_number: 0 }] : prev.venue_addons.filter(item => item.addon !== addonId) }));
    const handleAddonDetailChange = (addonId, key, value) => setFormData(prev => ({ ...prev, venue_addons: prev.venue_addons.map(item => item.addon === addonId ? { ...item, [key]: value } : item) }));

    // --- GOOGLE MAP HANDLERS ---
    const onLoadMap = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmountMap = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const handleMapClick = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
        }));
    };

    const onLoadAutocomplete = (autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            const location = place.geometry?.location;

            if (location) {
                const lat = location.lat();
                const lng = location.lng();

                // Update form data with new location and address
                setFormData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    address: place.formatted_address || prev.address, // Optional: auto-fill general address
                    translations: {
                        ...prev.translations,
                        en: { ...prev.translations.en, address: place.formatted_address || prev.translations.en.address }
                    }
                }));

                // Pan map
                if (map) {
                    map.panTo({ lat, lng });
                    map.setZoom(15);
                }
            } else {
                console.log("Autocomplete: No geometry available");
            }
        }
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const newImages = files.filter(f => f.type.startsWith('image/')).map(file => ({ id: Date.now() + Math.random(), file, preview: URL.createObjectURL(file), uploading: true, serverUrl: null, uniqueName: null }));
        setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
        newImages.forEach(async (imgObj) => {
            try {
                const uniqueName = generateUniqueFileName(imgObj.file.name);
                const result = await uploadService.processFullUpload(imgObj.file, uniqueName);
                setFormData(prev => ({ ...prev, images: prev.images.map(item => (item.id === imgObj.id) ? { ...item, serverUrl: result.url, uniqueName: uniqueName, uploading: false } : item) }));
            } catch (error) {
                console.error("Upload failed", error);
                setFormData(prev => ({ ...prev, images: prev.images.filter(item => item.id !== imgObj.id) }));
            }
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    const removeImage = (index) => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

// Add this useEffect after the options fetching useEffect
    useEffect(() => {
        // Auto-fill owner for non-admin users
        if (!RoleIsAdmin && user?.id && !formData.owner) {
            setFormData(prev => ({
                ...prev,
                owner: user.id
            }));
        }
    }, [RoleIsAdmin, user, formData.owner]);

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     if (formData.images.some(img => typeof img === 'object' && img.uploading)) return toast.warning(t('messages.uploadWait'));
    //     const newErrors = {};
    //     if (!formData.translations.en.name) newErrors.enName = t('messages.required');
    //     if (!formData.venue_type) newErrors.venue_type = t('messages.required');
    //     if (!formData.city) newErrors.city = t('messages.required');
    //     if (!formData.owner) newErrors.owner = t('messages.required');
    //     if (!formData.price_per_hour) newErrors.price_per_hour = t('messages.required');
    //     if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return toast.error(t('messages.fillRequired')); }
    //     if (RoleIsAdmin && !formData.owner) newErrors.owner = t('messages.required');
    //
    //     setIsSubmitting(true);
    //     try {
    //         const data = initialData?.data || initialData;
    //         const payload = {
    //             venue: data ? data.id : null, city: formData.city, address: formData.address,
    //             owner: RoleIsAdmin ? formData.owner : user?.id, // ✅ Use current user's ID for non-admins
    //             contact_name: formData.contact_name, phone_number: `+${formData.phone_number}`, email: formData.email,
    //             venue_type: formData.venue_type, surface_type: formData.surface_type || null, price_per_hour: formData.price_per_hour,
    //             advance_booking_days: formData.advance_booking_days || 0, minimum_cancellation_hours: formData.minimum_cancellation_hours || 0,
    //             available_from: formData.available_from, available_to: formData.available_to,
    //             allow_split_booking: formData.allow_split_booking, allow_recurring_booking: formData.allow_recurring_booking, is_active: formData.is_active,
    //             latitude: formData.latitude, longitude: formData.longitude, translations: formData.translations,
    //             amenities: formData.amenities, venue_play_type: formData.venue_play_type, closed_days: formData.closed_days,
    //             venue_addons: formData.venue_addons.map(a => ({ addon: a.addon, price: a.price.toString(), min_number: parseInt(a.min_number, 10) || 0 })),
    //             images: formData.images.map(item => {
    //                 let val = null;
    //                 if (typeof item === 'string') val = item.includes('/') ? item.split('/').pop() : item;
    //                 else if (item.uniqueName || item.serverUrl) val = item.uniqueName || item.serverUrl.split('/').pop();
    //                 return val ? { image: val } : null;
    //             }).filter(Boolean)
    //         };
    //         console.log(payload,'payload')
    //         let response;
    //         if (data && data.id) response = RoleIsAdmin ? await venuesService.updateVenue(data.id, payload) : await venuesService.venueUpdateRequest(data.id, payload);
    //         else response = await venuesService.createVenue(payload);
    //
    //         const responseData = response?.data || response;
    //         console.log(responseData,'response')
    //         if (responseData?.images) setFormData(prev => ({ ...prev, images: responseData.images.map(processImage).filter(Boolean) }));
    //         if (onSuccess) onSuccess();
    //         toast.success(t('messages.saveSuccess'));
    //     } catch (error) {
    //         console.error("Submit error", error);
    //         toast.error(t('messages.saveFail'));
    //     } finally { setIsSubmitting(false); }
    // };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.images.some(img => typeof img === 'object' && img.uploading)) return toast.warning(t('messages.uploadWait'));
        const newErrors = {};
        if (!formData.translations.en.name) newErrors.enName = t('messages.required');
        if (!formData.venue_type) newErrors.venue_type = t('messages.required');
        if (!formData.city) newErrors.city = t('messages.required');
        if (!formData.price_per_hour) newErrors.price_per_hour = t('messages.required');

        // Only validate owner field for admin/sub-admin
        if (RoleIsAdmin && !formData.owner) newErrors.owner = t('messages.required');

        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return toast.error(t('messages.fillRequired')); }

        setIsSubmitting(true);
        try {
            const data = initialData?.data || initialData;

            // Base payload without owner
            const payload = {
                venue: data ? data.id : null,
                city: formData.city,
                address: formData.address,
                contact_name: formData.contact_name,
                phone_number: `+${formData.phone_number}`,
                email: formData.email,
                venue_type: formData.venue_type,
                surface_type: formData.surface_type || null,
                price_per_hour: formData.price_per_hour,
                advance_booking_days: formData.advance_booking_days || 0,
                minimum_cancellation_hours: formData.minimum_cancellation_hours || 0,
                available_from: formData.available_from,
                available_to: formData.available_to,
                allow_split_booking: formData.allow_split_booking,
                allow_recurring_booking: formData.allow_recurring_booking,
                is_active: formData.is_active,
                latitude: formData.latitude,
                longitude: formData.longitude,
                translations: formData.translations,
                amenities: formData.amenities,
                venue_play_type: formData.venue_play_type,
                closed_days: formData.closed_days,
                venue_addons: formData.venue_addons.map(a => ({ addon: a.addon, price: a.price.toString(), min_number: parseInt(a.min_number, 10) || 0 })),
                images: formData.images.map(item => {
                    let val = null;
                    if (typeof item === 'string') val = item.includes('/') ? item.split('/').pop() : item;
                    else if (item.uniqueName || item.serverUrl) val = item.uniqueName || item.serverUrl.split('/').pop();
                    return val ? { image: val } : null;
                }).filter(Boolean)
            };

            // Only include owner field if user is admin or sub-admin
            if (RoleIsAdmin) {
                payload.owner = formData.owner;
            }

            console.log(payload,'payload')
            let response;
            if (data && data.id) response = RoleIsAdmin ? await venuesService.updateVenue(data.id, payload) : await venuesService.venueUpdateRequest(data.id, payload);
            else response = await venuesService.createVenue(payload);

            const responseData = response?.data || response;
            console.log(responseData,'response')
            if (responseData?.images) setFormData(prev => ({ ...prev, images: responseData.images.map(processImage).filter(Boolean) }));
            if (onSuccess) onSuccess();
            toast.success(t('messages.saveSuccess'));
        } catch (error) {
            console.error("Submit error", error);
            toast.error(t('messages.saveFail'));
        } finally { setIsSubmitting(false); }
    };
    const SectionHeader = ({ title, icon: Icon }) => (
        <h3 className="text-base md:text-lg font-semibold text-secondary-600 border-b pb-2 flex items-center gap-2">
            {Icon && <Icon size={20} />} {title}
        </h3>
    );

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-4 py-4 md:px-8 md:py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="text-primary-100" /> : <Layers className="text-primary-100" />}
                            {initialData ? t('titles.edit') : t('titles.create')}
                        </h2>
                        <p className="text-primary-100 text-xs md:text-sm mt-1">
                            {initialData ? t('titles.editSubtitle') : t('titles.createSubtitle')}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-primary-600 p-2 rounded-lg transition-colors"><X size={24} /></button>
                </div>
            </div>

            {loadingOptions ? (
                <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary-500" size={40} /></div>
            ) : (
                <form onSubmit={handleSubmit} className="p-4 md:p-6 lg:p-8 space-y-8 md:space-y-10">

                    {/* 1. Translations */}
                    <div className="space-y-6">
                        <SectionHeader title={t('titles.basicInfo')} icon={Globe} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                            {/* English */}
                            <div className="space-y-4">
                                <span className="badge bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{t('badges.english')}</span>
                                <TranslationInput label={t('labels.venueNameEn')} value={formData.translations.en.name} onChange={(e) => handleTranslationChange('en', 'name', e.target.value)} loading={loadEnName} isManual={manualEdits.en.name} onReset={() => resetManualEdit('en', 'name')} error={errors.enName} />
                                <TranslationInput label={t('labels.descriptionEn')} value={formData.translations.en.description} onChange={(e) => handleTranslationChange('en', 'description', e.target.value)} loading={loadEnDesc} isManual={manualEdits.en.description} onReset={() => resetManualEdit('en', 'description')} isTextArea={true} placeholder={t('placeholders.descEn')} />
                                <TranslationInput label={t('labels.addressTextEn')} value={formData.translations.en.address} onChange={(e) => handleTranslationChange('en', 'address', e.target.value)} loading={loadEnAddr} isManual={manualEdits.en.address} onReset={() => resetManualEdit('en', 'address')} />
                            </div>
                            {/* Arabic */}
                            <div className="space-y-4" dir="rtl">
                                <span className="badge bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">{t('badges.arabic')}</span>
                                <TranslationInput label={t('labels.venueNameAr')} value={formData.translations.ar.name} onChange={(e) => handleTranslationChange('ar', 'name', e.target.value)} loading={loadArName} isManual={manualEdits.ar.name} onReset={() => resetManualEdit('ar', 'name')} error={errors.arName} />
                                <TranslationInput label={t('labels.descriptionAr')} value={formData.translations.ar.description} onChange={(e) => handleTranslationChange('ar', 'description', e.target.value)} loading={loadArDesc} isManual={manualEdits.ar.description} onReset={() => resetManualEdit('ar', 'description')} isTextArea={true} placeholder={t('placeholders.descAr')} />
                                <TranslationInput label={t('labels.addressTextAr')} value={formData.translations.ar.address} onChange={(e) => handleTranslationChange('ar', 'address', e.target.value)} loading={loadArAddr} isManual={manualEdits.ar.address} onReset={() => resetManualEdit('ar', 'address')} />
                            </div>
                        </div>
                    </div>

                    {/* 2. Policies */}
                    <div className="space-y-6">
                        <SectionHeader title={t('titles.policies')} icon={Shield} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                            <div className="space-y-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('badges.englishPolicies')}</span>
                                <TranslationInput label={t('labels.rulesEn')} value={formData.translations.en.rules_and_regulations} onChange={(e) => handleTranslationChange('en', 'rules_and_regulations', e.target.value)} loading={loadEnRules} isManual={manualEdits.en.rules_and_regulations} onReset={() => resetManualEdit('en', 'rules_and_regulations')} isTextArea={true} rows={4} placeholder={t('placeholders.rulesEn')} />
                                <TranslationInput label={t('labels.cancelPolicyEn')} value={formData.translations.en.cancellation_policy} onChange={(e) => handleTranslationChange('en', 'cancellation_policy', e.target.value)} loading={loadEnPolicy} isManual={manualEdits.en.cancellation_policy} onReset={() => resetManualEdit('en', 'cancellation_policy')} isTextArea={true} rows={4} placeholder={t('placeholders.policyEn')} />
                            </div>
                            <div className="space-y-4" dir="rtl">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('badges.arabicPolicies')}</span>
                                <TranslationInput label={t('labels.rulesAr')} value={formData.translations.ar.rules_and_regulations} onChange={(e) => handleTranslationChange('ar', 'rules_and_regulations', e.target.value)} loading={loadArRules} isManual={manualEdits.ar.rules_and_regulations} onReset={() => resetManualEdit('ar', 'rules_and_regulations')} isTextArea={true} rows={4} placeholder={t('placeholders.rulesAr')} />
                                <TranslationInput label={t('labels.cancelPolicyAr')} value={formData.translations.ar.cancellation_policy} onChange={(e) => handleTranslationChange('ar', 'cancellation_policy', e.target.value)} loading={loadArPolicy} isManual={manualEdits.ar.cancellation_policy} onReset={() => resetManualEdit('ar', 'cancellation_policy')} isTextArea={true} rows={4} placeholder={t('placeholders.policyAr')} />
                            </div>
                        </div>
                    </div>

                    {/* 3. Location & Contact */}
                    <div className="space-y-6">
                        <SectionHeader title={t('titles.locationContact')} icon={MapPin} />
                        {RoleIsAdmin && (
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">{t('labels.owner')} <span
                                    className="text-red-500">*</span></label>
                                <div className="relative">

                                    <select name="owner" value={formData.owner} onChange={handleChange}
                                            className="w-full pl-3 pr-10 py-2.5 border rounded-lg bg-white outline-none focus:border-primary-500 appearance-none text-sm text-gray-700">
                                        <option value="">{t('placeholders.selectOwner')}</option>
                                        {options.owners.map(owner => (<option key={owner.id}
                                                                              value={owner.id}>{owner.contact_name || owner.user_info?.name || t('options.unknown')} - {owner.pitch_name || t('options.noPitch')} ({owner.email})</option>))}
                                    </select>
                                    <ChevronDown size={16}
                                                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
                                </div>
                                {errors.owner && <p className="text-red-500 text-xs mt-1">{errors.owner}</p>}
                            </div>
                        )}


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">{t('labels.city')} <span
                                    className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select name="city" value={formData.city} onChange={handleChange}
                                            className="w-full pl-3 pr-10 py-2.5 border rounded-lg bg-white outline-none focus:border-primary-500 appearance-none text-sm text-gray-700">
                                        <option value="">{t('placeholders.selectCity')}</option>
                                        {options.cities.map((city, index) => (
                                            <option key={index} value={city.value}>{city.label}</option>))}
                                    </select>
                                    <ChevronDown size={16}
                                                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
                                </div>
                                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                            </div>
                            <MainInput label={t('labels.fullAddress')} name="address" value={formData.address} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MainInput label={t('labels.contactName')} name="contact_name" value={formData.contact_name} onChange={handleChange} icon={User} />
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">{t('labels.phone')}</label>
                                <MuiPhoneInput value={formData.phone_number} onChange={(phone) => setFormData(prev => ({ ...prev, phone_number: phone }))} error={!!errors.phone_number} />
                                {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}
                            </div>
                            <MainInput label={t('labels.email')} name="email" type="email" value={formData.email} onChange={handleChange} icon={Mail} />
                        </div>

                        {/* GOOGLE MAPS SECTION */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Globe size={16} /> {t('labels.mapLocation')}
                                </label>
                                {/* SEARCH BOX */}
                                {isLoaded && (
                                    <div className="relative z-10 w-full">
                                        <Autocomplete
                                            onLoad={onLoadAutocomplete}
                                            onPlaceChanged={onPlaceChanged}
                                        >
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder={t('placeholders.searchLocation') || "Search for a location"}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                                />
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                        </Autocomplete>
                                    </div>
                                )}
                            </div>

                            <div className="border rounded-xl overflow-hidden shadow-sm h-[300px] md:h-[400px] w-full relative">
                                {isLoaded ? (
                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={formData.latitude && formData.longitude ? { lat: Number(formData.latitude), lng: Number(formData.longitude) } : DEFAULT_CENTER}
                                        zoom={formData.latitude ? 15 : 10}
                                        onLoad={onLoadMap}
                                        onUnmount={onUnmountMap}
                                        onClick={handleMapClick}
                                    >
                                        {formData.latitude && formData.longitude && (
                                            <Marker
                                                position={{ lat: Number(formData.latitude), lng: Number(formData.longitude) }}
                                                animation={2} // DROP animation
                                            />
                                        )}
                                    </GoogleMap>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                        <Loader2 className="animate-spin text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-gray-50 p-4 rounded-lg">
                                <MainInput label={t('labels.latitude')} name="latitude" value={formData.latitude} onChange={handleChange} icon={Crosshair} readOnly placeholder={t('placeholders.selectMap')} />
                                <MainInput label={t('labels.longitude')} name="longitude" value={formData.longitude} onChange={handleChange} icon={Crosshair} readOnly placeholder={t('placeholders.selectMap')} />
                            </div>
                        </div>
                    </div>

                    {/* 4. Details */}
                    <div className="space-y-6">
                        <SectionHeader title={t('titles.details')} icon={Clock} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">{t('labels.venueType')}</label>
                                <div className="relative">
                                    <select name="venue_type" value={formData.venue_type} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none focus:border-primary-500 bg-white appearance-none">
                                        <option value="">{t('placeholders.selectType')}</option>
                                        <option value="indoor">{t('options.indoor')}</option>
                                        <option value="outdoor">{t('options.outdoor')}</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                                {errors.venue_type && <p className="text-red-500 text-xs mt-1">{errors.venue_type}</p>}
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">{t('labels.surfaceType')}</label>
                                <div className="relative">
                                    <select name="surface_type" value={formData.surface_type} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none focus:border-primary-500 bg-white appearance-none">
                                        <option value="">{t('placeholders.selectSurface')}</option>
                                        {options.surfaceTypes.map(st => (<option key={st.id} value={st.id}>{st.translations?.en?.name || st.name}</option>))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                            <MainInput label={t('labels.pricePerHour')} name="price_per_hour" type="number" value={formData.price_per_hour} onChange={handleChange} icon={DollarSign} error={errors.price_per_hour} />
                            <MainInput label={t('labels.availableFrom')} name="available_from" type="time" value={formData.available_from} onChange={handleChange} />
                            <MainInput label={t('labels.availableTo')} name="available_to" type="time" value={formData.available_to} onChange={handleChange} />
                            <MainInput max={7} min={1} label={t('labels.advanceDays')} name="advance_booking_days" type="number" value={formData.advance_booking_days} onChange={handleChange} icon={Calendar} />
                            <MainInput label={t('labels.minCancellation')} name="minimum_cancellation_hours" type="number" value={formData.minimum_cancellation_hours} onChange={handleChange} icon={AlertCircle} />
                        </div>
                        <div className="border border-primary-100 bg-primary-50 flex flex-wrap gap-4 md:gap-8 p-6  rounded-lg ">
                            <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" name="allow_split_booking" checked={formData.allow_split_booking} onChange={handleChange} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" /><span className="text-sm font-medium text-gray-700">{t('toggles.splitBooking')}</span></label>
                            <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" name="allow_recurring_booking" checked={formData.allow_recurring_booking} onChange={handleChange} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" /><span className="text-sm font-medium text-gray-700">{t('toggles.recurringBooking')}</span></label>
                            <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" /><span className="text-sm font-medium text-gray-700">{t('toggles.isActive')}</span></label>
                        </div>
                    </div>

                    {/* 5. Features */}
                    <div className="space-y-6">
                        <SectionHeader title={t('titles.features')} icon={CheckSquare} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">{t('labels.playTypes')}</label>
                            <div className="flex flex-wrap gap-2">
                                {options.playTypes.map(type => (
                                    <button key={type.id} type="button" onClick={() => handleMultiSelectToggle('venue_play_type', type.id)} className={`px-4 py-2 rounded-full text-sm border transition-all ${formData.venue_play_type.includes(type.id) ? 'bg-primary-100 border-primary-500 text-primary-700 font-bold shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{type.translations?.en?.name || type.name}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">{t('labels.amenities')}</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {options.amenities.map(item => {
                                    const isSelected = formData.amenities.includes(item.id);
                                    return (
                                        <div key={item.id} onClick={() => handleMultiSelectToggle('amenities', item.id)} className={`cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-all select-none ${isSelected ? 'bg-primary-50 border-primary-500 shadow-sm' : 'bg-white border-gray-200 hover:border-primary-200 hover:bg-gray-50'}`}>
                                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{isSelected && <Check size={14} strokeWidth={3} />}</div>
                                            <span className={`text-sm font-medium ${isSelected ? 'text-primary-800' : 'text-gray-600'}`}>{item.translations?.name || item.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">{t('labels.closedDays')}</label>
                            <div className="flex flex-wrap gap-2">
                                {options.days.map(day => (
                                    <button key={day.id} type="button" onClick={() => handleMultiSelectToggle('closed_days', day.id)} className={`px-4 py-2 rounded-lg text-sm border transition-all ${formData.closed_days.includes(day.id) ? 'bg-red-50 border-red-500 text-red-700 font-bold shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{day.translations?.en?.name || day.day}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 6. Add-ons */}
                    <div className="space-y-6">
                        <SectionHeader title={t('titles.addons')} icon={Layers} />
                        <div className="space-y-4 bg-gray-50 p-4 md:p-5 rounded-lg border border-gray-200">
                            {options.addons.map(addon => {
                                const isSelected = formData.venue_addons.some(a => a.addon === addon.id);
                                const currentData = formData.venue_addons.find(a => a.addon === addon.id) || {};
                                return (
                                    <div key={addon.id} className={`p-4 rounded-xl border transition-all ${isSelected ? 'bg-white border-primary-300 shadow-sm ring-1 ring-primary-100' : 'bg-white/50 border-gray-200'}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="pt-1"><input type="checkbox" checked={isSelected} onChange={(e) => handleAddonToggle(addon.id, e.target.checked)} className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 border-gray-300 cursor-pointer" /></div>
                                            <div className="flex-1 w-full">
                                                <h4 className={`font-semibold text-base ${isSelected ? 'text-primary-800' : 'text-gray-700'}`}>{addon.translations?.en?.name || addon.name}</h4>
                                                {isSelected && (
                                                    <div className="flex flex-col sm:flex-row gap-4 mt-4 animate-fadeIn">
                                                        <div className="w-full sm:w-1/2"><MainInput label={t('labels.price')} type="number" icon={DollarSign} value={currentData.price || ''} onChange={(e) => handleAddonDetailChange(addon.id, 'price', e.target.value)} placeholder={t('placeholders.pricePlaceholder')} /></div>
                                                        <div className="w-full sm:w-1/2"><MainInput label={t('labels.minNumber')} type="number" value={currentData.min_number || 0} onChange={(e) => handleAddonDetailChange(addon.id, 'min_number', e.target.value)} /></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 7. Images */}
                    <div className="space-y-4">
                        <SectionHeader title={t('titles.images')} icon={ImageIcon}/>
                        <label
                            className="aspect-square w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-gray-300 hover:border-primary-500 cursor-pointer bg-white hover:bg-primary-50 hover:shadow-sm">
                            <input type="file" hidden multiple ref={fileInputRef} accept="image/*"
                                   onChange={handleImageSelect}/>
                            <div className="p-3 bg-primary-100 rounded-full mb-3 text-primary-600"><UploadCloud
                                className="w-6 h-6"/></div>
                            <span
                                className="text-xs text-gray-600 font-semibold">{t('toggles.clickToUpload')}</span><span
                            className="text-[10px] text-gray-400 mt-1">{t('toggles.selectMultiple')}</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                            {formData.images.map((item, index) => {
                                const isObject = typeof item === 'object';
                                const imgSrc = isObject ? item.preview : item;
                                const isUploading = isObject && item.uploading;
                                return (
                                    <div key={index}
                                         className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                                        <img src={imgSrc} alt={`Venue ${index}`}
                                             className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`}/>
                                        {isUploading && (<div
                                            className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <Loader2 className="animate-spin text-white w-8 h-8"/></div>)}
                                        {isObject && !isUploading && item.serverUrl && (<div
                                            className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                                            <Check size={12}/></div>)}
                                        <div
                                            className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all z-20">
                                            <button type="button" onClick={() => removeImage(index)}
                                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform hover:scale-110 transition-transform">
                                                <Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                );
                            })}

                        </div>
                    </div>

                    <div className="md:flex gap-4 pt-6 border-t">
                        <button type="button" onClick={onCancel}
                                className="md:flex items-center justify-center hidden w-full bg-gray-100 hover:bg-gray-200 text-gray-800  font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">{t('buttons.cancel')}
                        </button>
                        <button type="submit" disabled={isSubmitting}
                                className=" flex items-center w-full justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm text-sm md:text-base">{isSubmitting ?
                            <Loader2 size={20} className="animate-spin"/> : <><Save
                                size={20}/> {initialData ? t('buttons.update') : t('buttons.create')}</>}</button>
                        <button type="button" onClick={onCancel}
                                className="flex-1 md:hidden bg-gray-100 w-full mt-3 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">{t('buttons.cancel')}
                        </button>

                    </div>

                </form>
            )}
        </div>
    );
};

export default VenuesForm;