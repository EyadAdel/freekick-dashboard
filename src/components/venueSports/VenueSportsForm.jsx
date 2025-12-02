import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx';
import useTranslation from '../../hooks/useTranslation.js';
import { uploadService } from '../../services/upload/uploadService.js';
import { venueSportsService } from '../../services/venueSports/venueSportsService.js'; // Ensure path is correct
import { generateUniqueFileName } from '../../utils/fileUtils';

import {
    Type, Save, X, Globe,
    UploadCloud, Trash2, Loader2, Edit, Activity, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-toastify';

const VenueSportsForm = ({ onCancel, onSuccess, initialData = null }) => {

    // --- STATE ---
    const [formData, setFormData] = useState({
        name: '',
        name_ar: '',
    });

    // Image States
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [finalIconName, setFinalIconName] = useState(''); // Stores the filename string
    const [isImageUploading, setIsImageUploading] = useState(false);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Translation Logic
    const [activeField, setActiveField] = useState(null);
    const fileInputRef = useRef(null);

    // --- POPULATE FORM IF EDITING (initialData) ---
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.translations?.en?.name || '',
                name_ar: initialData.translations?.ar?.name || '',
            });

            // Handle existing icon
            if (initialData.icon) {
                setImagePreview(initialData.icon);
                setFinalIconName(initialData.icon);
            }
        }
    }, [initialData]);

    // --- TRANSLATION HOOKS ---
    const { translatedText: arabicTranslation, loading: loadingAr } =
        useTranslation(activeField === 'en' ? formData.name : "", 'ar');

    const { translatedText: englishTranslation, loading: loadingEn } =
        useTranslation(activeField === 'ar' ? formData.name_ar : "", 'en');

    useEffect(() => {
        if (activeField === 'en' && arabicTranslation) {
            setFormData(prev => ({ ...prev, name_ar: arabicTranslation }));
        }
    }, [arabicTranslation, activeField]);

    useEffect(() => {
        if (activeField === 'ar' && englishTranslation) {
            setFormData(prev => ({ ...prev, name: englishTranslation }));
        }
    }, [englishTranslation, activeField]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name') setActiveField('en');
        if (name === 'name_ar') setActiveField('ar');

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // --- UPLOAD LOGIC ---
    const handleImageSelect = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload a valid image file");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setSelectedImage(file);
        setImagePreview(previewUrl);
        setErrors(prev => ({ ...prev, icon: '' }));

        setIsImageUploading(true);
        try {
            const generatedName = generateUniqueFileName(file.name);
            const result = await uploadService.processFullUpload(file, generatedName);
            // Assuming result returns { key: "filename.png", ... } or similar
            const uploadedName = result.key || result.fileName || generatedName;

            setFinalIconName(uploadedName);
            toast.success("Icon uploaded successfully");
        } catch (error) {
            console.error("Icon upload failed", error);
            setSelectedImage(null);
            setImagePreview(null);
            setFinalIconName('');
            if(fileInputRef.current) fileInputRef.current.value = '';
            toast.error("Icon upload failed.");
        } finally {
            setIsImageUploading(false);
        }
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) handleImageSelect(file);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) handleImageSelect(file);
    };

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

    const removeImage = (e) => {
        e.stopPropagation();
        setSelectedImage(null);
        setImagePreview(null);
        setFinalIconName('');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.name) newErrors.name = "Name (EN) is required";
        if (!formData.name_ar) newErrors.name_ar = "Name (AR) is required";

        if (isImageUploading) {
            toast.warning("Please wait for the icon to finish uploading.");
            return;
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            // Construct payload exactly as requested
            const payload = {
                icon: finalIconName || null, // Optional: send null if empty
                translations: {
                    en: { name: formData.name },
                    ar: { name: formData.name_ar }
                }
            };

            if (initialData) {
                // --- UPDATE ---
                await venueSportsService.update(initialData.id, payload);
            } else {
                // --- CREATE ---
                await venueSportsService.create(payload);
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error("Submission failed", error);
            if(!error.response) toast.error("Something went wrong during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="text-primary-100" /> : <Activity className="text-primary-100" />}
                            {initialData ? "Edit Venue Sport" : "Create New Venue Sport"}
                        </h2>
                        <p className="text-primary-100 text-sm mt-1">
                            {initialData ? "Update the details for this sport." : "Fill in the details for the new sport."}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-primary-600 p-2 rounded-lg">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">

                {/* Names */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="relative">
                            <MainInput
                                label="Name (English)"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                icon={Type}
                                required
                            />
                            {activeField === 'ar' && loadingEn && (
                                <span className="absolute top-0 right-0 text-xs text-blue-500 mt-2 mr-2 animate-pulse">Translating...</span>
                            )}
                        </div>
                        <div className="relative">
                            <MainInput
                                label="Name (Arabic)"
                                name="name_ar"
                                value={formData.name_ar}
                                onChange={handleChange}
                                error={errors.name_ar}
                                icon={Globe}
                                required
                                style={{ direction: 'rtl' }}
                            />
                            {activeField === 'en' && loadingAr && (
                                <span className="absolute top-0 left-0 text-xs text-blue-500 mt-2 ml-2 animate-pulse">Translating...</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Icon Upload (Optional) */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sport Icon <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div
                        onClick={() => !isImageUploading && fileInputRef.current.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors 
                        ${errors.icon ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary-500'}
                        ${isImageUploading ? 'cursor-wait bg-gray-50' : 'cursor-pointer'}`}
                    >
                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={onFileChange} disabled={isImageUploading} />

                        {isImageUploading ? (
                            <div className="flex flex-col items-center justify-center">
                                <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-2" />
                                <p className="text-sm font-medium text-gray-600">Uploading...</p>
                            </div>
                        ) : imagePreview ? (
                            <div className="relative w-full h-full p-2 group">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-md" />
                                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-md transition-all">
                                    <button type="button" onClick={removeImage} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"><Trash2 size={20} /></button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-4">
                                <div className="bg-primary-100 text-primary-600 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3"><UploadCloud size={24} /></div>
                                <p className="text-sm font-medium text-gray-700">Click to upload icon</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg">Cancel</button>
                    <button type="submit" disabled={isSubmitting || isImageUploading} className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg">
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {initialData ? "Update Sport" : "Save Sport"}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VenueSportsForm;