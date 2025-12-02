import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx';
// Removed useTranslation as we only have one input now
import { uploadService } from '../../services/upload/uploadService.js';
import { tournamentsService } from '../../services/tournaments/tournamentsService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';

import {
    Type, DollarSign, Calendar, Trophy, Save, X,
    UploadCloud, Trash2, ChevronDown, Users, Loader2, Edit,
    Clock, AlignLeft, FileText, Activity, Image as ImageIcon, Plus
} from 'lucide-react';
import { toast } from 'react-toastify';

const TournamentsForm = ({ venuesList = [], sportsList = [], onCancel, onSuccess, initialData = null }) => {

    // --- STATE ---
    const [formData, setFormData] = useState({
        name: '', // Single name field
        subtitle: '',
        description: '',
        rules: '',
        prizes: '',
        start_date: '',
        end_date: '',
        registration_deadline: '',
        start_time: '',
        end_time: '',
        max_teams: '',
        entry_fee: '',
        scoring_system: 'knockout',
        sport: '',
        venue: '',
        is_active: true,
    });

    // Cover Image State
    const [selectedImage, setSelectedImage] = useState(null);
    const [uniqueName, setUniqueName] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [finalImageUrl, setFinalImageUrl] = useState('');
    const [isImageUploading, setIsImageUploading] = useState(false);

    // Gallery Images State (Multiple)
    const [galleryImages, setGalleryImages] = useState([]);
    const galleryInputRef = useRef(null);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    // --- POPULATE FORM IF EDITING ---
    useEffect(() => {
        if (initialData) {
            setFormData({
                // Prefer the top-level name, or fallback to translation if structure differs
                name: initialData.name || initialData.translations?.en?.name || '',
                subtitle: initialData.subtitle || '',
                description: initialData.description || '',
                rules: initialData.rules || '',
                prizes: initialData.prizes || '',
                start_date: initialData.start_date ? initialData.start_date.split('T')[0] : '',
                end_date: initialData.end_date ? initialData.end_date.split('T')[0] : '',
                registration_deadline: initialData.registration_deadline ? initialData.registration_deadline.split('T')[0] : '',
                start_time: initialData.start_time ? initialData.start_time.substring(0, 5) : '',
                end_time: initialData.end_time ? initialData.end_time.substring(0, 5) : '',
                max_teams: initialData.max_teams || '',
                entry_fee: initialData.entry_fee || '',
                scoring_system: initialData.scoring_system || 'knockout',
                sport: initialData.sport || '',
                venue: initialData.venue || '',
                is_active: initialData.is_active ?? true,
            });

            // Handle Cover Image
            if (initialData.cover_image) {
                setImagePreview(initialData.cover_image);
                setFinalImageUrl(initialData.cover_image);
                setUniqueName(initialData.cover_image);
            }

            // Handle Gallery Images
            if (initialData.images && Array.isArray(initialData.images)) {
                const formattedGallery = initialData.images.map(img => ({
                    id: img.id || Math.random(),
                    url: img.image,
                    preview: img.image,
                    isUploading: false
                }));
                setGalleryImages(formattedGallery);
            }
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // --- COVER IMAGE UPLOAD ---
    const handleImageSelect = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload a valid image file");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setSelectedImage(file);
        setImagePreview(previewUrl);
        setErrors(prev => ({ ...prev, cover_image: '' }));

        setIsImageUploading(true);
        try {
            const generatedName = generateUniqueFileName(file.name);
            setUniqueName(generatedName);
            const result = await uploadService.processFullUpload(file, generatedName);
            const uploadedUrl = result.url || result.key || result.imageUrl;
            setFinalImageUrl(uploadedUrl);
            toast.success("Cover image uploaded");
        } catch (error) {
            console.error("Image upload failed", error);
            toast.error("Cover image upload failed.");
        } finally {
            setIsImageUploading(false);
        }
    };

    const removeCoverImage = (e) => {
        e.stopPropagation();
        setSelectedImage(null);
        setImagePreview(null);
        setFinalImageUrl('');
        setUniqueName('');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- GALLERY IMAGES UPLOAD (MULTIPLE) ---
    const handleGallerySelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            preview: URL.createObjectURL(file),
            isUploading: true,
            url: ''
        }));

        setGalleryImages(prev => [...prev, ...newImages]);

        const uploadPromises = newImages.map(async (imgObj) => {
            try {
                const generatedName = generateUniqueFileName(imgObj.file.name);
                const result = await uploadService.processFullUpload(imgObj.file, generatedName);
                const uploadedUrl = result.url || result.key || result.imageUrl;

                setGalleryImages(prev => prev.map(item =>
                    item.id === imgObj.id
                        ? { ...item, isUploading: false, url: uploadedUrl }
                        : item
                ));
            } catch (error) {
                console.error("Gallery upload failed", error);
                toast.error(`Failed to upload ${imgObj.file.name}`);
                setGalleryImages(prev => prev.filter(item => item.id !== imgObj.id));
            }
        });

        await Promise.all(uploadPromises);
        if(galleryInputRef.current) galleryInputRef.current.value = "";
    };

    const removeGalleryImage = (id) => {
        setGalleryImages(prev => prev.filter(img => img.id !== id));
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!formData.name) newErrors.name = "Tournament Name is required";
        if (!formData.start_date) newErrors.start_date = "Start Date is required";
        if (!formData.end_date) newErrors.end_date = "End Date is required";
        if (!formData.venue) newErrors.venue = "Venue is required";
        if (!formData.max_teams) newErrors.max_teams = "Max Teams is required";

        // --- NEW REQUIRED FIELDS ---
        if (!formData.sport) newErrors.sport = "Sport is required";
        if (!formData.start_time) newErrors.start_time = "Start Time is required";
        if (!formData.end_time) newErrors.end_time = "End Time is required";
        if (!formData.registration_deadline) newErrors.registration_deadline = "Registration Deadline is required";

        const stillUploading = galleryImages.some(img => img.isUploading);
        if (isImageUploading || stillUploading) {
            toast.warning("Please wait for all images to finish uploading.");
            return;
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            const finalGalleryImages = galleryImages
                .filter(img => img.url)
                .map(img => ({
                    image: img.url
                }));

            // Construct Payload
            const payload = {
                // Mapping the single name to both fields to satisfy backend schema if needed
                translations: {
                    en: { name: formData.name },
                    ar: { name: formData.name } // Fallback to English name for Arabic field
                },
                name: formData.name,
                subtitle: formData.subtitle,
                description: formData.description,
                rules: formData.rules,
                prizes: formData.prizes,

                start_date: formData.start_date,
                end_date: formData.end_date,
                registration_deadline: formData.registration_deadline,
                start_time: formData.start_time ? `${formData.start_time}:00` : null,
                end_time: formData.end_time ? `${formData.end_time}:00` : null,

                max_teams: parseInt(formData.max_teams, 10),
                entry_fee: parseFloat(formData.entry_fee || 0).toFixed(2),
                scoring_system: formData.scoring_system,

                is_active: formData.is_active,

                sport: formData.sport ? parseInt(formData.sport, 10) : null,
                venue: parseInt(formData.venue, 10),

                cover_image: finalImageUrl || uniqueName || "",
                images: finalGalleryImages
            };

            if (initialData) {
                await tournamentsService.update(initialData.id, payload);
            } else {
                await tournamentsService.create(payload);
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error("Submission failed", error);
            if (error.response && error.response.data) {
                toast.error(`Error: ${JSON.stringify(error.response.data)}`);
            } else {
                toast.error("Something went wrong during submission.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const scoringOptions = [
        { label: 'Knockout', value: 'knockout' },
        { label: 'League', value: 'league' },
        { label: 'Group + Knockout', value: 'group_knockout' },
    ];

    const activeSportsList = sportsList.length > 0 ? sportsList : [];

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-teal-500 to-teal-700 px-8 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="text-teal-100" /> : <Trophy className="text-teal-100" />}
                            {initialData ? "Edit Tournament" : "Create New Tournament"}
                        </h2>
                        <p className="text-teal-100 text-sm mt-1">
                            {initialData ? "Update the details for this tournament." : "Fill in the details to launch a new tournament."}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-teal-600 p-2 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">

                {/* --- 1. Basic Info Section --- */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                        <FileText size={20} /> Basic Information
                    </h3>

                    {/* UPDATED: Single Input for Name */}
                    <div className='flex md:flex-row flex-col gap-5'>
                        <div className="w-full">
                            <MainInput
                                label="Tournament Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                icon={Type}
                                required
                                placeholder="Enter tournament name..."
                            />
                        </div>
                        <div className="w-full">
                            <MainInput label="Subtitle" name="subtitle" value={formData.subtitle} onChange={handleChange}
                                       placeholder="e.g. The biggest summer event" icon={AlignLeft}/>
                        </div>
                    </div>




                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3"
                                  className="w-full p-3 border rounded-lg focus:border-teal-500 outline-none text-sm" placeholder="Describe the tournament..." />
                    </div>
                </div>

                {/* --- 2. Cover Image --- */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                    <div
                        onClick={() => !isImageUploading && fileInputRef.current.click()}
                        className={`relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors 
                        ${errors.cover_image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-teal-500'}
                        ${isImageUploading ? 'cursor-wait bg-gray-50' : 'cursor-pointer'}`}
                    >
                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e) => handleImageSelect(e.target.files[0])} disabled={isImageUploading} />

                        {isImageUploading ? (
                            <div className="flex flex-col items-center justify-center">
                                <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-2" />
                                <p className="text-sm font-medium text-gray-600">Uploading...</p>
                            </div>
                        ) : imagePreview ? (
                            <div className="relative w-full h-full p-2 group">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-md" />
                                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-md transition-all">
                                    <button type="button" onClick={removeCoverImage} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"><Trash2 size={20} /></button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-4">
                                <div className="bg-teal-50 text-teal-600 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3"><UploadCloud size={24} /></div>
                                <p className="text-sm font-medium text-gray-700">Click to upload cover</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 3. Gallery Images (Multiple) --- */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">Tournament Gallery (Optional)</label>
                        <button
                            type="button"
                            onClick={() => galleryInputRef.current.click()}
                            className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-xs font-semibold bg-teal-50 px-2 py-1 rounded"
                        >
                            <Plus size={14} /> Add Photos
                        </button>
                    </div>

                    <input type="file" hidden ref={galleryInputRef} accept="image/*" multiple onChange={handleGallerySelect} />

                    {/* Gallery Grid */}
                    {galleryImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {galleryImages.map((img) => (
                                <div key={img.id} className="relative aspect-square border rounded-lg overflow-hidden group bg-gray-50">
                                    {img.isUploading ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                                            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                                        </div>
                                    ) : null}

                                    <img src={img.preview} alt="Gallery" className="w-full h-full object-cover" />

                                    {!img.isUploading && (
                                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                                            <button
                                                type="button"
                                                onClick={() => removeGalleryImage(img.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div
                                onClick={() => galleryInputRef.current.click()}
                                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all text-gray-400 hover:text-teal-600"
                            >
                                <Plus size={24} />
                                <span className="text-xs mt-1">Add More</span>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => galleryInputRef.current.click()}
                            className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50 cursor-pointer transition-all"
                        >
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-medium">Add Gallery Images</p>
                            <p className="text-xs opacity-70">Support multiple upload</p>
                        </div>
                    )}
                </div>

                {/* --- 4. Date & Time --- */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                        <Calendar size={20} /> Schedule
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MainInput type="date" label="Start Date" name="start_date" value={formData.start_date} onChange={handleChange} error={errors.start_date} required />
                        <MainInput type="date" label="End Date" name="end_date" value={formData.end_date} onChange={handleChange} error={errors.end_date} required />

                        {/* UPDATED: Registration Deadline now Required */}
                        <MainInput
                            type="date"
                            label="Registration Deadline"
                            name="registration_deadline"
                            value={formData.registration_deadline}
                            onChange={handleChange}
                            error={errors.registration_deadline}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* UPDATED: Start Time now Required */}
                        <MainInput
                            type="time"
                            label="Start Time"
                            name="start_time"
                            value={formData.start_time}
                            onChange={handleChange}
                            icon={Clock}
                            error={errors.start_time}
                            required
                        />
                        {/* UPDATED: End Time now Required */}
                        <MainInput
                            type="time"
                            label="End Time"
                            name="end_time"
                            value={formData.end_time}
                            onChange={handleChange}
                            icon={Clock}
                            error={errors.end_time}
                            required
                        />
                    </div>
                </div>

                {/* --- 5. Game Details --- */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                        <Activity size={20} /> Game Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Venue <span className='text-red-500'>*</span></label>
                            <div className="relative">
                                <select name="venue" value={formData.venue} onChange={handleChange} className="w-full pl-3 pr-10 py-2 border rounded-lg bg-white outline-none focus:border-teal-500">
                                    <option value="">Select Venue</option>
                                    {venuesList && venuesList.map((item, index) => <option key={index} value={item.value}>{item.label}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
                        </div>

                        {/* UPDATED: Sport now Required */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Sport <span className='text-red-500'>*</span></label>
                            <div className="relative">
                                <select
                                    name="sport"
                                    value={formData.sport}
                                    onChange={handleChange}
                                    className={`w-full pl-3 pr-10 py-2 border rounded-lg bg-white outline-none focus:border-teal-500 ${errors.sport ? 'border-red-500' : ''}`}
                                >
                                    <option value="">Select Sport</option>
                                    {activeSportsList.map((item, index) => <option key={index} value={item.value}>{item.label}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            {errors.sport && <p className="text-red-500 text-xs mt-1">{errors.sport}</p>}
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Scoring System</label>
                            <div className="relative">
                                <select name="scoring_system" value={formData.scoring_system} onChange={handleChange} className="w-full pl-3 pr-10 py-2 border rounded-lg bg-white outline-none focus:border-teal-500">
                                    {scoringOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        <MainInput label="Max Teams" name="max_teams" type="number" value={formData.max_teams} onChange={handleChange} error={errors.max_teams} icon={Users} required />
                        <MainInput label="Entry Fee" name="entry_fee" type="number" value={formData.entry_fee} onChange={handleChange} icon={DollarSign} />
                    </div>
                </div>

                {/* --- 6. Rules & Prizes --- */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                        <FileText size={20} /> Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Rules</label>
                            <textarea name="rules" value={formData.rules} onChange={handleChange} rows="4" className="w-full p-3 border rounded-lg focus:border-teal-500 outline-none text-sm" placeholder="Enter tournament rules..." />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Prizes</label>
                            <textarea name="prizes" value={formData.prizes} onChange={handleChange} rows="4" className="w-full p-3 border rounded-lg focus:border-teal-500 outline-none text-sm" placeholder="Enter prize details..." />
                        </div>
                    </div>
                </div>

                {/* --- 7. Status --- */}
                <div className="bg-primary-50 p-6 rounded-lg space-y-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MainInput type="checkbox" label="Is Active?" name="is_active" value={formData.is_active} onChange={handleChange} />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmitting || isImageUploading} className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {initialData ? "Update Tournament" : "Save Tournament"}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TournamentsForm;