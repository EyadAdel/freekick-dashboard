import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx';
import useTranslation from '../../hooks/useTranslation.js';
import { uploadService } from '../../services/upload/uploadService.js';
import { pitchesService } from '../../services/pitches/pitchesService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';

import {
    Type, DollarSign, Maximize, MapPin, Layers, Save, X, Globe,
    UploadCloud, Trash2, ChevronDown, Users, Loader2, Edit
} from 'lucide-react';
import { toast } from 'react-toastify';

// Added initialData prop for editing mode
const PitchesForm = ({ venuesData, pitchesList, onCancel, onSuccess, initialData = null }) => {

    // --- STATE ---
    const [formData, setFormData] = useState({
        name: '',
        name_ar: '',
        price_per_hour: '',
        size: '',
        max_players: '',
        venue: '',
        parent_pitch: '',
        is_active: true,
        is_primary: false,
    });

    // Image States
    const [selectedImage, setSelectedImage] = useState(null);
    const [uniqueName, setUniqueName] = useState('1764535039939_e5484e6e7b4d7ce632cdd46fa5cbf66c.jpg');
    const [imagePreview, setImagePreview] = useState(null);
    const [finalImageUrl, setFinalImageUrl] = useState('');
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
                price_per_hour: initialData.price_per_hour || '',
                size: initialData.size || '',
                max_players: initialData.max_players || '',
                venue: initialData.venue || '',
                parent_pitch: initialData.parent_pitch || '',
                is_active: initialData.is_active ?? true,
                is_primary: initialData.is_primary ?? false,
            });

            // Handle existing image
            if (initialData.image) {
                setImagePreview(initialData.image); // Assuming image comes as a URL string
                setFinalImageUrl(initialData.image);
                // Keep the existing uniqueName if needed, or extract it from URL
                setUniqueName(initialData.image);
            }
        }
    }, [initialData]);

    // --- TRANSLATION HOOKS ---
    const { translatedText: arabicTranslation, loading: loadingAr } =
        useTranslation(activeField === 'en' ? formData.name : "", 'ar');

    const { translatedText: englishTranslation, loading: loadingEn } =
        useTranslation(activeField === 'ar' ? formData.name_ar : "", 'en');

    useEffect(() => {
        // Only auto-translate if NOT in edit mode, or if user is actively typing (activeField is set)
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
        const { name, value, type, checked } = e.target;
        if (name === 'name') setActiveField('en');
        if (name === 'name_ar') setActiveField('ar');

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
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
        setErrors(prev => ({ ...prev, image: '' }));

        setIsImageUploading(true);
        try {
            const generatedName = generateUniqueFileName(file.name);
            setUniqueName(generatedName);
            const result = await uploadService.processFullUpload(file, generatedName);
            const uploadedUrl = result.url || result.key || result.imageUrl;

            setFinalImageUrl(uploadedUrl);
            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error("Image upload failed", error);
            setSelectedImage(null);
            setImagePreview(null); // Revert to null or previous image?
            setFinalImageUrl('');
            if(fileInputRef.current) fileInputRef.current.value = '';
            toast.error("Image upload failed.");
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
        setFinalImageUrl('');
        setUniqueName('');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.name) newErrors.name = "Pitch Name (EN) is required";
        if (!formData.name_ar) newErrors.name_ar = "Pitch Name (AR) is required";
        if (!formData.price_per_hour) newErrors.price_per_hour = "Price is required";
        if (!formData.size) newErrors.size = "Size is required";
        if (!formData.max_players) newErrors.max_players = "Max players is required";
        if (!formData.venue) newErrors.venue = "Venue is required";

        if (isImageUploading) {
            toast.warning("Please wait for the image to finish uploading.");
            return;
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            const payload = {
                translations: {
                    en: { name: formData.name },
                    ar: { name: formData.name_ar }
                },
                is_active: formData.is_active,
                price_per_hour: parseFloat(formData.price_per_hour).toFixed(2),
                size: parseInt(formData.size, 10),
                max_players: parseInt(formData.max_players, 10),
                is_primary: formData.is_primary,
                venue: formData.venue,
                parent_pitch: formData.parent_pitch ? parseInt(formData.parent_pitch, 10) : null,
                // If finalImageUrl exists (new upload or existing), use it. Otherwise null.
                image: finalImageUrl || uniqueName || null
            };

            if (initialData) {
                // --- UPDATE (PATCH) ---
                await pitchesService.updatePitch(initialData.id, payload);
            } else {
                // --- CREATE (POST) ---
                await pitchesService.addPitch(payload);
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error("Submission failed", error);
            if(!error.response) toast.error("Something went wrong during submission.");
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

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="text-primary-100" /> : <Layers className="text-primary-100" />}
                            {initialData ? "Edit Pitch" : "Create New Pitch"}
                        </h2>
                        <p className="text-primary-100 text-sm mt-1">
                            {initialData ? "Update the details for this pitch." : "Fill in the details for the venue pitch."}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-primary-600 p-2 rounded-lg">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* ... (Rest of the form UI remains exactly the same as previous) ... */}

                {/* Names */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="relative">
                            <MainInput
                                label="Pitch Name (English)"
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
                                label="Pitch Name (Arabic)"
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

                {/* Image Upload */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Image</label>
                    <div
                        onClick={() => !isImageUploading && fileInputRef.current.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors 
                        ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary-500'}
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
                                <p className="text-sm font-medium text-gray-700">Click to upload</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details (Prices, Size, Selects) */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MainInput label="Price Per Hour" name="price_per_hour" type="number" value={formData.price_per_hour} onChange={handleChange} error={errors.price_per_hour} icon={DollarSign} />

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Size Type</label>
                            <div className="relative">
                                <select name="size" value={formData.size} onChange={handleChange} className="w-full pl-3 pr-10 py-2 border rounded-lg bg-white outline-none focus:border-primary-500">
                                    <option value="">Select Size</option>
                                    {sizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            {errors.size && <p className="text-red-500 text-xs mt-1">{errors.size}</p>}
                        </div>

                        <MainInput label="Max Players" name="max_players" type="number" value={formData.max_players} onChange={handleChange} error={errors.max_players} icon={Users} />

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Venue</label>
                            <div className="relative">
                                <select name="venue" value={formData.venue} onChange={handleChange} className="w-full pl-3 pr-10 py-2 border rounded-lg bg-white outline-none focus:border-primary-500">
                                    <option value="">Select Venue</option>
                                    {venuesData && venuesData.map((item, index) => <option key={index} value={item.value}>{item.label}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Parent Pitch</label>
                            <div className="relative">
                                <select name="parent_pitch" value={formData.parent_pitch} onChange={handleChange} className="w-full pl-3 pr-10 py-2 border rounded-lg bg-white outline-none focus:border-primary-500">
                                    <option value="">Select Parent Pitch</option>
                                    {pitchesList && pitchesList.map((item, index) => <option key={index} value={item.value}>{item.label}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="bg-primary-50 p-6 rounded-lg space-y-4 border border-primary-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MainInput type="checkbox" label="Is Active?" name="is_active" value={formData.is_active} onChange={handleChange} />
                        <MainInput type="checkbox" label="Is Primary Pitch?" name="is_primary" value={formData.is_primary} onChange={handleChange} />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg">Cancel</button>
                    <button type="submit" disabled={isSubmitting || isImageUploading} className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg">
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {initialData ? "Update Pitch" : "Save Pitch"}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PitchesForm;