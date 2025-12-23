// src/components/venue-data/SurfaceTypesForm.jsx
import React, { useState, useEffect } from 'react';
import MainInput from './../MainInput.jsx';
import useAutoTranslation from '../../hooks/useTranslation.js';
import { surfaceTypesService } from '../../services/surfaceTypes/surfaceTypesService.js';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
    Type,
    Save,
    X,
    Globe,
    Loader2,
    Edit,
    Grid,
    RefreshCw
} from 'lucide-react';

// --- REUSABLE TRANSLATION COMPONENT ---
const TranslationInput = ({
                              label,
                              value,
                              onChange,
                              loading,
                              isManual,
                              onReset,
                              error,
                              placeholder,
                              icon: Icon,
                              forcedDir = null, // Renamed from direction to forcedDir to match pattern
                              t, // Pass translation function
                              i18n // Pass i18n instance
                          }) => {

    const isRTL = i18n.language === 'ar';

    // Determine the text direction for the input field itself
    const inputDir = forcedDir || (isRTL ? 'rtl' : 'ltr');

    // Helper to position the Manual Reset button
    // Matches AmenitiesForm logic
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
                name="name"
                value={value}
                onChange={onChange}
                error={error}
                icon={Icon}
                required
                placeholder={placeholder}
                dir={inputDir}
            />

            {/* Loading Indicator */}
            {loading && !isManual && (
                <span className={`absolute top-0 ${getLoadingPosition()} text-xs text-blue-500 mt-2 animate-pulse`}>
                    {t('buttons.translating')}
                </span>
            )}

            {/* Manual Edit / Reset Button */}
            {isManual && (
                <button
                    type="button"
                    onClick={onReset}
                    className={`absolute top-0 ${getButtonPosition()} mt-1 text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100 z-10 transition-colors`}
                    title="Reset auto-translation"
                >
                    <RefreshCw size={10} /> {t('buttons.auto')}
                </button>
            )}
        </div>
    );
};

const SurfaceTypesForm = ({ onCancel, onSuccess, initialData = null }) => {
    const { t, i18n } = useTranslation('surfaceTypeForm');
    const isRTL = i18n.language === 'ar';

    // --- STATE ---
    const [formData, setFormData] = useState({
        translations: {
            en: { name: '' },
            ar: { name: '' }
        }
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Translation Logic State
    const [activeField, setActiveField] = useState(null);
    const [manualEdits, setManualEdits] = useState({
        en: { name: false },
        ar: { name: false }
    });

    // --- POPULATE FORM IF EDITING ---
    useEffect(() => {
        if (initialData) {
            const enName = initialData.translations?.en?.name || initialData.name || '';
            const arName = initialData.translations?.ar?.name || initialData.name_ar || '';

            setFormData({
                translations: {
                    en: { name: enName },
                    ar: { name: arName }
                }
            });

            setManualEdits({
                en: { name: true },
                ar: { name: true }
            });
        }
    }, [initialData]);

    // --- TRANSLATION HOOKS ---
    const { translatedText: arName, loading: loadArName } =
        useAutoTranslation(activeField === 'en' ? formData.translations.en.name : "", 'ar');

    const { translatedText: enName, loading: loadEnName } =
        useAutoTranslation(activeField === 'ar' ? formData.translations.ar.name : "", 'en');

    // --- SYNC LOGIC ---
    const useSyncTranslation = (targetLang, field, text) => {
        useEffect(() => {
            if (activeField === (targetLang === 'en' ? 'ar' : 'en') && text && !manualEdits[targetLang][field]) {
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

        setManualEdits(prev => ({
            ...prev,
            [lang]: { ...prev[lang], [field]: true }
        }));

        setFormData(prev => ({
            ...prev,
            translations: {
                ...prev.translations,
                [lang]: { ...prev.translations[lang], [field]: value }
            }
        }));

        const errorKey = lang === 'en' ? 'name' : 'name_ar';
        if (errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: '' }));
    };

    const resetManualEdit = (lang, field) => {
        setManualEdits(prev => ({
            ...prev,
            [lang]: { ...prev[lang], [field]: false }
        }));
        const otherLang = lang === 'en' ? 'ar' : 'en';
        setActiveField(otherLang);
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!formData.translations.en.name.trim()) newErrors.name = t('validation.requiredEn');
        if (!formData.translations.ar.name.trim()) newErrors.name_ar = t('validation.requiredAr');

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            const payload = {
                translations: {
                    en: { name: formData.translations.en.name },
                    ar: { name: formData.translations.ar.name }
                },
            };

            if (initialData) {
                await surfaceTypesService.updateSurfaceType(initialData.id, payload);
            } else {
                await surfaceTypesService.createSurfaceType(payload);
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error("Submission failed", error);
            if (!error.response) toast.error(t('errors.submission'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="text-primary-100" /> : <Grid className="text-primary-100" />}
                            {initialData ? t('title.edit') : t('title.add')}
                        </h2>
                        <p className="text-primary-100 text-sm mt-1">
                            {initialData ? t('subtitle.edit') : t('subtitle.add')}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-primary-600 p-2 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">

                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2 flex items-center gap-2">
                        <Type size={20}/> {t('section.basicInfo')}
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* English Name Input */}
                        <div className="space-y-4">
                            <span className="badge bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                                English
                            </span>
                            <TranslationInput
                                label={t('fields.nameEn.label')}
                                value={formData.translations.en.name}
                                onChange={(e) => handleTranslationChange('en', 'name', e.target.value)}
                                loading={loadEnName}
                                isManual={manualEdits.en.name}
                                onReset={() => resetManualEdit('en', 'name')}
                                error={errors.name}
                                placeholder={t('fields.nameEn.placeholder')}
                                icon={Type}
                                forcedDir="ltr"
                                t={t}
                                i18n={i18n}
                            />
                        </div>

                        {/* Arabic Name Input */}
                        <div className="space-y-4" dir="rtl">
                             <span className="badge bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                                العربية
                            </span>
                            <TranslationInput
                                label={t('fields.nameAr.label')}
                                value={formData.translations.ar.name}
                                onChange={(e) => handleTranslationChange('ar', 'name', e.target.value)}
                                loading={loadArName}
                                isManual={manualEdits.ar.name}
                                onReset={() => resetManualEdit('ar', 'name')}
                                error={errors.name_ar}
                                placeholder={t('fields.nameAr.placeholder')}
                                icon={Globe}
                                forcedDir="rtl"
                                t={t}
                                i18n={i18n}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="md:flex gap-4 pt-6 border-t">
                    <button type="button" onClick={onCancel}
                            className="md:flex items-center justify-center hidden w-full bg-gray-100 hover:bg-gray-200 text-gray-800  font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">{t('buttons.cancel')}
                    </button>
                    <button type="submit"
                            disabled={isSubmitting}

                            className=" flex items-center w-full justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm text-sm md:text-base">{isSubmitting ?
                        <Loader2 size={20} className="animate-spin"/> : <><Save
                            size={20}/>{initialData ? t('buttons.update') : t('buttons.save')}</>}</button>
                    <button type="button" onClick={onCancel}
                            className="flex-1 md:hidden bg-gray-100 w-full mt-3 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">{t('buttons.cancel')}
                    </button>

                </div>
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        {t('buttons.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <Loader2 size={20} className="animate-spin"/>
                        ) : (
                            <>
                                <Save size={20}/>
                                {initialData ? t('buttons.update') : t('buttons.save')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SurfaceTypesForm;