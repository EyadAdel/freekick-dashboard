import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx';
import useTranslation from '../../hooks/useTranslation.js';
import { uploadService } from '../../services/upload/uploadService.js';
import { venuesService } from '../../services/venues/venuesService.js';
import { amenitiesService } from '../../services/amenities/amenitiesService.js';
import { addonsService } from '../../services/addons/addonsService.js';
import { venueSportsService } from '../../services/venueSports/venueSportsService.js';
import { surfaceTypesService } from '../../services/surfaceTypes/surfaceTypesService.js';
import { daysOfWeekService } from '../../services/daysOfWeek/daysOfWeekService.js';
import { stuffTypeListService } from '../../services/stuff/stuffService.js';
import { citiesListService } from '../../services/citiesList/citiesListService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';

// --- LEAFLET IMPORTS ---
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- ICONS & UI ---
import {
    MapPin, Phone, Mail, User, Clock,
    Layers, Save, X, Globe, UploadCloud, Trash2,
    CheckSquare, DollarSign, Loader2, Edit, Image as ImageIcon,
    Shield, Check, ChevronDown, Crosshair, Calendar, AlertCircle, Map as MapIcon
} from 'lucide-react';
import { toast } from 'react-toastify';

// --- CONFIGURATION ---
// ⚠️ IMPORTANT: Replace this with your actual backend media URL
const MEDIA_BASE_URL = 'https://api.active.sa/media/';

// --- LEAFLET ICON FIX ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- MAP THEMES ---
const MAP_THEMES = {
    standard: {
        name: "Standard",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    },
    satellite: {
        name: "Satellite",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    },
    dark: {
        name: "Dark Mode",
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    },
    light: {
        name: "Light Mode",
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    }
};

// --- MAP CLICK HELPER ---
const LocationMarker = ({ setFormData }) => {
    useMapEvents({
        click(e) {
            setFormData(prev => ({
                ...prev,
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
            }));
        },
    });
    return null;
};

// Default Center (Abu Dhabi)
const DEFAULT_CENTER = [24.4539, 54.3773];

const VenuesForm = ({ onCancel, onSuccess, initialData = null }) => {

    // --- STATE ---
    const [mapTheme, setMapTheme] = useState('standard');

    const [formData, setFormData] = useState({
        translations: {
            en: { name: "", description: "", address: "", rules_and_regulations: "", cancellation_policy: "" },
            ar: { name: "", description: "", address: "", rules_and_regulations: "", cancellation_policy: "" }
        },
        owner: "",
        city: "",
        address: "",
        contact_name: "",
        phone_number: "",
        email: "",
        venue_type: "",
        surface_type: "",
        price_per_hour: "",
        advance_booking_days: "",
        minimum_cancellation_hours: "",
        latitude: "",
        longitude: "",
        available_from: "",
        available_to: "",
        allow_split_booking: false,
        allow_recurring_booking: false,
        is_active: false,
        images: [],
        venue_play_type: [],
        amenities: [],
        closed_days: [],
        venue_addons: []
    });

    const [options, setOptions] = useState({
        amenities: [],
        playTypes: [],
        surfaceTypes: [],
        addons: [],
        days: [],
        owners: [],
        cities: []
    });

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);

    // Translation
    const [activeField, setActiveField] = useState(null);
    const fileInputRef = useRef(null);

    // --- INITIAL DATA & FETCHING ---
    useEffect(() => {
        const fetchAllOptions = async () => {
            try {
                const [amenitiesRes, playTypesRes, surfaceRes, addonsRes, daysRes, ownersRes] = await Promise.all([
                    amenitiesService.getAllAmenities(),
                    venueSportsService.getAll({ all_languages: true }),
                    surfaceTypesService.getAllSurfaceTypes(),
                    addonsService.getAll({ all_languages: true }),
                    daysOfWeekService.getAll({ all_languages: true }),
                    stuffTypeListService.getStuffListByType('pitch_owner')
                ]);

                // Load Cities
                const citiesRes = citiesListService.getAll();

                setOptions({
                    amenities: amenitiesRes.results || amenitiesRes || [],
                    playTypes: playTypesRes.results || playTypesRes || [],
                    surfaceTypes: surfaceRes.results || surfaceRes || [],
                    addons: addonsRes.results || addonsRes || [],
                    days: daysRes.results || daysRes || [],
                    owners: ownersRes.results || ownersRes || [],
                    cities: citiesRes
                });
            } catch (error) {
                console.error("Failed to load form options", error);
                toast.error("Failed to load configuration data.");
            } finally {
                setLoadingOptions(false);
            }
        };
        fetchAllOptions();
    }, []);

    // --- POPULATE FORM DATA (EDIT MODE) ---
    useEffect(() => {
        // Handle "data" wrapper if present
        const data = initialData?.data || initialData;

        if (data) {
            // Helper to handle image URLs
            const processImage = (imgObj) => {
                if (!imgObj) return null;
                // If it's just a string
                if (typeof imgObj === 'string') return imgObj.startsWith('http') ? imgObj : `${MEDIA_BASE_URL}${imgObj}`;
                // If it's an object { id: 99, image: "filename.jpg" }
                if (typeof imgObj === 'object' && imgObj.image) {
                    return imgObj.image.startsWith('http') ? imgObj.image : `${MEDIA_BASE_URL}${imgObj.image}`;
                }
                return null;
            };

            setFormData({
                translations: {
                    en: {
                        name: data.translations?.en?.name || "",
                        description: data.translations?.en?.description || "",
                        address: data.translations?.en?.address || "",
                        rules_and_regulations: data.translations?.en?.rules_and_regulations || "",
                        cancellation_policy: data.translations?.en?.cancellation_policy || ""
                    },
                    ar: {
                        name: data.translations?.ar?.name || "",
                        description: data.translations?.ar?.description || "",
                        address: data.translations?.ar?.address || "",
                        rules_and_regulations: data.translations?.ar?.rules_and_regulations || "",
                        cancellation_policy: data.translations?.ar?.cancellation_policy || ""
                    }
                },

                // Basic Info
                owner: data.owner?.id || data.owner || "",
                city: data.city || "",
                address: data.translations?.en?.address || data.address || "",
                contact_name: data.contact_name || data.owner_info?.contact_name || "",
                phone_number: data.phone_number || data.owner_info?.contact_phone || "",
                email: data.email || data.owner_info?.email || "",

                // Details
                venue_type: data.venue_type || "",
                surface_type: data.surface_type?.id || data.surface_type || "",
                price_per_hour: data.price_per_hour || "",
                advance_booking_days: data.advance_booking_days || "",
                minimum_cancellation_hours: data.minimum_cancellation_hours || "",
                available_from: data.available_from || "",
                available_to: data.available_to || "",

                // Booleans
                allow_split_booking: data.allow_split_booking ?? false,
                allow_recurring_booking: data.allow_recurring_booking ?? false,
                is_active: data.is_active ?? false,

                // Location
                latitude: data.latitude || "",
                longitude: data.longitude || "",

                // Images: Map [{id:99, image:"file.jpg"}] -> ["url..."]
                images: data.images ? data.images.map(processImage).filter(Boolean) : [],

                // Play Types: Map [{id:1, ...}, {id:2...}] -> [1, 2]
                venue_play_type: data.venue_play_type?.map(i => (typeof i === 'object' ? i.id : i)) || [],

                // Amenities: Map [5] -> [5] (or objects if API changes)
                amenities: data.amenities?.map(i => (typeof i === 'object' ? i.id : i)) || [],

                // Closed Days: Map [6, 7] -> [6, 7]
                closed_days: data.closed_days?.map(i => (typeof i === 'object' ? i.id : i)) || [],

                // Addons: Map [{ id:113, addon:{id:8...}, price:45 }] -> [{addon:8, price:45...}]
                venue_addons: data.venue_addons?.map(item => ({
                    addon: item.addon?.id || item.addon,
                    price: item.price,
                    min_number: item.min_number
                })) || []
            });
        }
    }, [initialData]);

    // --- TRANSLATION HOOKS ---
    const { translatedText: arName, loading: loadArName } = useTranslation(activeField === 'en' ? formData.translations.en.name : "", 'ar');
    const { translatedText: enName, loading: loadEnName } = useTranslation(activeField === 'ar' ? formData.translations.ar.name : "", 'en');

    useEffect(() => {
        if (activeField === 'en' && arName) {
            setFormData(prev => ({
                ...prev,
                translations: { ...prev.translations, ar: { ...prev.translations.ar, name: arName } }
            }));
        }
    }, [arName, activeField]);

    useEffect(() => {
        if (activeField === 'ar' && enName) {
            setFormData(prev => ({
                ...prev,
                translations: { ...prev.translations, en: { ...prev.translations.en, name: enName } }
            }));
        }
    }, [enName, activeField]);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleTranslationChange = (lang, field, value) => {
        if (field === 'name') setActiveField(lang);
        setFormData(prev => ({
            ...prev,
            translations: {
                ...prev.translations,
                [lang]: { ...prev.translations[lang], [field]: value }
            }
        }));
    };

    const handleMultiSelectToggle = (field, id) => {
        setFormData(prev => {
            const current = prev[field] || [];
            return {
                ...prev,
                [field]: current.includes(id) ? current.filter(x => x !== id) : [...current, id]
            };
        });
    };

    const handleAddonToggle = (addonId, checked) => {
        setFormData(prev => ({
            ...prev,
            venue_addons: checked
                ? [...prev.venue_addons, { addon: addonId, price: "", min_number: 0 }]
                : prev.venue_addons.filter(item => item.addon !== addonId)
        }));
    };

    const handleAddonDetailChange = (addonId, key, value) => {
        setFormData(prev => ({
            ...prev,
            venue_addons: prev.venue_addons.map(item =>
                item.addon === addonId ? { ...item, [key]: value } : item
            )
        }));
    };

    // --- IMAGE HANDLER ---
    const handleImageSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length !== files.length) {
            toast.warning("Some files were skipped because they are not valid images.");
        }
        if (imageFiles.length === 0) return;

        setIsImageUploading(true);
        try {
            const uploadPromises = imageFiles.map(async (file) => {
                const generatedName = generateUniqueFileName(file.name);
                const result = await uploadService.processFullUpload(file, generatedName);
                return result.url || result.key || result.imageUrl;
            });

            const results = await Promise.all(uploadPromises);

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...results]
            }));

            toast.success(`${results.length} image(s) uploaded successfully`);
        } catch (error) {
            console.error("Batch upload failed", error);
            toast.error("Some images failed to upload.");
        } finally {
            setIsImageUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.translations.en.name) newErrors.enName = "English Name is required";
        if (!formData.venue_type) newErrors.venue_type = "Venue Type is required";
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.owner) newErrors.owner = "Owner is required";
        if (!formData.price_per_hour) newErrors.price_per_hour = "Price is required";

        if (isImageUploading) {
            toast.warning("Please wait for images to finish uploading");
            return;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill in required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                // Ensure surface type is null if empty string
                surface_type: formData.surface_type || null,
                price_per_hour: parseFloat(formData.price_per_hour),
                advance_booking_days: parseInt(formData.advance_booking_days) || 0,
                minimum_cancellation_hours: parseInt(formData.minimum_cancellation_hours) || 0,
                // Format Addons to match API expectation (ID only, no objects)
                venue_addons: formData.venue_addons.map(addon => ({
                    addon: addon.addon,
                    price: addon.price.toString(),
                    min_number: parseInt(addon.min_number, 10) || 0
                }))
            };

            const data = initialData?.data || initialData;
            if (data && data.id) {
                await venuesService.updateVenue(data.id, payload);
            } else {
                await venuesService.createVenue(payload);
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Submit error", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const SectionHeader = ({ title, icon: Icon }) => (
        <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2 flex items-center gap-2">
            {Icon && <Icon size={20} />} {title}
        </h3>
    );

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="text-primary-100" /> : <Layers className="text-primary-100" />}
                            {initialData ? "Edit Venue" : "Create New Venue"}
                        </h2>
                        <p className="text-primary-100 text-sm mt-1">
                            {initialData ? "Update venue details" : "Fill in the details for the new venue"}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-primary-600 p-2 rounded-lg">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {loadingOptions ? (
                <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary-500" size={40} /></div>
            ) : (
                <form onSubmit={handleSubmit} className="p-8 space-y-10">

                    {/* 1. Translations */}
                    <div className="space-y-6">
                        <SectionHeader title="Basic Information" icon={Globe} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <span className="badge bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">English</span>
                                <div className="relative">
                                    <MainInput
                                        label="Venue Name (EN)"
                                        value={formData.translations.en.name}
                                        onChange={(e) => handleTranslationChange('en', 'name', e.target.value)}
                                        error={errors.enName}
                                        required
                                    />
                                    {activeField === 'ar' && loadEnName && <span className="absolute top-0 right-0 text-xs text-blue-500 mt-2 animate-pulse">Translating...</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                                    <textarea
                                        rows={3}
                                        className="w-full p-3 border rounded-lg bg-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                                        placeholder="Enter venue description..."
                                        value={formData.translations.en.description}
                                        onChange={(e) => handleTranslationChange('en', 'description', e.target.value)}
                                    />
                                </div>
                                <MainInput label="Address Text (EN)" value={formData.translations.en.address} onChange={(e) => handleTranslationChange('en', 'address', e.target.value)} />
                            </div>

                            <div className="space-y-4" dir="rtl">
                                <span className="badge bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Arabic</span>
                                <div className="relative">
                                    <MainInput
                                        label="Venue Name (AR)"
                                        value={formData.translations.ar.name}
                                        onChange={(e) => handleTranslationChange('ar', 'name', e.target.value)}
                                        error={errors.arName}
                                    />
                                    {activeField === 'en' && loadArName && <span className="absolute top-0 left-0 text-xs text-blue-500 mt-2 animate-pulse">Translating...</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (AR)</label>
                                    <textarea
                                        rows={3}
                                        className="w-full p-3 border rounded-lg bg-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                                        placeholder="أدخل وصف المكان..."
                                        value={formData.translations.ar.description}
                                        onChange={(e) => handleTranslationChange('ar', 'description', e.target.value)}
                                    />
                                </div>
                                <MainInput label="Address Text (AR)" value={formData.translations.ar.address} onChange={(e) => handleTranslationChange('ar', 'address', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* 2. Policies */}
                    <div className="space-y-6">
                        <SectionHeader title="Policies & Rules" icon={Shield} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">English Policies</span>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rules & Regulations (EN)</label>
                                    <textarea
                                        rows={4}
                                        className="w-full p-3 border rounded-lg bg-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                                        placeholder="Enter venue rules..."
                                        value={formData.translations.en.rules_and_regulations}
                                        onChange={(e) => handleTranslationChange('en', 'rules_and_regulations', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy (EN)</label>
                                    <textarea
                                        rows={4}
                                        className="w-full p-3 border rounded-lg bg-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                                        placeholder="Enter cancellation policy..."
                                        value={formData.translations.en.cancellation_policy}
                                        onChange={(e) => handleTranslationChange('en', 'cancellation_policy', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4" dir="rtl">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Arabic Policies</span>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rules & Regulations (AR)</label>
                                    <textarea
                                        rows={4}
                                        className="w-full p-3 border rounded-lg bg-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                                        placeholder="أدخل قواعد المكان..."
                                        value={formData.translations.ar.rules_and_regulations}
                                        onChange={(e) => handleTranslationChange('ar', 'rules_and_regulations', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy (AR)</label>
                                    <textarea
                                        rows={4}
                                        className="w-full p-3 border rounded-lg bg-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                                        placeholder="أدخل سياسة الإلغاء..."
                                        value={formData.translations.ar.cancellation_policy}
                                        onChange={(e) => handleTranslationChange('ar', 'cancellation_policy', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Location & Contact with Map */}
                    <div className="space-y-6">
                        <SectionHeader title="Location & Contact" icon={MapPin} />

                        {/* Owner Dropdown */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Venue Owner <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    name="owner"
                                    value={formData.owner}
                                    onChange={handleChange}
                                    className="w-full pl-3 pr-10 py-2.5 border rounded-lg bg-white outline-none focus:border-primary-500 appearance-none text-sm text-gray-700"
                                >
                                    <option value="">Select Owner</option>
                                    {options.owners.map(owner => (
                                        <option key={owner.id} value={owner.id}>
                                            {owner.contact_name || owner.user_info?.name || 'Unknown'} - {owner.pitch_name || 'No Pitch'} ({owner.email})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            {errors.owner && <p className="text-red-500 text-xs mt-1">{errors.owner}</p>}
                        </div>

                        {/* City Dropdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full pl-3 pr-10 py-2.5 border rounded-lg bg-white outline-none focus:border-primary-500 appearance-none text-sm text-gray-700"
                                    >
                                        <option value="">Select City</option>
                                        {options.cities.map((city, index) => (
                                            <option key={index} value={city.value}>{city.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                            </div>

                            <MainInput label="Full Address (Location)" name="address" value={formData.address} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MainInput label="Contact Name" name="contact_name" value={formData.contact_name} onChange={handleChange} icon={User} />
                            <MainInput label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} icon={Phone} />
                            <MainInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} icon={Mail} />
                        </div>

                        {/* Map Section (Leaflet) */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Globe size={16} /> Select Location on Map
                                </label>

                                {/* Map Theme Select */}
                                <div className="flex items-center gap-2">
                                    <MapIcon size={14} className="text-gray-500" />
                                    <select
                                        className="text-xs border rounded p-1 bg-white focus:border-primary-500 outline-none cursor-pointer"
                                        value={mapTheme}
                                        onChange={(e) => setMapTheme(e.target.value)}
                                    >
                                        {Object.keys(MAP_THEMES).map(key => (
                                            <option key={key} value={key}>{MAP_THEMES[key].name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="border rounded-xl overflow-hidden shadow-sm h-[400px] w-full z-0 relative">
                                <MapContainer
                                    center={formData.latitude ? [formData.latitude, formData.longitude] : DEFAULT_CENTER}
                                    zoom={10}
                                    scrollWheelZoom={true}
                                    style={{ height: '100%', width: '100%' }}
                                    attributionControl={false}
                                >
                                    <TileLayer url={MAP_THEMES[mapTheme].url} />
                                    <LocationMarker setFormData={setFormData} />
                                    {formData.latitude && formData.longitude && (
                                        <Marker position={[formData.latitude, formData.longitude]} />
                                    )}
                                </MapContainer>
                            </div>

                            {/* Coordinates Inputs (Read Only) */}
                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                                <div className="relative">
                                    <MainInput
                                        label="Latitude"
                                        name="latitude"
                                        value={formData.latitude}
                                        onChange={handleChange}
                                        icon={Crosshair}
                                        readOnly
                                        placeholder="Select on map"
                                    />
                                </div>
                                <div className="relative">
                                    <MainInput
                                        label="Longitude"
                                        name="longitude"
                                        value={formData.longitude}
                                        onChange={handleChange}
                                        icon={Crosshair}
                                        readOnly
                                        placeholder="Select on map"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Details */}
                    <div className="space-y-6">
                        <SectionHeader title="Venue Details" icon={Clock} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Venue Type */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Venue Type</label>
                                <div className="relative">
                                    <select name="venue_type" value={formData.venue_type} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none focus:border-primary-500 bg-white appearance-none">
                                        <option value="">Select Type</option>
                                        <option value="indoor">Indoor</option>
                                        <option value="outdoor">Outdoor</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                                {errors.venue_type && <p className="text-red-500 text-xs mt-1">{errors.venue_type}</p>}
                            </div>

                            {/* Surface Type */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Surface Type</label>
                                <div className="relative">
                                    <select name="surface_type" value={formData.surface_type} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none focus:border-primary-500 bg-white appearance-none">
                                        <option value="">Select Surface</option>
                                        {options.surfaceTypes.map(st => (
                                            <option key={st.id} value={st.id}>{st.translations?.en?.name || st.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                            </div>

                            <MainInput
                                label="Price Per Hour"
                                name="price_per_hour"
                                type="number"
                                value={formData.price_per_hour}
                                onChange={handleChange}
                                icon={DollarSign}
                                error={errors.price_per_hour}
                            />

                            <MainInput label="Available From" name="available_from" type="time" value={formData.available_from} onChange={handleChange} />
                            <MainInput label="Available To" name="available_to" type="time" value={formData.available_to} onChange={handleChange} />

                            <MainInput
                                label="Advance Booking Days"
                                name="advance_booking_days"
                                type="number"
                                value={formData.advance_booking_days}
                                onChange={handleChange}
                                icon={Calendar}
                            />

                            <MainInput
                                label="Min Cancellation (Hours)"
                                name="minimum_cancellation_hours"
                                type="number"
                                value={formData.minimum_cancellation_hours}
                                onChange={handleChange}
                                icon={AlertCircle}
                            />
                        </div>

                        <div className="flex flex-wrap gap-4 md:gap-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="allow_split_booking" checked={formData.allow_split_booking} onChange={handleChange} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
                                <span className="text-sm font-medium text-gray-700">Allow Split Booking</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="allow_recurring_booking" checked={formData.allow_recurring_booking} onChange={handleChange} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
                                <span className="text-sm font-medium text-gray-700">Allow Recurring Booking</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
                                <span className="text-sm font-medium text-gray-700">Is Active</span>
                            </label>
                        </div>
                    </div>

                    {/* 5. Features */}
                    <div className="space-y-6">
                        <SectionHeader title="Features & Amenities" icon={CheckSquare} />

                        {/* Play Types */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Venue Play Types</label>
                            <div className="flex flex-wrap gap-2">
                                {options.playTypes.map(type => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => handleMultiSelectToggle('venue_play_type', type.id)}
                                        className={`px-4 py-2 rounded-full text-sm border transition-all ${formData.venue_play_type.includes(type.id)
                                            ? 'bg-primary-100 border-primary-500 text-primary-700 font-bold shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {type.translations?.en?.name || type.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amenities */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {options.amenities.map(item => {
                                    const isSelected = formData.amenities.includes(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleMultiSelectToggle('amenities', item.id)}
                                            className={`
                                                cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-all select-none
                                                ${isSelected
                                                ? 'bg-primary-50 border-primary-500 shadow-sm'
                                                : 'bg-white border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                                            }
                                            `}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                {isSelected && <Check size={14} strokeWidth={3} />}
                                            </div>
                                            <span className={`text-sm font-medium ${isSelected ? 'text-primary-800' : 'text-gray-600'}`}>
                                                {item.translations?.name || item.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Closed Days */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Closed Days</label>
                            <div className="flex flex-wrap gap-2">
                                {options.days.map(day => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => handleMultiSelectToggle('closed_days', day.id)}
                                        className={`px-4 py-2 rounded-lg text-sm border transition-all ${formData.closed_days.includes(day.id)
                                            ? 'bg-red-50 border-red-500 text-red-700 font-bold shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {day.translations?.en?.name || day.day}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 6. Add-ons */}
                    <div className="space-y-6">
                        <SectionHeader title="Add-ons (Optional)" icon={Layers} />
                        <div className="space-y-4 bg-gray-50 p-5 rounded-lg border border-gray-200">
                            {options.addons.map(addon => {
                                const isSelected = formData.venue_addons.some(a => a.addon === addon.id);
                                const currentData = formData.venue_addons.find(a => a.addon === addon.id) || {};

                                return (
                                    <div key={addon.id} className={`p-4 rounded-xl border transition-all ${isSelected ? 'bg-white border-primary-300 shadow-sm ring-1 ring-primary-100' : 'bg-white/50 border-gray-200'}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="pt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => handleAddonToggle(addon.id, e.target.checked)}
                                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 border-gray-300 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-semibold text-base ${isSelected ? 'text-primary-800' : 'text-gray-700'}`}>
                                                    {addon.translations?.en?.name || addon.name}
                                                </h4>
                                                {isSelected && (
                                                    <div className="flex gap-4 mt-4 animate-fadeIn">
                                                        <div className="w-1/2">
                                                            <MainInput
                                                                label="Price"
                                                                type="number"
                                                                icon={DollarSign}
                                                                value={currentData.price || ''}
                                                                onChange={(e) => handleAddonDetailChange(addon.id, 'price', e.target.value)}
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                        <div className="w-1/2">
                                                            <MainInput
                                                                label="Min Number"
                                                                type="number"
                                                                value={currentData.min_number || 0}
                                                                onChange={(e) => handleAddonDetailChange(addon.id, 'min_number', e.target.value)}
                                                            />
                                                        </div>
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
                        <SectionHeader title="Venue Images" icon={ImageIcon} />

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                            {formData.images.map((imgUrl, index) => (
                                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                                    <img src={imgUrl} alt={`Venue ${index}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                                        <button type="button" onClick={() => removeImage(index)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform hover:scale-110 transition-transform">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Upload Button */}
                            <label className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200
                                ${isImageUploading ? 'bg-gray-50 border-gray-300 cursor-wait' : 'border-gray-300 hover:border-primary-500 cursor-pointer bg-white hover:bg-primary-50 hover:shadow-sm'}`}>
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    disabled={isImageUploading}
                                />
                                {isImageUploading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                                        <span className="text-xs text-primary-600 font-medium">Uploading...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-3 bg-primary-100 rounded-full mb-3 text-primary-600">
                                            <UploadCloud className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs text-gray-600 font-semibold">Click to upload</span>
                                        <span className="text-[10px] text-gray-400 mt-1">Select multiple</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t">
                        <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting || isImageUploading} className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm">
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {initialData ? "Update Venue" : "Create Venue"}</>}
                        </button>
                    </div>

                </form>
            )}
        </div>
    );
};

export default VenuesForm;