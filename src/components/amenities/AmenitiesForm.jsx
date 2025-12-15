import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx';
import useAutoTranslation from '../../hooks/useTranslation.js';
import { uploadService } from '../../services/upload/uploadService.js';
import { amenitiesService } from '../../services/amenities/amenitiesService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';
// Updated import based on your instructions
import { getImageUrl } from '../../utils/imageUtils.js';

import {
    Type, Save, X, Globe,
    UploadCloud, Trash2, Loader2, Edit,
    Image as ImageIcon, Check, RefreshCw
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
                              forcedDir = null
                          }) => {
    // Access amenities namespace for internal labels like "Translating..."
    const { i18n, t } = useTranslation('amenitiesForm');
    const isRTL = i18n.language === 'ar';

    const inputDir = forcedDir || (isRTL ? 'rtl' : 'ltr');

    const getButtonPosition = () => {
        if (forcedDir === 'rtl' || (isRTL)) return 'left-0 ml-1';
        return 'right-0 mr-1';
    };

    const getLoadingPosition = () => {
        if (forcedDir === 'rtl' || (isRTL && !forcedDir)) return 'left-0 ml-1';
        return 'right-0 mr-1';
    };

    return (
        <div className="relative w-full">
            <MainInput
                label={label}
                value={value}
                onChange={onChange}
                error={error}
                dir={inputDir}
            />

            {loading && !isManual && (
                <span className={`absolute top-0 ${getLoadingPosition()} text-xs text-blue-500 mt-2 animate-pulse`}>
                    {t('form.translating')}
                </span>
            )}

            {isManual && (
                <button
                    type="button"
                    onClick={onReset}
                    className={`absolute top-0 ${getButtonPosition()} mt-1 text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100 z-10 transition-colors`}
                    title={t('form.resetTooltip')}
                >
                    <RefreshCw size={10} /> {t('form.auto')}
                </button>
            )}
        </div>
    );
};

const AmenitiesForm = ({ onCancel, onSuccess, initialData = null }) => {
    // Initialize translation with 'amenities' namespace
    const { t, i18n } = useTranslation('amenitiesForm');
    const isRTL = i18n.language === 'ar';

    // --- STATE ---
    const [formData, setFormData] = useState({
        translations: {
            en: { name: '' },
            ar: { name: '' }
        },
        icon: null
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Translation State
    const [activeField, setActiveField] = useState(null);
    const [manualEdits, setManualEdits] = useState({
        en: { name: false },
        ar: { name: false }
    });

    const fileInputRef = useRef(null);

    // --- POPULATE FORM IF EDITING ---
    useEffect(() => {
        if (initialData) {
            const existingImage = initialData.icon || initialData.image;

            setFormData({
                translations: {
                    en: { name: initialData.translations?.en?.name || initialData.translations?.name || '' },
                    ar: { name: initialData.translations?.ar?.name || '' }
                },
                icon: existingImage ? {
                    id: 'initial_img',
                    // Use the imported getImageUrl utility here
                    preview: getImageUrl(existingImage),
                    serverUrl: existingImage,
                    uniqueName: existingImage,
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

    // Sync Hooks
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
            toast.error(t('messages.uploadValidImage'));
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

        setFormData(prev => ({ ...prev, icon: newImage }));
        setErrors(prev => ({ ...prev, icon: '' }));

        const uploadImage = async () => {
            try {
                const uniqueName = generateUniqueFileName(file.name);
                const result = await uploadService.processFullUpload(file, uniqueName);

                setFormData(prev => ({
                    ...prev,
                    icon: {
                        ...prev.icon,
                        serverUrl: result.url || uniqueName,
                        uniqueName: uniqueName,
                        uploading: false
                    }
                }));
                toast.success(t('messages.imageSuccess'));
            } catch (error) {
                console.error("Image upload failed", error);
                toast.error(t('messages.imageFail'));
                setFormData(prev => ({ ...prev, icon: null }));
            }
        };

        uploadImage();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, icon: null }));
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.icon?.uploading) {
            toast.warning(t('messages.waitUpload'));
            return;
        }

        const newErrors = {};
        if (!formData.translations.en.name) newErrors.name = t('messages.nameEnRequired');
        if (!formData.translations.ar.name) newErrors.name_ar = t('messages.nameArRequired');

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            let finalImage = null;
            if (formData.icon) {
                finalImage = formData.icon.uniqueName || formData.icon.serverUrl;
            }

            const payload = {
                translations: {
                    en: { name: formData.translations.en.name },
                    ar: { name: formData.translations.ar.name }
                },
                icon: finalImage
            };

            if (initialData) {
                await amenitiesService.updateAmenity(initialData.id, payload);
                toast.success(t('messages.updateSuccess'));
            } else {
                await amenitiesService.createAmenity(payload);
                toast.success(t('messages.createSuccess'));
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error("Submission failed", error);
            const message = error.response?.data?.message || t('messages.saveFail');
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            {initialData ? <Edit className="text-primary-100" /> : <Type className="text-primary-100" />}
                            {initialData ? t('header.editTitle') : t('header.createTitle')}
                        </h2>
                        <p className="text-primary-100 text-xs md:text-sm mt-1">
                            {initialData ? t('header.editSubtitle') : t('header.createSubtitle')}
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
                    <SectionHeader title={t('sections.basicInfo')} icon={Globe} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        {/* English Input */}
                        <div className="space-y-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{t('form.englishLabel')}</span>
                            <TranslationInput
                                label={t('form.nameEn')}
                                value={formData.translations.en.name}
                                onChange={(e) => handleTranslationChange('en', 'name', e.target.value)}
                                loading={loadEnName}
                                isManual={manualEdits.en.name}
                                onReset={() => resetManualEdit('en', 'name')}
                                error={errors.name}
                                forcedDir="ltr"
                            />
                        </div>
                        {/* Arabic Input */}
                        <div className="space-y-4" dir="rtl">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">{t('form.arabicLabel')}</span>
                            <TranslationInput
                                label={t('form.nameAr')}
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

                {/* 2. Image Upload (Full Width) */}
                <div className="space-y-4">
                    <SectionHeader title={t('sections.iconImage')} icon={ImageIcon} />
                    <div className="w-full">
                        {formData.icon && (
                            <div className="relative group w-full h-64 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                                <img
                                    src={formData.icon.preview}
                                    alt="Amenity Icon"
                                    className={`w-full h-full object-contain p-4 transition-opacity ${formData.icon.uploading ? 'opacity-50' : 'opacity-100'}`}
                                />
                                {formData.icon.uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Loader2 className="animate-spin text-white w-8 h-8" />
                                    </div>
                                )}
                                {!formData.icon.uploading && (formData.icon.serverUrl || formData.icon.uniqueName) && (
                                    <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-green-500 text-white rounded-full p-1`}>
                                        <Check size={14} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all cursor-pointer" onClick={removeImage}>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                        className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transform hover:scale-110 transition-transform"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                            </div>
                        )}
                        {!formData.icon && (
                            <label className="w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-gray-300 hover:border-primary-500 cursor-pointer bg-white hover:bg-primary-50 hover:shadow-sm">
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                                <div className="p-4 bg-primary-100 rounded-full mb-4 text-primary-600">
                                    <UploadCloud className="w-10 h-10" />
                                </div>
                                <span className="text-base text-gray-700 font-semibold">{t('form.uploadIcon')}</span>
                                <span className="text-sm text-gray-500 mt-1">{t('form.browseFiles')}</span>
                            </label>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        {t('form.imageHelp')}
                    </p>
                </div>

                {/* Buttons */}
                <div className="md:flex gap-4 pt-6 border-t">
                    <button type="button" onClick={onCancel}
                            className="md:flex items-center justify-center hidden w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">
                        {t('buttons.cancel')}
                    </button>
                    <button type="submit" disabled={isSubmitting || formData.icon?.uploading}
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

export default AmenitiesForm;