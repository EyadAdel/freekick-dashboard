import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx';
import useAutoTranslation from '../../hooks/useTranslation.js';
import { uploadService } from '../../services/upload/uploadService.js';
import { addonsService } from '../../services/addons/addonsService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { getImageUrl } from '../../utils/imageUtils';
import { useTranslation } from 'react-i18next';

import {
    Type, Save, X, Globe,
    UploadCloud, Trash2, Loader2, Edit, Puzzle, Image as ImageIcon,
    RefreshCw, Check
} from 'lucide-react';
import { toast } from 'react-toastify';

// --- REUSABLE TRANSLATION COMPONENT ---
const TranslationInput = ({
                              label,
                              value,
                              onChange,
                              loading,
                              isManual,
                              onReset,
                              error,
                              forcedDir = null,
                              t, // Pass translation function
                              i18n // Pass i18n instance
                          }) => {

    const isRTL = i18n.language === 'ar';

    // Determine the text direction for the input field itself
    const inputDir = forcedDir || (isRTL ? 'rtl' : 'ltr');

    // Helper to position the Manual Reset button
    const getButtonPosition = () => {
        if (forcedDir === 'rtl' || (isRTL)) return 'left-0 ml-1';
        return 'right-0 mr-1';
    };

    // Helper to position the Loading indicator
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
                icon={forcedDir === 'rtl' ? Globe : Type}
            />

            {/* Loading Indicator */}
            {loading && !isManual && (
                <span className={`absolute top-0 ${getLoadingPosition()} text-xs text-blue-500 mt-2 animate-pulse`}>
                    {t('labels.translating')}
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
                    <RefreshCw size={10} /> {t('labels.auto')}
                </button>
            )}
        </div>
    );
};

const AddonsForm = ({ onCancel, onSuccess, initialData = null }) => {
    const { t, i18n } = useTranslation('addOnsForm');
    const isRTL = i18n.language === 'ar';

    // --- STATE ---
    const [formData, setFormData] = useState({
        name: '',
        name_ar: '',
        icon: null
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Translation Logic State
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
                icon: initialData.icon ? {
                    id: 'initial_img',
                    preview: getImageUrl(initialData.icon),
                    serverUrl: initialData.icon,
                    uniqueName: initialData.icon,
                    uploading: false
                } : null
            });

            setManualEdits({ name: true, name_ar: true });
        }
    }, [initialData]);

    // --- TRANSLATION HOOKS ---
    const { translatedText: arName, loading: loadArName } =
        useAutoTranslation(activeField === 'en' ? formData.name : "", 'ar');

    const { translatedText: enName, loading: loadEnName } =
        useAutoTranslation(activeField === 'ar' ? formData.name_ar : "", 'en');

    // --- SYNC LOGIC ---
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
    const handleTranslationChange = (field, value) => {
        const lang = field === 'name' ? 'en' : 'ar';
        setActiveField(lang);
        setManualEdits(prev => ({ ...prev, [field]: true }));
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const resetManualEdit = (field) => {
        setManualEdits(prev => ({ ...prev, [field]: false }));
        const otherLang = field === 'name' ? 'ar' : 'en';
        setActiveField(otherLang);
    };

    // --- UPLOAD LOGIC ---
    const handleImageSelect = (e) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
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
                const generatedName = generateUniqueFileName(file.name);
                const result = await uploadService.processFullUpload(file, generatedName);

                setFormData(prev => ({
                    ...prev,
                    icon: {
                        ...prev.icon,
                        serverUrl: result.key || result.fileName || result.url || generatedName,
                        uniqueName: generatedName,
                        uploading: false
                    }
                }));
                toast.success(t('messages.iconUploadedSuccess'));
            } catch (error) {
                console.error("Icon upload failed", error);
                setFormData(prev => ({ ...prev, icon: null }));
                if(fileInputRef.current) fileInputRef.current.value = '';
                toast.error(t('messages.iconUploadFailed'));
            }
        };

        uploadImage();
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) handleImageSelect({ target: { files: [file] } });
    };

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

    const removeImage = (e) => {
        if(e) e.stopPropagation();
        setFormData(prev => ({ ...prev, icon: null }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.name) newErrors.name = t('messages.requiredNameEn');
        if (!formData.name_ar) newErrors.name_ar = t('messages.requiredNameAr');

        if (formData.icon?.uploading) {
            toast.warning(t('messages.waitUpload'));
            return;
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            let finalIconName = null;
            if (formData.icon) {
                finalIconName = formData.icon.uniqueName || formData.icon.serverUrl;
            }

            const payload = {
                translations: {
                    en: { name: formData.name },
                    ar: { name: formData.name_ar }
                },
                icon: finalIconName || null
            };

            if (initialData) {
                await addonsService.update(initialData.id, payload);
            } else {
                await addonsService.create(payload);
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error("Submission failed", error);
            if(!error.response) toast.error(t('messages.submissionError'));
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
                            {initialData ? <Edit className="text-primary-100" /> : <Puzzle className="text-primary-100" />}
                            {initialData ? t('titles.edit') : t('titles.create')}
                        </h2>
                        <p className="text-primary-100 text-sm mt-1">
                            {initialData ? t('titles.editSubtitle') : t('titles.createSubtitle')}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-primary-600 p-2 rounded-lg">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">

                {/* Names with Auto Translation */}
                <div className="space-y-6">
                    <SectionHeader title={t('sections.basicInfo')} icon={Globe} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* English */}
                        <div className="space-y-4">
                            <span className="badge bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                                English
                            </span>
                            <TranslationInput
                                label={t('labels.nameEn')}
                                value={formData.name}
                                onChange={(e) => handleTranslationChange('name', e.target.value)}
                                loading={loadEnName}
                                isManual={manualEdits.name}
                                onReset={() => resetManualEdit('name')}
                                error={errors.name}
                                forcedDir="ltr"
                                t={t}
                                i18n={i18n}
                            />
                        </div>

                        {/* Arabic */}
                        <div className="space-y-4" dir="rtl">
                            <span className="badge bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                                العربية
                            </span>
                            <TranslationInput
                                label={t('labels.nameAr')}
                                value={formData.name_ar}
                                onChange={(e) => handleTranslationChange('name_ar', e.target.value)}
                                loading={loadArName}
                                isManual={manualEdits.name_ar}
                                onReset={() => resetManualEdit('name_ar')}
                                error={errors.name_ar}
                                forcedDir="rtl"
                                t={t}
                                i18n={i18n}
                            />
                        </div>
                    </div>
                </div>

                {/* Icon Upload (Full Width) */}
                <div className="space-y-4">
                    <SectionHeader title={t('sections.addonIcon')} icon={ImageIcon} />
                    <div className="w-full">
                        {formData.icon ? (
                            <div className="relative group w-full h-64 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                                <img
                                    src={formData.icon.preview}
                                    alt="Preview"
                                    className={`w-full h-full object-contain p-4 transition-opacity ${formData.icon.uploading ? 'opacity-50' : 'opacity-100'}`}
                                />

                                {formData.icon.uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Loader2 className="animate-spin text-white w-8 h-8" />
                                    </div>
                                )}

                                {/* Success Checkmark - Direction Aware */}
                                {!formData.icon.uploading && (
                                    <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-green-500 text-white rounded-full p-1 z-10 shadow-sm`}>
                                        <Check size={14} />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all z-20">
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transform hover:scale-105 transition-all"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer 
                                ${errors.icon ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50 hover:shadow-sm'}`}
                            >
                                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageSelect} />
                                <div className="p-4 bg-primary-100 rounded-full mb-4 text-primary-600">
                                    <UploadCloud className="w-10 h-10" />
                                </div>
                                <span className="text-base text-gray-700 font-semibold">{t('labels.clickToUpload')}</span>
                                <span className="text-sm text-gray-500 mt-1">{t('labels.dragAndDrop')}</span>
                            </label>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                    <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors">
                        {t('buttons.cancel')}
                    </button>
                    <button type="submit" disabled={isSubmitting || formData.icon?.uploading} className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm">
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {initialData ? t('buttons.update') : t('buttons.save')}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddonsForm;