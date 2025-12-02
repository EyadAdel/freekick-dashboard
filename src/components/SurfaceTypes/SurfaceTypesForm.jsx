// src/components/venue-data/SurfaceTypesForm.jsx
import React, { useState, useEffect } from 'react';
import MainInput from './../MainInput.jsx';
import useTranslation from '../../hooks/useTranslation.js';
import { surfaceTypesService } from '../../services/surfaceTypes/surfaceTypesService.js';
import { toast } from 'react-toastify';
import {
    Type,
    Save,
    X,
    Globe,
    Loader2,
    Edit,
    Grid
} from 'lucide-react';

const SurfaceTypesForm = ({ onCancel, onSuccess, initialData = null }) => {

    // --- STATE ---
    const [formData, setFormData] = useState({
        name: '',
        name_ar: '',
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Translation Logic State
    const [activeField, setActiveField] = useState(null);

    // --- POPULATE FORM IF EDITING ---
    useEffect(() => {
        if (initialData) {
            // Handle cases where data might come flat or nested in translations object
            const enName = initialData.translations?.en?.name || initialData.name || '';
            const arName = initialData.translations?.ar?.name || initialData.name_ar || '';

            setFormData({
                name: enName,
                name_ar: arName,
            });
        }
    }, [initialData]);

    // --- TRANSLATION HOOKS ---
    const { translatedText: arabicTranslation, loading: loadingAr } =
        useTranslation(activeField === 'en' ? formData.name : "", 'ar');

    const { translatedText: englishTranslation, loading: loadingEn } =
        useTranslation(activeField === 'ar' ? formData.name_ar : "", 'en');

    // Auto-update Arabic when typing English
    useEffect(() => {
        if (activeField === 'en' && arabicTranslation) {
            setFormData(prev => ({ ...prev, name_ar: arabicTranslation }));
        }
    }, [arabicTranslation, activeField]);

    // Auto-update English when typing Arabic
    useEffect(() => {
        if (activeField === 'ar' && englishTranslation) {
            setFormData(prev => ({ ...prev, name: englishTranslation }));
        }
    }, [englishTranslation, activeField]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Track which field is active to prevent circular translation loops
        if (name === 'name') setActiveField('en');
        if (name === 'name_ar') setActiveField('ar');

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user types
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "English Name is required";
        if (!formData.name_ar.trim()) newErrors.name_ar = "Arabic Name is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            // Construct payload exactly as requested
            const payload = {
                translations: {
                    en: {
                        name: formData.name
                    },
                    ar: {
                        name: formData.name_ar
                    }
                },

            };

            if (initialData) {
                // --- UPDATE ---
                await surfaceTypesService.updateSurfaceType(initialData.id, payload);
            } else {
                // --- CREATE ---
                await surfaceTypesService.createSurfaceType(payload);
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error("Submission failed", error);
            if (!error.response) toast.error("Something went wrong during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="text-primary-100" /> : <Grid className="text-primary-100" />}
                            {initialData ? "Edit Surface Type" : "Add Surface Type"}
                        </h2>
                        <p className="text-primary-100 text-sm mt-1">
                            {initialData ? "Update the details for this surface type." : "Define a new surface type for pitches."}
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
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2">Basic Information</h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* English Name Input */}
                        <div className="relative">
                            <MainInput
                                label="Surface Name (English)"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                icon={Type}
                                required
                                placeholder="e.g. Natural Grass"
                            />
                            {activeField === 'ar' && loadingEn && (
                                <span className="absolute top-0 right-0 text-xs text-blue-500 mt-2 mr-2 animate-pulse">
                                    Translating...
                                </span>
                            )}
                        </div>

                        {/* Arabic Name Input */}
                        <div className="relative">
                            <MainInput
                                label="Surface Name (Arabic)"
                                name="name_ar"
                                value={formData.name_ar}
                                onChange={handleChange}
                                error={errors.name_ar}
                                icon={Globe}
                                required
                                style={{ direction: 'rtl' }}
                                placeholder="مثال: عشب طبيعي"
                            />
                            {activeField === 'en' && loadingAr && (
                                <span className="absolute top-0 left-0 text-xs text-blue-500 mt-2 ml-2 animate-pulse">
                                    Translating...
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                {initialData ? "Update Surface" : "Save Surface"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SurfaceTypesForm;