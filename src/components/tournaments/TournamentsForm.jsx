import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx'; // Adjust path if needed
import { uploadService } from '../../services/upload/uploadService.js';
import { tournamentsService } from '../../services/tournaments/tournamentsService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { IMAGE_BASE_URL } from '../../utils/ImageBaseURL.js';
import { useTranslation } from 'react-i18next'; // Import Hook

import {
    Type, DollarSign, Calendar, Trophy, Save, X,
    UploadCloud, Trash2, ChevronDown, Users, Loader2, Edit,
    Clock, AlignLeft, FileText, Activity, Image as ImageIcon, Plus, Check,
    Globe, Lock, Info, CheckCircle2 // Added for Visibility section
} from 'lucide-react';
import { toast } from 'react-toastify';

const TournamentsForm = ({ venuesList = [], sportsList = [], onCancel, onSuccess, initialData = null }) => {
    const { t } = useTranslation('tournamentForm'); // Initialize hook

    // --- STATE ---
    const [formData, setFormData] = useState({
        name: '',
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
        is_private: false, // Added for Visibility
    });

    // --- IMAGE STATE ---
    const [coverImage, setCoverImage] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs
    const coverInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    // --- HELPER: PROCESS SERVER IMAGES ---
    const processImage = (imagePath) => {
        if (!imagePath) return null;
        return imagePath.startsWith('http') ? imagePath : `${IMAGE_BASE_URL}${imagePath}`;
    };

    // --- POPULATE FORM IF EDITING ---
    useEffect(() => {
        if (initialData) {
            setFormData({
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
                is_private: initialData.private ?? false, // Handle initial private status
            });

            if (initialData.cover_image) {
                setCoverImage({
                    id: 'initial_cover',
                    preview: processImage(initialData.cover_image),
                    serverUrl: initialData.cover_image,
                    uniqueName: initialData.cover_image,
                    uploading: false
                });
            }

            if (initialData.images && Array.isArray(initialData.images)) {
                const formattedGallery = initialData.images.map((img, index) => ({
                    id: img.id || `existing_${index}`,
                    preview: processImage(img.image),
                    serverUrl: img.image,
                    uniqueName: img.image,
                    uploading: false
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

    // --- COVER IMAGE HANDLERS ---
    const handleCoverSelect = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            toast.error(t('messages.invalid_image'));
            return;
        }

        const newImage = {
            id: Date.now(),
            file,
            preview: URL.createObjectURL(file),
            uploading: true,
            serverUrl: null,
            uniqueName: null
        };
        setCoverImage(newImage);
        setErrors(prev => ({ ...prev, cover_image: '' }));

        const upload = async () => {
            try {
                const generatedName = generateUniqueFileName(file.name);
                const result = await uploadService.processFullUpload(file, generatedName);
                const uploadedUrl = result.url || generatedName;

                setCoverImage(prev => ({
                    ...prev,
                    serverUrl: uploadedUrl,
                    uniqueName: generatedName,
                    uploading: false
                }));
                toast.success(t('messages.cover_uploaded'));
            } catch (error) {
                console.error("Cover upload failed", error);
                toast.error(t('messages.cover_failed'));
                setCoverImage(null);
            }
        };
        upload();
        if (coverInputRef.current) coverInputRef.current.value = "";
    };

    const removeCoverImage = (e) => {
        if(e) e.stopPropagation();
        setCoverImage(null);
    };

    // --- GALLERY IMAGES HANDLERS ---
    const handleGallerySelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            preview: URL.createObjectURL(file),
            uploading: true,
            serverUrl: null,
            uniqueName: null
        }));

        setGalleryImages(prev => [...prev, ...newImages]);

        const uploadPromises = newImages.map(async (imgObj) => {
            try {
                const generatedName = generateUniqueFileName(imgObj.file.name);
                const result = await uploadService.processFullUpload(imgObj.file, generatedName);
                const uploadedUrl = result.url || generatedName;

                setGalleryImages(prev => prev.map(item =>
                    item.id === imgObj.id
                        ? { ...item, uploading: false, serverUrl: uploadedUrl, uniqueName: generatedName }
                        : item
                ));
            } catch (error) {
                console.error("Gallery upload failed", error);
                toast.error(t('messages.gallery_failed', { fileName: imgObj.file.name }));
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

        const newErrors = {};
        if (!formData.name) newErrors.name = t('errors.name_required');
        if (!formData.start_date) newErrors.start_date = t('errors.start_date_required');
        if (!formData.end_date) newErrors.end_date = t('errors.end_date_required');
        if (!formData.venue) newErrors.venue = t('errors.venue_required');
        if (!formData.max_teams) newErrors.max_teams = t('errors.max_teams_required');
        if (!formData.sport) newErrors.sport = t('errors.sport_required');
        if (!formData.start_time) newErrors.start_time = t('errors.start_time_required');
        if (!formData.end_time) newErrors.end_time = t('errors.end_time_required');
        if (!formData.registration_deadline) newErrors.registration_deadline = t('errors.reg_deadline_required');

        if (coverImage?.uploading) {
            toast.warning(t('messages.wait_cover'));
            return;
        }
        const galleryUploading = galleryImages.some(img => img.uploading);
        if (galleryUploading) {
            toast.warning(t('messages.wait_gallery'));
            return;
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error(t('messages.fill_required'));
            return;
        }

        setIsSubmitting(true);

        try {
            const finalCoverImage = coverImage ? (coverImage.uniqueName || coverImage.serverUrl) : "";
            const finalGalleryImages = galleryImages
                .filter(img => img.uniqueName || img.serverUrl)
                .map(img => ({
                    image: img.uniqueName || img.serverUrl
                }));

            const payload = {
                translations: {
                    en: { name: formData.name },
                    ar: { name: formData.name }
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
                private: formData.is_private, // Added key as requested
                sport: formData.sport ? parseInt(formData.sport, 10) : null,
                venue: parseInt(formData.venue, 10),
                cover_image: finalCoverImage,
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
                toast.error(t('messages.submission_error'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const scoringOptions = [
        { label: t('options.knockout'), value: 'knockout' },
        { label: t('options.league'), value: 'league' },
    ];

    const activeSportsList = sportsList.length > 0 ? sportsList : [];

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-teal-500 to-teal-700 px-8 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="text-teal-100" /> : <Trophy className="text-teal-100" />}
                            {initialData ? t('header.edit_title') : t('header.create_title')}
                        </h2>
                        <p className="text-teal-100 text-sm mt-1">
                            {initialData ? t('header.edit_subtitle') : t('header.create_subtitle')}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-teal-600 p-2 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* --- 1. Basic Info --- */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                        <FileText size={20} /> {t('sections.basic_info')}
                    </h3>

                    <div className='flex md:flex-row flex-col gap-5'>
                        <div className="w-full">
                            <MainInput
                                label={t('fields.name.label')}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                icon={Type}
                                required
                                placeholder={t('fields.name.placeholder')}
                            />
                        </div>
                        <div className="w-full">
                            <MainInput
                                label={t('fields.subtitle.label')}
                                name="subtitle"
                                value={formData.subtitle}
                                onChange={handleChange}
                                placeholder={t('fields.subtitle.placeholder')}
                                icon={AlignLeft}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">{t('fields.description.label')}</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full p-3 border rounded-lg focus:border-teal-500 outline-none text-sm"
                            placeholder={t('fields.description.placeholder')}
                        />
                    </div>
                </div>

                {/* --- 2. Cover Image --- */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                        <ImageIcon size={20} /> {t('sections.cover_image')}
                    </h3>
                    <div className="w-full">
                        {coverImage ? (
                            <div className="relative group w-full h-64 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                                <img
                                    src={coverImage.preview}
                                    alt="Cover"
                                    className={`w-full h-full object-cover transition-opacity ${coverImage.uploading ? 'opacity-50' : 'opacity-100'}`}
                                />
                                {coverImage.uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Loader2 className="animate-spin text-white w-8 h-8" />
                                    </div>
                                )}
                                {!coverImage.uploading && (coverImage.serverUrl || coverImage.uniqueName) && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                        <Check size={14} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all cursor-pointer" onClick={(e) => removeCoverImage(e)}>
                                    <button
                                        type="button"
                                        onClick={(e) => removeCoverImage(e)}
                                        className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transform hover:scale-110 transition-transform"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer bg-white hover:bg-teal-50 hover:shadow-sm ${errors.cover_image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-teal-500'}`}>
                                <input
                                    type="file"
                                    hidden
                                    ref={coverInputRef}
                                    accept="image/*"
                                    onChange={handleCoverSelect}
                                />
                                <div className="p-4 bg-teal-100 rounded-full mb-4 text-teal-600">
                                    <UploadCloud className="w-10 h-10" />
                                </div>
                                <span className="text-base text-gray-700 font-semibold">{t('images.click_to_upload')}</span>
                                <span className="text-sm text-gray-500 mt-1">{t('images.formats')}</span>
                            </label>
                        )}
                    </div>
                </div>

                {/* --- 3. Gallery Images --- */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">{t('sections.gallery')}</label>
                        <button
                            type="button"
                            onClick={() => galleryInputRef.current.click()}
                            className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-xs font-semibold bg-teal-50 px-2 py-1 rounded border border-teal-200"
                        >
                            <Plus size={14} /> {t('images.add_photos')}
                        </button>
                    </div>

                    <input type="file" hidden ref={galleryInputRef} accept="image/*" multiple onChange={handleGallerySelect} />

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {galleryImages.map((img) => (
                            <div key={img.id} className="relative aspect-square border rounded-lg overflow-hidden group bg-gray-50 shadow-sm">
                                <img
                                    src={img.preview}
                                    alt="Gallery"
                                    className={`w-full h-full object-cover ${img.uploading ? 'opacity-50' : 'opacity-100'}`}
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150?text=Error'; }}
                                />
                                {img.uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                                    </div>
                                )}
                                {!img.uploading && (
                                    <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                                        <Check size={10} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryImage(img.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div
                            onClick={() => galleryInputRef.current.click()}
                            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all text-gray-400 hover:text-teal-600"
                        >
                            <Plus size={24} />
                            <span className="text-xs mt-1 font-medium">{t('images.add_more')}</span>
                        </div>
                    </div>
                </div>

                {/* --- 4. Date & Time --- */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                        <Calendar size={20} /> {t('sections.schedule')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MainInput type="date" label={t('fields.start_date')} name="start_date" value={formData.start_date} onChange={handleChange} error={errors.start_date} required />
                        <MainInput type="date" label={t('fields.end_date')} name="end_date" value={formData.end_date} onChange={handleChange} error={errors.end_date} required />
                        <MainInput type="date" label={t('fields.registration_deadline')} name="registration_deadline" value={formData.registration_deadline} onChange={handleChange} error={errors.registration_deadline} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MainInput type="time" label={t('fields.start_time')} name="start_time" value={formData.start_time} onChange={handleChange} icon={Clock} error={errors.start_time} required />
                        <MainInput type="time" label={t('fields.end_time')} name="end_time" value={formData.end_time} onChange={handleChange} icon={Clock} error={errors.end_time} required />
                    </div>
                </div>

                {/* --- 5. Game Details --- */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                        <Activity size={20} /> {t('sections.game_details')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">{t('fields.venue.label')} <span className='text-red-500'>*</span></label>
                            <div className="relative">
                                <select name="venue" value={formData.venue} onChange={handleChange} className="w-full pl-3 pr-10 py-2 border rounded-lg bg-white outline-none focus:border-teal-500">
                                    <option value="">{t('fields.venue.placeholder')}</option>
                                    {venuesList && venuesList.map((item, index) => <option key={index} value={item.value}>{item.label}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
                        </div>

                        {/* --- SPORT SELECTION --- */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">{t('fields.sport.label')} <span className='text-red-500'>*</span></label>
                            <div className="relative">
                                <select
                                    name="sport"
                                    value={formData.sport}
                                    onChange={handleChange}
                                    className={`w-full pl-3 pr-10 py-2 border rounded-lg bg-white outline-none focus:border-teal-500 ${errors.sport ? 'border-red-500' : ''}`}
                                >
                                    <option value="">{t('fields.sport.placeholder')}</option>
                                    {activeSportsList.map((item, index) => <option key={index} value={item.value}>{item.label}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            {errors.sport && <p className="text-red-500 text-xs mt-1">{errors.sport}</p>}
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">{t('fields.scoring_system')}</label>
                            <div className="relative">
                                <select name="scoring_system" value={formData.scoring_system} onChange={handleChange} className="w-full pl-3 pr-10 py-2 border rounded-lg bg-white outline-none focus:border-teal-500">
                                    {scoringOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        <MainInput label={t('fields.max_teams')} name="max_teams" type="number" value={formData.max_teams} onChange={handleChange} error={errors.max_teams} icon={Users} required />
                        <MainInput label={t('fields.entry_fee')} name="entry_fee" type="number" value={formData.entry_fee} onChange={handleChange} icon={DollarSign} />
                    </div>
                </div>

                {/* --- Tournament Visibility --- */}
                <div className="space-y-4">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-800">{t('visibility.title')}</h3>
                        <p className="text-sm text-gray-500">{t('visibility.subtitle')}</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-4">
                            {/* Public Option */}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({...prev, is_private: false}))}
                                className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-2 transition-all min-w-[200px] ${
                                    !formData.is_private
                                        ? 'bg-teal-600 border-teal-600 text-white hover:bg-teal-700 hover:border-teal-700 shadow-md'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-teal-200'
                                }`}
                            >
                                {!formData.is_private && <Check size={18} className="text-teal-200"/>}
                                <Globe size={20}/>
                                <span className="font-bold">{t('visibility.public')}</span>
                            </button>

                            {/* Private Option */}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({...prev, is_private: true}))}
                                className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-2 transition-all min-w-[200px] ${
                                    formData.is_private
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-orange-200'
                                }`}
                            >
                                {formData.is_private && <Check size={18} className="text-orange-200"/>}
                                <Lock size={20}/>
                                <span className="font-bold">{t('visibility.private')}</span>
                            </button>
                        </div>

                        {/* Description Box */}
                        {!formData.is_private ? (
                            <div
                                className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-100 rounded-lg text-teal-700 text-sm animate-in fade-in slide-in-from-top-1">
                                <CheckCircle2 size={20} className="text-teal-600"/>
                                <span>{t('visibility.public_desc')}</span>
                            </div>
                        ) : (
                            <div
                                className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-lg text-orange-700 text-sm animate-in fade-in slide-in-from-top-1">
                                <Info size={20} className="text-orange-500"/>
                                <span>{t('visibility.private_desc')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 6. Rules & Prizes --- */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                        <FileText size={20} /> {t('sections.details')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">{t('fields.rules.label')}</label>
                            <textarea
                                name="rules"
                                value={formData.rules}
                                onChange={handleChange}
                                rows="4"
                                className="w-full p-3 border rounded-lg focus:border-teal-500 outline-none text-sm"
                                placeholder={t('fields.rules.placeholder')}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">{t('fields.prizes.label')}</label>
                            <textarea
                                name="prizes"
                                value={formData.prizes}
                                onChange={handleChange}
                                rows="4"
                                className="w-full p-3 border rounded-lg focus:border-teal-500 outline-none text-sm"
                                placeholder={t('fields.prizes.placeholder')}
                            />
                        </div>
                    </div>
                </div>

                {/* --- 7. Status --- */}
                <div className="bg-primary-50 p-6 rounded-lg space-y-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MainInput type="checkbox" label={t('fields.is_active')} name="is_active" value={formData.is_active} onChange={handleChange} />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors">{t('buttons.cancel')}</button>
                    <button type="submit" disabled={isSubmitting || coverImage?.uploading || galleryImages.some(img => img.uploading)} className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {initialData ? t('buttons.update') : t('buttons.save')}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TournamentsForm;