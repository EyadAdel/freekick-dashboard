import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx';
// Rename custom hook to avoid conflict with i18next
import useCustomTranslation from '../../hooks/useTranslation.js';
import { useTranslation } from 'react-i18next';

import { uploadService } from '../../services/upload/uploadService.js';
import { venueSportsService } from '../../services/venueSports/venueSportsService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { getImageUrl } from '../../utils/imageUtils';

import {
    Type, Save, X, Globe,
    UploadCloud, Trash2, Loader2, Edit, Activity, Image as ImageIcon, Check, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

// --- REUSABLE TRANSLATION INPUT COMPONENT ---
const TranslationInput = ({
                              label,
                              value,
                              onChange,
                              loading,
                              isManual,
                              onReset,
                              error,
                              placeholder,
                              forcedDir = null,
                              t, // Pass translation function
                              i18n // Pass i18n instance for direction checks
                          }) => {

    const isRTL = i18n.language === 'ar';

    // Determine the text direction for the input field itself
    const inputDir = forcedDir || (isRTL ? 'rtl' : 'ltr');

    // Helper to position the Manual Reset button
    // Matches AmenitiesForm: aligns based on Global direction mostly
    const getButtonPosition = () => {
        if (forcedDir === 'rtl' || (isRTL)) return 'left-0 ml-1';
        return 'right-0 mr-1';
    };

    // Helper to position the Loading indicator
    // Matches AmenitiesForm: aligns based on Specific Input direction
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
                placeholder={placeholder}
            />

            {/* Loading Indicator */}
            {loading && !isManual && (
                <span className={`absolute top-0 ${getLoadingPosition()} text-xs text-blue-500 mt-2 animate-pulse`}>
                    {t('basic_info.translating')}
                </span>
            )}

            {/* Manual Edit Reset Button */}
            {isManual && (
                <button
                    type="button"
                    onClick={onReset}
                    className={`absolute top-0 ${getButtonPosition()} mt-1 text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100 z-10 transition-colors`}
                    title="Reset to auto-translation"
                >
                    <RefreshCw size={10} /> {t('basic_info.auto_btn')}
                </button>
            )}
        </div>
    );
};

const VenueSportsForm = ({ onCancel, onSuccess, initialData = null }) => {
    const { t, i18n } = useTranslation('venueSportsForm');
    const isRTL = i18n.language === 'ar';

    // --- STATE ---
    const [formData, setFormData] = useState({
        name: '',     // English
        name_ar: '',  // Arabic
    });

    // Image State: { id, file, preview, serverUrl, uniqueName, uploading }
    const [imageState, setImageState] = useState(null);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- TRANSLATION STATE ---
    const [activeField, setActiveField] = useState(null);
    const [manualEdits, setManualEdits] = useState({
        name: false,
        name_ar: false
    });

    const fileInputRef = useRef(null);

    // --- POPULATE FORM IF EDITING ---
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.translations?.en?.name || '',
                name_ar: initialData.translations?.ar?.name || '',
            });

            // Mark as manually edited to prevent auto-translate from overwriting existing data on load
            setManualEdits({ name: true, name_ar: true });

            if (initialData.icon) {
                setImageState({
                    id: 'initial_img',
                    preview: getImageUrl(initialData.icon),
                    serverUrl: initialData.icon,
                    uniqueName: initialData.icon,
                    uploading: false
                });
            }
        }
    }, [initialData]);

    // --- CUSTOM HOOKS FOR AUTO TRANSLATION ---
    // 1. Get Arabic translation when English changes
    const { translatedText: arName, loading: loadArName } = useCustomTranslation(
        activeField === 'en' ? formData.name : "",
        'ar'
    );

    // 2. Get English translation when Arabic changes
    const { translatedText: enName, loading: loadEnName } = useCustomTranslation(
        activeField === 'ar' ? formData.name_ar : "",
        'en'
    );

    // --- SYNC EFFECTS ---
    useEffect(() => {
        if (activeField === 'en' && arName && !manualEdits.name_ar) {
            setFormData(prev => ({ ...prev, name_ar: arName }));
        }
    }, [arName, activeField, manualEdits.name_ar]);

    useEffect(() => {
        if (activeField === 'ar' && enName && !manualEdits.name) {
            setFormData(prev => ({ ...prev, name: enName }));
        }
    }, [enName, activeField, manualEdits.name]);

    // --- HANDLERS ---
    const handleTranslationChange = (lang, value) => {
        const field = lang === 'en' ? 'name' : 'name_ar';

        setActiveField(lang);
        setManualEdits(prev => ({ ...prev, [field]: true }));
        setFormData(prev => ({ ...prev, [field]: value }));

        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const resetManualEdit = (lang) => {
        const field = lang === 'en' ? 'name' : 'name_ar';
        const otherLang = lang === 'en' ? 'ar' : 'en';

        setManualEdits(prev => ({ ...prev, [field]: false }));
        // Trigger re-translation by setting active field to the source language
        setActiveField(otherLang);
    };

    // --- UPLOAD LOGIC ---
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

        setImageState(newImage);
        setErrors(prev => ({ ...prev, icon: '' }));

        const uploadImage = async () => {
            try {
                const uniqueName = generateUniqueFileName(file.name);
                const result = await uploadService.processFullUpload(file, uniqueName);

                setImageState(prev => ({
                    ...prev,
                    serverUrl: result.url || uniqueName,
                    uniqueName: uniqueName,
                    uploading: false
                }));
                toast.success(t('images.upload_success'));
            } catch (error) {
                console.error("Icon upload failed", error);
                toast.error(t('images.upload_fail'));
                setImageState(null);
            }
        };

        uploadImage();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (e) => {
        if(e) e.stopPropagation();
        setImageState(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.name) newErrors.name = t('validation.name_en_required');
        if (!formData.name_ar) newErrors.name_ar = t('validation.name_ar_required');

        if (imageState?.uploading) {
            toast.warning(t('images.wait_upload'));
            return;
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            let finalIconName = null;
            if (imageState) {
                finalIconName = imageState.uniqueName || imageState.serverUrl;
            }

            const payload = {
                icon: finalIconName,
                translations: {
                    en: { name: formData.name },
                    ar: { name: formData.name_ar }
                }
            };

            if (initialData) {
                await venueSportsService.update(initialData.id, payload);
            } else {
                await venueSportsService.create(payload);
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error("Submission failed", error);
            if (!error.response) toast.error(t('validation.generic_error'));
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
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="text-primary-100" /> : <Activity className="text-primary-100" />}
                            {initialData ? t('header.edit_title') : t('header.create_title')}
                        </h2>
                        <p className="text-primary-100 text-sm mt-1">
                            {initialData ? t('header.edit_desc') : t('header.create_desc')}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-primary-600 p-2 rounded-lg">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">

                {/* 1. Translations Section */}
                <div className="space-y-6">
                    <SectionHeader title={t('basic_info.title')} icon={Globe}/>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* English */}
                        <div className="space-y-4">
                            <span className="badge bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                                {t('basic_info.badge_en')}
                            </span>
                            <TranslationInput
                                label={t('basic_info.name_en_label')}
                                value={formData.name}
                                onChange={(e) => handleTranslationChange('en', e.target.value)}
                                loading={loadEnName}
                                isManual={manualEdits.name}
                                onReset={() => resetManualEdit('en')}
                                error={errors.name}
                                forcedDir="ltr"
                                t={t}
                                i18n={i18n}
                            />
                        </div>

                        {/* Arabic */}
                        <div className="space-y-4" dir="rtl">
                            <span className="badge bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                                {t('basic_info.badge_ar')}
                            </span>
                            <TranslationInput
                                label={t('basic_info.name_ar_label')}
                                value={formData.name_ar}
                                onChange={(e) => handleTranslationChange('ar', e.target.value)}
                                loading={loadArName}
                                isManual={manualEdits.name_ar}
                                onReset={() => resetManualEdit('ar')}
                                error={errors.name_ar}
                                forcedDir="rtl"
                                t={t}
                                i18n={i18n}
                            />
                        </div>

                    </div>
                </div>

                {/* 2. Full Width Image Upload Section */}
                <div className="space-y-4">
                    <SectionHeader title={t('images.title')} icon={ImageIcon}/>

                    <div className="w-full">
                        {imageState ? (
                            // Image Preview Container
                            <div
                                className="relative group w-full h-64 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                                <img
                                    src={imageState.preview}
                                    alt="Sport Icon"
                                    className={`w-full h-full object-contain p-2 transition-opacity ${imageState.uploading ? 'opacity-50' : 'opacity-100'}`}
                                />

                                {/* Loading Spinner */}
                                {imageState.uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Loader2 className="animate-spin text-white w-8 h-8"/>
                                    </div>
                                )}

                                {/* Success Checkmark */}
                                {!imageState.uploading && (imageState.serverUrl || imageState.uniqueName) && (
                                    <div
                                        className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-green-500 text-white rounded-full p-1 shadow-sm`}>
                                        <Check size={14}/>
                                    </div>
                                )}

                                {/* Delete Button (Hover) */}
                                <div
                                    className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform hover:scale-110 transition-transform"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Upload Placeholder
                            <label className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200 
                                ${errors.icon ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'} 
                                cursor-pointer bg-white hover:shadow-sm`}>
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                                <div className="p-3 bg-primary-100 rounded-full mb-3 text-primary-600">
                                    <UploadCloud className="w-8 h-8"/>
                                </div>
                                <span className="text-sm text-gray-600 font-semibold">{t('images.upload_label')}</span>
                                <span className="text-xs text-gray-500 mt-1">{t('images.click_to_select')}</span>
                            </label>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="md:flex gap-4 pt-6 border-t">
                    <button type="button" onClick={onCancel}
                            className="md:flex items-center justify-center hidden w-full bg-gray-100 hover:bg-gray-200 text-gray-800  font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">{t('buttons.cancel')}
                    </button>
                    <button type="submit"
                            disabled={isSubmitting || imageState?.uploading}
                            className=" flex items-center w-full justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm text-sm md:text-base">{isSubmitting ?
                        <Loader2 size={20} className="animate-spin"/> : <><Save
                            size={20}/>{initialData ? t('buttons.update') : t('buttons.save')}</>}</button>
                    <button type="button" onClick={onCancel}
                            className="flex-1 md:hidden bg-gray-100 w-full mt-3 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">{t('buttons.cancel')}
                    </button>

                </div>

            </form>
        </div>
    );
};

export default VenueSportsForm;