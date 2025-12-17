import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx';
import useAutoTranslation from '../../hooks/useTranslation.js';
import { uploadService } from '../../services/upload/uploadService.js';
import { pitchesService } from '../../services/pitches/pitchesService.js';
import { venuesService } from '../../services/venues/venuesService.js';

import { generateUniqueFileName } from '../../utils/fileUtils';
import { IMAGE_BASE_URL } from '../../utils/ImageBaseURL.js';

import {
    Type, DollarSign, Layers, Save, X, Globe,
    UploadCloud, Trash2, ChevronDown, Loader2, Edit,
    Image as ImageIcon, Check, RefreshCw, CheckSquare
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// --- REUSABLE TRANSLATION COMPONENT ---
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
                              placeholder,
                              forcedDir = null // 'ltr' or 'rtl' specific override
                          }) => {
    const { t, i18n } = useTranslation('pitchForm');
    const isRTL = i18n.language === 'ar';

    // Determine input direction: forcedDir takes precedence, then app language
    const inputDir = forcedDir || (isRTL ? 'rtl' : 'ltr');

    const getButtonPosition = () => {
        if (forcedDir === 'rtl' || (isRTL )) return 'left-0 ml-1';
        return 'right-0 mr-1';
    };

    const getLoadingPosition = () => {
        if (forcedDir === 'rtl' || (isRTL )) return 'left-0 ml-1';
        return 'right-0 mr-1';
    };

    return (
        <div className="relative w-full">
            {isTextArea ? (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <textarea
                        rows={rows}
                        className={`w-full p-3 border rounded-lg bg-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm ${error ? 'border-red-500' : 'border-gray-300'} ${inputDir === 'rtl' ? 'text-right' : 'text-left'}`}
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                        dir={inputDir}
                    />
                </div>
            ) : (
                <MainInput
                    label={label}
                    value={value}
                    onChange={onChange}
                    error={error}
                    dir={inputDir}
                />
            )}

            {loading && !isManual && (
                <span className={`absolute top-0 ${getLoadingPosition()} text-xs text-blue-500 mt-2 animate-pulse`}>
                    {t('basic_info.translating')}
                </span>
            )}

            {isManual && (
                <button
                    type="button"
                    onClick={onReset}
                    className={`absolute top-0 ${getButtonPosition()} mt-1 text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100 z-10 transition-colors`}
                    title={t('basic_info.reset_auto_tooltip')}
                >
                    <RefreshCw size={10} /> {t('basic_info.auto_btn')}
                </button>
            )}
        </div>
    );
};

const PitchesForm = ({ venuesData, pitchesList, onCancel, onSuccess, pitchDetails = null }) => {
    const { t, i18n } = useTranslation('pitchForm');
    const isRTL = i18n.language === 'ar';
    const initialData = pitchDetails?.data;

    // --- STATE ---
    const [formData, setFormData] = useState({
        translations: {
            en: { name: '' },
            ar: { name: '' }
        },
        price_per_hour: '',
        size: '',
        venue: '',
        parent_pitch: '',
        is_active: true,
        image: null
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- VENUES STATE ---
    const [fetchedVenues, setFetchedVenues] = useState([]);
    const [isLoadingVenues, setIsLoadingVenues] = useState(false);

    // --- PITCHES STATE ---
    const [fetchedPitches, setFetchedPitches] = useState([]);
    const [isLoadingPitches, setIsLoadingPitches] = useState(false);

    // Translation State
    const [activeField, setActiveField] = useState(null);
    const [manualEdits, setManualEdits] = useState({
        en: { name: false },
        ar: { name: false }
    });

    const fileInputRef = useRef(null);

    // --- HELPER: PROCESS SERVER IMAGES ---
    const processImage = (imagePath) => {
        if (!imagePath) return null;
        return imagePath.startsWith('http') ? imagePath : `${IMAGE_BASE_URL}${imagePath}`;
    };

    // --- 1. FETCH VENUES IF PROP IS EMPTY ---
    useEffect(() => {
        if (!venuesData || venuesData.length === 0) {
            const fetchVenues = async () => {
                setIsLoadingVenues(true);
                try {
                    const response = await venuesService.getAllVenues({ page_limit: 1000 });
                    const rawData = response.results || (Array.isArray(response) ? response : []);

                    const formattedOptions = rawData.map(v => ({
                        value: v.id,
                        label: i18n.language === 'ar'
                            ? (v.translations?.ar?.name || v.translations?.name || v.name)
                            : (v.translations?.en?.name || v.translations?.name || v.name) || `Venue #${v.id}`
                    }));

                    setFetchedVenues(formattedOptions);
                } catch (error) {
                    console.error("Failed to fetch venues", error);
                    toast.error(t('messages.load_venues_error'));
                } finally {
                    setIsLoadingVenues(false);
                }
            };
            fetchVenues();
        }
    }, [venuesData, i18n.language, t]);

    // --- 2. FETCH PITCHES IF PROP IS EMPTY ---
    useEffect(() => {
        if (!pitchesList || pitchesList.length === 0) {
            const fetchPitches = async () => {
                setIsLoadingPitches(true);
                try {
                    const response = await pitchesService.getAllPitchess({ page_limit: 1000 });
                    const rawData = response.results || (Array.isArray(response) ? response : []);

                    const formattedOptions = rawData.map(p => ({
                        value: p.id,
                        label: i18n.language === 'ar'
                            ? (p.translations?.ar?.name || p.translations?.name || p.name)
                            : (p.translations?.en?.name || p.translations?.name || p.name) || `Pitch #${p.id}`
                    }));

                    setFetchedPitches(formattedOptions);
                } catch (error) {
                    console.error("Failed to fetch pitches", error);
                } finally {
                    setIsLoadingPitches(false);
                }
            };
            fetchPitches();
        }
    }, [pitchesList, i18n.language]);

    // Determine which lists to use
    const displayVenues = (venuesData && venuesData.length > 0) ? venuesData : fetchedVenues;
    const displayPitches = (pitchesList && pitchesList.length > 0) ? pitchesList : fetchedPitches;

    // --- POPULATE FORM IF EDITING ---
    useEffect(() => {
        if (initialData) {
            setFormData({
                translations: {
                    en: { name: initialData.translations?.en?.name || '' },
                    ar: { name: initialData.translations?.ar?.name || '' }
                },
                price_per_hour: initialData.price_per_hour || '',
                size: initialData.size ? String(initialData.size) : '',
                venue: initialData.venue || '',
                parent_pitch: initialData.parent_pitch || '',
                is_active: initialData.is_active ?? true,
                image: initialData.image ? {
                    id: 'initial_img',
                    preview: processImage(initialData.image),
                    serverUrl: initialData.image,
                    uniqueName: initialData.image,
                    uploading: false
                } : null
            });

            setManualEdits({
                en: { name: true },
                ar: { name: true }
            });
        }
    }, [initialData]);

    // --- TRANSLATION HOOKS ---
    const { translatedText: arName, loading: loadArName } = useAutoTranslation(activeField === 'en' ? formData.translations.en.name : "", 'ar');
    const { translatedText: enName, loading: loadEnName } = useAutoTranslation(activeField === 'ar' ? formData.translations.ar.name : "", 'en');

    const useSyncTranslation = (targetLang, field, text) => {
        useEffect(() => {
            const sourceLang = targetLang === 'en' ? 'ar' : 'en';
            if (activeField === sourceLang && text && !manualEdits[targetLang][field]) {
                setFormData(prev => ({
                    ...prev,
                    translations: {
                        ...prev.translations,
                        [targetLang]: { ...prev.translations[targetLang], [field]: text }
                    }
                }));
            }
        }, [text, activeField, manualEdits, targetLang, field]);
    };

    useSyncTranslation('ar', 'name', arName);
    useSyncTranslation('en', 'name', enName);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleTranslationChange = (lang, field, value) => {
        setActiveField(lang);
        setManualEdits(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: true } }));
        setFormData(prev => ({
            ...prev,
            translations: {
                ...prev.translations,
                [lang]: { ...prev.translations[lang], [field]: value }
            }
        }));
        if (lang === 'en' && errors.name) setErrors(prev => ({ ...prev, name: '' }));
        if (lang === 'ar' && errors.name_ar) setErrors(prev => ({ ...prev, name_ar: '' }));
    };

    const resetManualEdit = (lang, field) => {
        setManualEdits(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: false } }));
        const otherLang = lang === 'en' ? 'ar' : 'en';
        setActiveField(otherLang);
    };

    // --- IMAGE UPLOAD LOGIC ---
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            toast.error(t('images.valid_image_error'));
            return;
        }

        const newImage = {
            id: Date.now() + Math.random(),
            file,
            preview: URL.createObjectURL(file),
            uploading: true,
            serverUrl: null,
            uniqueName: null
        };

        setFormData(prev => ({ ...prev, image: newImage }));
        setErrors(prev => ({ ...prev, image: '' }));

        const uploadImage = async () => {
            try {
                const uniqueName = generateUniqueFileName(file.name);
                const result = await uploadService.processFullUpload(file, uniqueName);

                setFormData(prev => ({
                    ...prev,
                    image: {
                        ...prev.image,
                        serverUrl: result.url || uniqueName,
                        uniqueName: uniqueName,
                        uploading: false
                    }
                }));
                toast.success(t('images.upload_success'));
            } catch (error) {
                console.error("Image upload failed", error);
                toast.error(t('images.upload_fail'));
                setFormData(prev => ({ ...prev, image: null }));
            }
        };

        uploadImage();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: null }));
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.image?.uploading) {
            toast.warning(t('images.wait_upload'));
            return;
        }

        const newErrors = {};
        if (!formData.translations.en.name) newErrors.name = t('validation.name_en_required');
        if (!formData.translations.ar.name) newErrors.name_ar = t('validation.name_ar_required');
        if (!formData.price_per_hour) newErrors.price_per_hour = t('validation.price_required');
        if (!formData.size) newErrors.size = t('validation.size_required');
        if (!formData.venue) newErrors.venue = t('validation.venue_required');

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            let finalImage = null;
            if (formData.image) {
                finalImage = formData.image.uniqueName || formData.image.serverUrl;
            }

            const payload = {
                translations: {
                    en: { name: formData.translations.en.name },
                    ar: { name: formData.translations.ar.name }
                },
                is_active: formData.is_active,
                price_per_hour: parseFloat(formData.price_per_hour).toFixed(2),
                size: parseInt(formData.size, 10),
                venue: parseInt(formData.venue, 10),
                parent_pitch: formData.parent_pitch ? parseInt(formData.parent_pitch, 10) : null,
                image: finalImage
            };

            if (initialData) {
                await pitchesService.updatePitch(initialData.id, payload);
            } else {
                await pitchesService.addPitch(payload);
            }

            if (onSuccess) onSuccess();
            toast.success(initialData ? t('messages.update_success') : t('messages.create_success'));

        } catch (error) {
            console.error("Submission failed", error);
            const msg = error.response?.data?.message || t('messages.generic_error');
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const sizeOptions = [
        { label: '5 * 5', value: '5' }, { label: '6 * 6', value: '6' },
        { label: '7 * 7', value: '7' }, { label: '8 * 8', value: '8' },
        { label: '9 * 9', value: '9' }, { label: '10 * 10', value: '10' },
        { label: '11 * 11', value: '11' }, { label: '12 * 12', value: '12' },
    ];

    const SectionHeader = ({ title, icon: Icon }) => (
        <h3 className="text-base md:text-lg font-semibold text-secondary-600 border-b pb-2 flex items-center gap-2">
            {Icon && <Icon size={20} />} {title}
        </h3>
    );

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-4 py-4 md:px-8 md:py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="text-primary-100" /> : <Layers className="text-primary-100" />}
                            {initialData ? t('header.edit_title') : t('header.create_title')}
                        </h2>
                        <p className="text-primary-100 text-xs md:text-sm mt-1">
                            {initialData ? t('header.edit_desc') : t('header.create_desc')}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-primary-600 p-2 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 lg:p-8 space-y-8 md:space-y-10">

                {/* 1. Translations */}
                <div className="space-y-6">
                    <SectionHeader title={t('basic_info.title')} icon={Globe} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        <div className="space-y-4">
                            <span className="badge bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{t('basic_info.badge_en')}</span>
                            <TranslationInput
                                label={t('basic_info.name_en_label')}
                                value={formData.translations.en.name}
                                onChange={(e) => handleTranslationChange('en', 'name', e.target.value)}
                                loading={loadEnName}
                                isManual={manualEdits.en.name}
                                onReset={() => resetManualEdit('en', 'name')}
                                error={errors.name}
                                forcedDir="ltr"
                            />
                        </div>
                        <div className="space-y-4" dir="rtl">
                            <span className="badge bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">{t('basic_info.badge_ar')}</span>
                            <TranslationInput
                                label={t('basic_info.name_ar_label')}
                                value={formData.translations.ar.name}
                                onChange={(e) => handleTranslationChange('ar', 'name', e.target.value)}
                                loading={loadArName}
                                isManual={manualEdits.ar.name}
                                onReset={() => resetManualEdit('ar', 'name')}
                                error={errors.name_ar}
                                forcedDir="rtl"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Image Upload */}
                <div className="space-y-4">
                    <SectionHeader title={t('images.title')} icon={ImageIcon} />
                    <div className="flex flex-col md:flex-row gap-4">
                        {formData.image && (
                            <div className="relative group aspect-square w-full md:w-64 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                                <img
                                    src={formData.image.preview}
                                    alt="Pitch"
                                    className={`w-full h-full object-cover transition-opacity ${formData.image.uploading ? 'opacity-50' : 'opacity-100'}`}
                                />
                                {formData.image.uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Loader2 className="animate-spin text-white w-8 h-8" />
                                    </div>
                                )}
                                {!formData.image.uploading && (formData.image.serverUrl || formData.image.uniqueName) && (
                                    <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-green-500 text-white rounded-full p-1`}>
                                        <Check size={14} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform hover:scale-110 transition-transform"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                        {!formData.image && (
                            <label className="aspect-square w-full h-48  border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-gray-300 hover:border-primary-500 cursor-pointer bg-white hover:bg-primary-50 hover:shadow-sm">
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                                <div className="p-3 bg-primary-100 rounded-full mb-3 text-primary-600">
                                    <UploadCloud className="w-8 h-8" />
                                </div>
                                <span className="text-sm text-gray-600 font-semibold">{t('images.upload_label')}</span>
                                <span className="text-xs text-gray-500 mt-1">{t('images.click_to_select')}</span>
                            </label>
                        )}
                    </div>
                </div>

                {/* 3. Details */}
                <div className="space-y-6">
                    <SectionHeader title={t('details.title')} icon={Type} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MainInput
                            label={t('details.price_label')}
                            name="price_per_hour"
                            type="number"
                            value={formData.price_per_hour}
                            onChange={handleChange}
                            error={errors.price_per_hour}
                            icon={DollarSign}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">{t('details.size_label')}</label>
                            <div className="relative">
                                <select
                                    name="size"
                                    value={formData.size}
                                    onChange={handleChange}
                                    className={`w-full ${isRTL ? 'pr-3 pl-10' : 'pl-3 pr-10'} py-2.5 border rounded-lg bg-white outline-none focus:border-primary-500 appearance-none text-sm text-gray-700`}
                                    dir="ltr" // Keep sizes LTR (numbers) or remove to follow system
                                >
                                    <option value="">{t('details.select_size')}</option>
                                    {sizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown size={16} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none`} />
                            </div>
                            {errors.size && <p className="text-red-500 text-xs mt-1">{errors.size}</p>}
                        </div>

                        {/* VENUE DROPDOWN (Auto-fetched) */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                {t('details.venue_label')}
                                {isLoadingVenues && <Loader2 size={12} className="animate-spin text-primary-500" />}
                            </label>
                            <div className="relative">
                                <select
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleChange}
                                    disabled={isLoadingVenues}
                                    className={`w-full ${isRTL ? 'pr-3 pl-10' : 'pl-3 pr-10'} py-2.5 border rounded-lg bg-white outline-none focus:border-primary-500 appearance-none text-sm text-gray-700 disabled:bg-gray-50`}
                                >
                                    <option value="">
                                        {isLoadingVenues ? t('details.loading_venues') : t('details.select_venue')}
                                    </option>
                                    {displayVenues && displayVenues.map((item, index) => (
                                        <option key={index} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none`} />
                            </div>
                            {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
                        </div>

                        {/* PARENT PITCH DROPDOWN (Auto-fetched) */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                {t('details.parent_pitch_label')}
                                {isLoadingPitches && <Loader2 size={12} className="animate-spin text-primary-500" />}
                            </label>
                            <div className="relative">
                                <select
                                    name="parent_pitch"
                                    value={formData.parent_pitch}
                                    onChange={handleChange}
                                    disabled={isLoadingPitches}
                                    className={`w-full ${isRTL ? 'pr-3 pl-10' : 'pl-3 pr-10'} py-2.5 border rounded-lg bg-white outline-none focus:border-primary-500 appearance-none text-sm text-gray-700 disabled:bg-gray-50`}
                                >
                                    <option value="">
                                        {isLoadingPitches ? t('details.loading_pitches') : t('details.select_parent_pitch_optional')}
                                    </option>
                                    {displayPitches && displayPitches
                                        // Prevent self-selection if editing
                                        .filter(p => p.value !== initialData?.id)
                                        .map((item, index) => <option key={index} value={item.value}>{item.label}</option>)}
                                </select>
                                <ChevronDown size={16} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Settings */}
                <div className="space-y-6">
                    <SectionHeader title={t('settings.title')} icon={CheckSquare} />
                    <div className="border border-primary-100 bg-primary-50 flex flex-wrap gap-4 md:gap-8 p-6 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
                            <span className="text-sm font-medium text-gray-700">{t('settings.is_active')}</span>
                        </label>

                    </div>
                </div>

                {/* Buttons */}
                <div className="md:flex gap-4 pt-6 border-t">
                    <button type="button" onClick={onCancel}
                            className="md:flex items-center justify-center hidden w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">
                        {t('buttons.cancel')}
                    </button>
                    <button type="submit" disabled={isSubmitting || formData.image?.uploading}
                            className="flex items-center w-full justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm text-sm md:text-base">
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {initialData ? t('buttons.update') : t('buttons.save')}</>}
                    </button>
                    <button type="button" onClick={onCancel}
                            className="flex-1 md:hidden bg-gray-100 w-full mt-3 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">
                        {t('buttons.cancel')}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default PitchesForm;