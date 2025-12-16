import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx';
import { uploadService } from '../../services/upload/uploadService.js';
import { authService } from '../../services/authService.js';
import { pitchOwnersService } from '../../services/pitchOwners/pitchOwnersService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { getImageUrl, extractFilename } from '../../utils/imageUtils';
import { citiesList } from '../../services/citiesList/citiesListService.js';
import { useTranslation } from 'react-i18next';

import {
    Save, X, UploadCloud, Trash2, Loader2,
    Edit, User, Mail, Phone, MapPin, Percent,
    FileText, Building, CreditCard, Image as ImageIcon,
    Search, ChevronDown, Check // Added icons
} from 'lucide-react';
import { toast } from 'react-toastify';

const PitchOwnerForm = ({ onCancel, onSuccess, initialData = null }) => {
    const { t } = useTranslation();

    // --- STATE ---
    const [formData, setFormData] = useState({
        user_id: '',
        user_info: '',
        name: '',
        address: '',
        email: '',
        contact_name: '',
        contact_phone: '',
        eid: '',
        commission_rate: '',
        state: '',
        city: '',
        is_active: true,
    });

    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // --- DROPDOWN SEARCH STATE ---
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const userDropdownRef = useRef(null); // Ref for click outside

    // --- PROFILE IMAGE STATES (LOGO) ---
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [finalImageName, setFinalImageName] = useState('');
    const [isImageUploading, setIsImageUploading] = useState(false);
    const fileInputRef = useRef(null);

    // --- COVER IMAGE STATES ---
    const [selectedCoverImage, setSelectedCoverImage] = useState(null);
    const [coverImagePreview, setCoverImagePreview] = useState(null);
    const [finalCoverImageName, setFinalCoverImageName] = useState('');
    const [isCoverImageUploading, setIsCoverImageUploading] = useState(false);
    const coverInputRef = useRef(null);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- CLICK OUTSIDE HANDLER ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setIsUserDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [userDropdownRef]);

    // --- FETCH USERS FOR DROPDOWN ---
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const data = await authService.getUsers({page_limit: 1000});
                const usersArray = data.data.results;
                const userList = Array.isArray(usersArray) ? usersArray : (data.results || []);
                setUsers(userList);
            } catch (error) {
                console.error("Failed to fetch users", error);
                toast.error(t('pitchOwnerForm:messages.usersLoadError'));
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, [t]);

    // --- POPULATE FORM WITH API DATA ---
    useEffect(() => {
        if (initialData) {
            const data = initialData.data || initialData;

            setFormData({
                user_id: data.user_id || data.user || data.user_info?.id || '',
                user_info: data.user_info?.name || '',
                name: data.pitch_name || data.name || (data.translations?.en?.name) || '',
                address: data.pitch_address || data.address || '',
                email: data.email || '',
                contact_name: data.contact_name || '',
                contact_phone: data.contact_phone || '',
                eid: data.eid || '',
                commission_rate: data.commission_rate || '',
                state: data.state || '',
                city: data.city || '',
                is_active: data.is_active !== undefined ? data.is_active : true,
            });

            // Handle Profile Image using Utils
            const img = data.profile_image || data.image;
            if (img) {
                setImagePreview(getImageUrl(img));
                setFinalImageName(extractFilename(img));
            }

            // Handle Cover Image using Utils
            const cover = data.cover_image;
            if (cover) {
                setCoverImagePreview(getImageUrl(cover));
                setFinalCoverImageName(extractFilename(cover));
            }
        }
    }, [initialData]);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // --- USER SELECTION HANDLER ---
    const handleSelectUser = (user) => {
        setFormData(prev => ({ ...prev, user_id: user.id }));
        // Optional: Auto-fill other fields if needed
        // setFormData(prev => ({ ...prev, user_id: user.id, email: user.email }));
        setIsUserDropdownOpen(false);
        setUserSearchTerm(''); // Clear search logic so display shows selected name
        if (errors.user_id) setErrors(prev => ({ ...prev, user_id: '' }));
    };

    // --- GET DISPLAY NAME ---
    const getSelectedUserDisplay = () => {
        if (isUserDropdownOpen) return userSearchTerm;

        if (formData.user_id) {
            const selected = users.find(u => u.id === formData.user_id);
            if (selected) return `${selected.name} (${selected.phone})`;
            // Fallback if user ID exists but list isn't loaded or not found
            if (initialData && initialData.user_info) return initialData.user_info.name;
            return formData.user_id;
        }
        return '';
    };

    // --- FILTER USERS ---
    const filteredUsers = users.filter(user => {
        if (!userSearchTerm) return true;
        const searchLower = userSearchTerm.toLowerCase();
        return (
            (user.name && user.name.toLowerCase().includes(searchLower)) ||
            (user.phone && user.phone.includes(searchLower)) ||
            (user.email && user.email.toLowerCase().includes(searchLower))
        );
    });

    // ... (Image upload handlers remain the same: handleImageSelect, onFileChange, removeImage, handleCoverSelect, etc.) ...

    // --- PROFILE IMAGE UPLOAD LOGIC ---
    const handleImageSelect = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error(t('pitchOwnerForm:validation.invalidImage'));
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setSelectedImage(file);
        setImagePreview(previewUrl);
        setErrors(prev => ({ ...prev, image: '' })); // Clear error on select

        setIsImageUploading(true);
        try {
            const generatedName = generateUniqueFileName(file.name);
            const result = await uploadService.processFullUpload(file, generatedName);
            const uploadedName = result.key || result.fileName || generatedName;
            setFinalImageName(uploadedName);
            toast.success(t('pitchOwnerForm:messages.profileUploadSuccess'));
        } catch (error) {
            console.error("Image upload failed", error);
            setSelectedImage(null);
            setImagePreview(null);
            setFinalImageName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            toast.error(t('pitchOwnerForm:messages.profileUploadError'));
        } finally {
            setIsImageUploading(false);
        }
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) handleImageSelect(file);
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setSelectedImage(null);
        setImagePreview(null);
        setFinalImageName('');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- COVER IMAGE UPLOAD LOGIC ---
    const handleCoverSelect = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error(t('pitchOwnerForm:validation.invalidImage'));
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setSelectedCoverImage(file);
        setCoverImagePreview(previewUrl);

        setIsCoverImageUploading(true);
        try {
            const generatedName = generateUniqueFileName(file.name);
            const result = await uploadService.processFullUpload(file, generatedName);
            const uploadedName = result.key || result.fileName || generatedName;
            setFinalCoverImageName(uploadedName);
            toast.success(t('pitchOwnerForm:messages.coverUploadSuccess'));
        } catch (error) {
            console.error("Cover upload failed", error);
            setSelectedCoverImage(null);
            setCoverImagePreview(null);
            setFinalCoverImageName('');
            if (coverInputRef.current) coverInputRef.current.value = '';
            toast.error(t('pitchOwnerForm:messages.coverUploadError'));
        } finally {
            setIsCoverImageUploading(false);
        }
    };

    const onCoverFileChange = (e) => {
        const file = e.target.files[0];
        if (file) handleCoverSelect(file);
    };

    const removeCoverImage = (e) => {
        e.stopPropagation();
        setSelectedCoverImage(null);
        setCoverImagePreview(null);
        setFinalCoverImageName('');
        if (coverInputRef.current) coverInputRef.current.value = "";
    };

    // Drag & Drop Helpers
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDropProfile = (e) => {
        e.preventDefault(); e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) handleImageSelect(file);
    };
    const handleDropCover = (e) => {
        e.preventDefault(); e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) handleCoverSelect(file);
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.user_id) newErrors.user_id = t('pitchOwnerForm:validation.userRequired');
        if (!formData.name) newErrors.name = t('pitchOwnerForm:validation.nameRequired');
        if (!formData.email) newErrors.email = t('pitchOwnerForm:validation.emailRequired');
        if (!formData.contact_phone) newErrors.contact_phone = t('pitchOwnerForm:validation.phoneRequired');
        if (!formData.commission_rate) newErrors.commission_rate = t('pitchOwnerForm:validation.commissionRequired');

        // VALIDATE IMAGE REQUIREMENT
        if (!finalImageName) {
            newErrors.image = t('pitchOwnerForm:validation.imageRequired');
        }

        if (isImageUploading || isCoverImageUploading) {
            toast.warning(t('pitchOwnerForm:validation.waitUpload'));
            return;
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                kind: 'pitch_owner',
                pitch_name: formData.name,
                pitch_address: formData.address,
                translations: {
                    en: { name: formData.name },
                    ar: { name: formData.name }
                },
                profile_image: finalImageName || null,
                cover_image: finalCoverImageName || null
            };

            const targetId = initialData?.data?.id || initialData?.id;

            if (targetId) {
                await pitchOwnersService.updateStaff(targetId, payload);
            } else {
                await pitchOwnersService.createStaff(payload);
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error("Submission failed", error);
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
                            {initialData ? <Edit className="text-primary-100" /> : <Building className="text-primary-100" />}
                            {initialData ? t('pitchOwnerForm:header.editTitle') : t('pitchOwnerForm:header.createTitle')}
                        </h2>
                        <p className="text-primary-100 text-sm mt-1">
                            {initialData ? t('pitchOwnerForm:header.editSubtitle') : t('pitchOwnerForm:header.createSubtitle')}
                        </p>
                    </div>
                    <button onClick={onCancel} className="text-white hover:bg-primary-600 p-2 rounded-lg">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">

                {/* Section 1: User Association */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2 flex items-center gap-2">
                        <User size={20} /> {t('pitchOwnerForm:sections.user.title')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* --- SEARCHABLE USERS DROPDOWN --- */}
                        <div className="flex flex-col gap-1 relative" ref={userDropdownRef}>
                            <label className="text-sm font-medium text-gray-700">
                                {t('pitchOwnerForm:sections.user.selectLabel')} <span className="text-red-500">*</span>
                            </label>

                            <div className="relative">
                                {/* The Input Field acting as trigger and search */}
                                <input
                                    type="text"
                                    value={getSelectedUserDisplay()}
                                    onChange={(e) => {
                                        setUserSearchTerm(e.target.value);
                                        setIsUserDropdownOpen(true);
                                    }}
                                    onClick={() => {
                                        setIsUserDropdownOpen(true);
                                        // If clicked and field has data, we might want to keep it or select all.
                                        // Here we ensure it opens.
                                    }}
                                    placeholder={loadingUsers ? t('pitchOwnerForm:sections.user.loading') : t('pitchOwnerForm:sections.user.defaultOption')}
                                    className={`w-full p-3 pr-10 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${errors.user_id ? 'border-red-500' : 'border-gray-200'}`}
                                    disabled={loadingUsers}
                                    autoComplete="off"
                                />

                                <div className="absolute right-3 top-3.5 text-gray-500 pointer-events-none">
                                    {loadingUsers ? <Loader2 size={18} className="animate-spin" /> : <ChevronDown size={18} />}
                                    {/* Alternative: Show Search icon if typing? <Search size={18} /> */}
                                </div>
                            </div>

                            {/* The Dropdown List */}
                            {isUserDropdownOpen && !loadingUsers && (
                                <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                    {filteredUsers.length > 0 ? (
                                        <ul className="py-1">
                                            {filteredUsers.map(user => {
                                                const isSelected = formData.user_id === user.id;
                                                return (
                                                    <li
                                                        key={user.id}
                                                        onClick={() => handleSelectUser(user)}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-primary-50 flex items-center justify-between group ${isSelected ? 'bg-primary-50' : ''}`}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                                                                {user.name}
                                                            </span>
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Phone size={10} /> {user.phone}
                                                            </span>
                                                        </div>
                                                        {isSelected && <Check size={16} className="text-primary-600" />}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-sm">
                                            {t('pitchOwnerForm:messages.noUsersFound', 'No users found')}
                                        </div>
                                    )}
                                </div>
                            )}

                            {errors.user_id && <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>}
                        </div>

                        <MainInput
                            label={t('pitchOwnerForm:sections.user.infoLabel')}
                            name="user_info"
                            value={formData.user_info}
                            onChange={handleChange}
                            icon={FileText}
                            placeholder={t('pitchOwnerForm:sections.user.infoPlaceholder')}
                        />
                    </div>
                </div>

                {/* Section 2: Pitch Details */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2 flex items-center gap-2">
                        <MapPin size={20} /> {t('pitchOwnerForm:sections.pitch.title')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MainInput
                            label={t('pitchOwnerForm:sections.pitch.nameLabel')}
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            icon={Building}
                            required
                        />

                        <MainInput
                            label={t('pitchOwnerForm:sections.pitch.addressLabel')}
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            icon={MapPin}
                            placeholder={t('pitchOwnerForm:sections.pitch.addressPlaceholder')}
                        />

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">{t('pitchOwnerForm:sections.pitch.cityLabel')}</label>
                            <div className="relative">
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                >
                                    <option value="">{t('pitchOwnerForm:sections.pitch.cityDefault')}</option>
                                    {citiesList.map(city => (
                                        <option key={city.value} value={city.value}>{city.label}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                            </div>
                        </div>

                        <MainInput
                            label={t('pitchOwnerForm:sections.pitch.stateLabel')}
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            icon={MapPin}
                        />
                    </div>
                </div>

                {/* Section 3: Contact & Financials */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2 flex items-center gap-2">
                        <CreditCard size={20}/> {t('pitchOwnerForm:sections.contact.title')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MainInput
                            label={t('pitchOwnerForm:sections.contact.emailLabel')}
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            icon={Mail}
                            required
                        />
                        <MainInput
                            label={t('pitchOwnerForm:sections.contact.personLabel')}
                            name="contact_name"
                            value={formData.contact_name}
                            onChange={handleChange}
                            icon={User}
                        />
                        <MainInput
                            label={t('pitchOwnerForm:sections.contact.phoneLabel')}
                            name="contact_phone"
                            value={formData.contact_phone}
                            onChange={handleChange}
                            error={errors.contact_phone}
                            icon={Phone}
                            required
                        />
                        <MainInput
                            label={t('pitchOwnerForm:sections.contact.eidLabel')}
                            name="eid"
                            value={formData.eid}
                            onChange={handleChange}
                            icon={FileText}
                        />
                        <MainInput
                            label={t('pitchOwnerForm:sections.contact.commissionLabel')}
                            name="commission_rate"
                            type="number"
                            value={formData.commission_rate}
                            onChange={handleChange}
                            error={errors.commission_rate}
                            icon={Percent}
                            placeholder={t('pitchOwnerForm:sections.contact.commissionPlaceholder')}
                            required
                        />
                    </div>
                    {/* Status */}
                    <div className="bg-primary-50 p-6 rounded-lg space-y-4 border border-primary-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MainInput
                                type="checkbox"
                                label={t('pitchOwnerForm:sections.contact.isActive')}
                                name="is_active"
                                value={formData.is_active}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 4: Images (Profile & Cover) */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2 flex items-center gap-2">
                        <ImageIcon size={20} /> {t('pitchOwnerForm:sections.media.title')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Profile/Pitch Image (REQUIRED) */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('pitchOwnerForm:sections.media.logoLabel')} <span className="text-red-500">*</span>
                            </label>
                            <div
                                onClick={() => !isImageUploading && fileInputRef.current.click()}
                                onDragOver={handleDragOver}
                                onDrop={handleDropProfile}
                                className={`relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors 
                                ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary-500'}
                                ${isImageUploading ? 'cursor-wait bg-gray-50' : 'cursor-pointer'}`}
                            >
                                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={onFileChange}
                                       disabled={isImageUploading}/>

                                {isImageUploading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-2" />
                                        <p className="text-sm font-medium text-gray-600">{t('pitchOwnerForm:sections.media.uploading')}</p>
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
                                        <p className="text-sm font-medium text-gray-700">{t('pitchOwnerForm:sections.media.uploadLogo')}</p>
                                    </div>
                                )}
                            </div>
                            {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
                        </div>

                        {/* 2. Cover Image (OPTIONAL) */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('pitchOwnerForm:sections.media.profileLabel')} <span className="text-gray-400 font-normal">{t('pitchOwnerForm:sections.media.optional')}</span>
                            </label>
                            <div
                                onClick={() => !isCoverImageUploading && coverInputRef.current.click()}
                                onDragOver={handleDragOver}
                                onDrop={handleDropCover}
                                className={`relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors border-gray-300 hover:border-primary-500
                                ${isCoverImageUploading ? 'cursor-wait bg-gray-50' : 'cursor-pointer'}`}
                            >
                                <input type="file" hidden ref={coverInputRef} accept="image/*" onChange={onCoverFileChange}
                                       disabled={isCoverImageUploading}/>

                                {isCoverImageUploading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-2" />
                                        <p className="text-sm font-medium text-gray-600">{t('pitchOwnerForm:sections.media.uploading')}</p>
                                    </div>
                                ) : coverImagePreview ? (
                                    <div className="relative w-full h-full p-2 group">
                                        <img src={coverImagePreview} alt="Cover Preview" className="w-full h-full object-cover rounded-md" />
                                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-md transition-all">
                                            <button type="button" onClick={removeCoverImage} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"><Trash2 size={20} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-4">
                                        <div className="bg-primary-100 text-primary-600 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3"><UploadCloud size={24} /></div>
                                        <p className="text-sm font-medium text-gray-700">{t('pitchOwnerForm:sections.media.uploadCover')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg">{t('pitchOwnerForm:buttons.cancel')}</button>
                    <button type="submit" disabled={isSubmitting || isImageUploading || isCoverImageUploading} className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg">
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {initialData ? t('pitchOwnerForm:buttons.update') : t('pitchOwnerForm:buttons.save')}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PitchOwnerForm;