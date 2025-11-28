import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx'; // Adjust path
import useTranslation from '../../hooks/useTranslation.js'; // Your hook
import {
    Type,
    DollarSign,
    Maximize,
    MapPin,
    Layers,
    Save,
    X,
    Globe,
    UploadCloud,
    Trash2,
    ChevronDown
} from 'lucide-react';

const PitchesForm = ({ venuesData, onCancel, onSuccess }) => {
    // --- STATE ---
    const [formData, setFormData] = useState({
        name: '',
        name_ar: '',
        price_per_hour: '',
        size: '',
        venue: '',
        parent_pitch: '',
        is_active: true,
        is_primary: false,
    });

    // Separate state for Image handling
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [errors, setErrors] = useState({});

    // Translation Logic Tracking
    const [activeField, setActiveField] = useState(null);
    const fileInputRef = useRef(null);

    // --- TRANSLATION HOOKS ---
    const { translatedText: arabicTranslation, loading: loadingAr } =
        useTranslation(activeField === 'en' ? formData.name : "", 'ar');

    const { translatedText: englishTranslation, loading: loadingEn } =
        useTranslation(activeField === 'ar' ? formData.name_ar : "", 'en');

    // Sync Effects
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


    // --- HANDLERS ---

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

    // --- IMAGE HANDLERS ---

    const handleImageSelect = (file) => {
        if (file) {
            setSelectedImage(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            if (errors.image) setErrors(prev => ({ ...prev, image: '' }));
        }
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        handleImageSelect(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageSelect(file);
        }
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- SUBMIT ---

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validation
        const newErrors = {};
        if (!formData.name) newErrors.name = "Pitch Name (EN) is required";
        if (!formData.name_ar) newErrors.name_ar = "Pitch Name (AR) is required";
        if (!formData.price_per_hour) newErrors.price_per_hour = "Price is required";
        if (!formData.size) newErrors.size = "Size is required";
        if (!formData.venue) newErrors.venue = "Venue is required";
        if (!selectedImage) newErrors.image = "Image is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        let imageString = selectedImage.name;

        // 2. Construct Payload
        const payload = {
            translations: {
                en: { name: formData.name },
                ar: { name: formData.name_ar }
            },
            is_active: formData.is_active,
            price_per_hour: parseFloat(formData.price_per_hour).toFixed(2),
            size: parseInt(formData.size, 10),
            is_primary: formData.is_primary,
            image: imageString,
            // Ensure we send the value exactly as selected (string or number)
            venue: formData.venue,
            parent_pitch: parseInt(formData.parent_pitch || 0, 10)
        };

        console.log("Form Submitted Successfully:", JSON.stringify(payload, null, 2));

        if (onSuccess) onSuccess();
        alert("Check Console for JSON Structure");
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Layers className="text-primary-100" />
                            Create New Pitch
                        </h2>
                        <p className="text-primary-100 text-sm mt-1">Fill in the details for the venue pitch.</p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-primary-600 p-2 rounded-lg">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">

                {/* Section 1: Names & Translation */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2">
                        Basic Information
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="relative">
                            <MainInput
                                label="Pitch Name (English)"
                                name="name"
                                placeholder="e.g. Football Field"
                                icon={Type}
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                required
                            />
                            {activeField === 'ar' && loadingEn && (
                                <span className="absolute top-0 right-0 text-xs text-blue-500 mt-2 mr-2 font-medium animate-pulse">
                                    Translating...
                                </span>
                            )}
                        </div>

                        <div className="relative">
                            <MainInput
                                label="Pitch Name (Arabic)"
                                name="name_ar"
                                placeholder="اسم الملعب"
                                icon={Globe}
                                value={formData.name_ar}
                                onChange={handleChange}
                                error={errors.name_ar}
                                required
                                style={{ direction: 'rtl' }}
                            />
                            {activeField === 'en' && loadingAr && (
                                <span className="absolute top-0 left-0 text-xs text-blue-500 mt-2 ml-2 font-medium animate-pulse">
                                    Translating...
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 2: Image Upload */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pitch Image
                    </label>

                    <div
                        onClick={() => fileInputRef.current.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`
                            relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
                            ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'}
                        `}
                    >
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={onFileChange}
                        />

                        {imagePreview ? (
                            <div className="relative w-full h-full p-2 group">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-contain rounded-md"
                                />
                                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-md transition-all">
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-4">
                                <div className="bg-primary-100 text-primary-600 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                    <UploadCloud size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                    <span className="text-primary-600">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                            </div>
                        )}
                    </div>
                    {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                </div>

                {/* Section 3: Numeric Details */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2">
                        Pitch Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MainInput
                            label="Price Per Hour"
                            name="price_per_hour"
                            type="number"
                            placeholder="0.00"
                            icon={DollarSign}
                            value={formData.price_per_hour}
                            onChange={handleChange}
                            error={errors.price_per_hour}
                            min="0"
                            step="0.01"
                        />
                        <MainInput
                            label="Size"
                            name="size"
                            type="number"
                            placeholder="Square meters"
                            icon={Maximize}
                            value={formData.size}
                            onChange={handleChange}
                            error={errors.size}
                            min="0"
                        />

                        {/* --- MODIFIED VENUE DROPDOWN START --- */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">
                                Venue
                            </label>
                            <div className="relative">
                                {/* Icon */}
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <MapPin size={20} />
                                </div>
                                {/* Select Input using label/value structure */}
                                <select
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleChange}
                                    className={`
                                        w-full pl-10 pr-10 py-2 border rounded-lg outline-none transition-all appearance-none bg-white
                                        ${errors.venue
                                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                                    }
                                    `}
                                >
                                    <option value="">Select Venue</option>
                                    {venuesData && venuesData.map((item, index) => (
                                        <option key={index} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                                {/* Chevron Icon */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                            {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
                        </div>
                        {/* --- MODIFIED VENUE DROPDOWN END --- */}

                        <MainInput
                            label="Parent Pitch ID"
                            name="parent_pitch"
                            type="number"
                            placeholder="ID"
                            icon={Layers}
                            value={formData.parent_pitch}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Section 4: Status */}
                <div className="bg-primary-50 p-6 rounded-lg space-y-4 border border-primary-100">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2">
                        Status Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MainInput
                            type="checkbox"
                            label="Is Active?"
                            name="is_active"
                            value={formData.is_active}
                            onChange={handleChange}
                            helperText="Visible to customers"
                        />
                        <MainInput
                            type="checkbox"
                            label="Is Primary Pitch?"
                            name="is_primary"
                            value={formData.is_primary}
                            onChange={handleChange}
                            helperText="Main pitch for this category"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all">
                        Cancel
                    </button>
                    <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg">
                        <Save size={20} />
                        Save Pitch Data
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PitchesForm;