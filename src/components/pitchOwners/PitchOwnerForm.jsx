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
    ChevronDown, Check,ChevronLeft, ChevronRight
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
    const userDropdownRef = useRef(null);

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
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageLimit: 20,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
        nextPage: null,
        previousPage: null
    });
    // After line 56 (or after userDropdownRef)
    const userListRef = useRef(null);
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

    // --- FETCH USERS (Server-Side Search & Pagination) ---
    const fetchUsers = async (page, searchTerm) => {
        setLoadingUsers(true);
        try {
            const params = {
                page: page,
                page_limit: pagination.pageLimit,
                search: searchTerm || ''
            };

            const data = await authService.getUsers(params);

            // Handle different API response structures
            const usersArray = data.data?.results || data.results || (Array.isArray(data.data) ? data.data : []);
            const userList = Array.isArray(usersArray) ? usersArray : [];

            setUsers(userList);

            // Update pagination info if available
            if (data.data || data) {
                const responseData = data.data || data;
                setPagination(prev => ({
                    ...prev,
                    currentPage: page,
                    totalPages: Math.ceil((responseData.count || 0) / prev.pageLimit),
                    totalCount: responseData.count || 0,
                    hasNext: !!responseData.next,
                    hasPrevious: !!responseData.previous,
                    nextPage: responseData.next,
                    previousPage: responseData.previous
                }));
            }

        } catch (error) {
            console.error("Failed to fetch users", error);
            if (error.response?.status !== 404) {
                toast.error(t('pitchOwnerForm:messages.usersLoadError'));
            }
        } finally {
            setLoadingUsers(false);
        }
    };

    // Debounced search effect - only triggers on search term change
    useEffect(() => {
        if (!isUserDropdownOpen) return;

        const delayDebounceFn = setTimeout(() => {
            fetchUsers(1, userSearchTerm); // Always start from page 1 on new search
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [userSearchTerm, isUserDropdownOpen]);
    // Effect runs whenever userSearchTerm changes
// Reset pagination when search term changes or dropdown opens
//     useEffect(() => {
//         if (isUserDropdownOpen) {
//             setPagination(prev => ({
//                 ...prev,
//                 currentPage: 1
//             }));
//         }
//     }, [userSearchTerm]);
    // --- PAGINATION HANDLERS ---
    const handleNextPage = () => {
        if (pagination.hasNext && !loadingUsers) {
            const nextPage = pagination.currentPage + 1;
            fetchUsers(nextPage, userSearchTerm); // ← Direct call
            scrollToTop();
        }
    };

    const handlePageClick = (pageNumber) => {
        if (!loadingUsers && pageNumber !== pagination.currentPage) {
            fetchUsers(pageNumber, userSearchTerm); // ← Direct call
            scrollToTop();
        }
    };

    const handlePreviousPage = () => {
        if (pagination.hasPrevious && !loadingUsers) {
            const nextPage = pagination.currentPage - 1;
            fetchUsers(nextPage, userSearchTerm); // ← Direct call
            scrollToTop();
        }
    };


    const scrollToTop = () => {
        if (userListRef.current) {
            userListRef.current.scrollTop = 0;
        }
    };
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
    // --- USER SELECTION HANDLER ---
    const handleSelectUser = (user) => {
        setFormData(prev => ({
            ...prev,
            user_id: user.id,
            user_info: user.name || user.username || `User ${user.id}`
        }));
        setIsUserDropdownOpen(false);
        setUserSearchTerm('');

        if (errors.user_id) setErrors(prev => ({ ...prev, user_id: '' }));
    };
    // --- GET DISPLAY NAME ---
    const getSelectedUserDisplay = () => {
        // If the dropdown is open, show exactly what the user is typing
        if (isUserDropdownOpen) return userSearchTerm;

        // If closed, try to find the name based on the ID
        if (formData.user_id) {
            // Check the currently loaded users list
            const selected = users.find(u => u.id === formData.user_id);
            if (selected) return `${selected.name} (${selected.phone})`;

            // Check initial data fallback (in case the selected user isn't in the current API page)
            if (initialData && initialData.user_info && (initialData.user_info.id === formData.user_id || initialData.user || initialData.user_id)) {
                return initialData.user_info.name || initialData.user_info;
            }

            // Fallback: If we have an ID but no name loaded, show ID or a placeholder
            return formData.user_info || formData.user_id; // Added formData.user_info as fallback
        }
        return '';
    };

    // NOTE: Removed client-side `filteredUsers`. We now use the `users` state directly.

    // ... (Image upload handlers remain the same) ...
    const handleImageSelect = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error(t('pitchOwnerForm:validation.invalidImage'));
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        setSelectedImage(file);
        setImagePreview(previewUrl);
        setErrors(prev => ({ ...prev, image: '' }));

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
// --- RENDER PAGINATION CONTROLS ---
    const renderPagination = () => {
        const { currentPage, totalPages, totalCount } = pagination;

        if (totalCount === 0 || totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    {/* Results count */}
                    <div className="text-xs text-gray-600">
                        {totalCount > 0 && `Showing ${totalCount} users`}
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center gap-1">
                        {/* Previous button */}
                        <button
                            type="button"
                            onClick={handlePreviousPage}
                            disabled={!pagination.hasPrevious || loadingUsers}
                            className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                            {pageNumbers.map(page => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => handlePageClick(page)}
                                    disabled={loadingUsers}
                                    className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors ${
                                        currentPage === page
                                            ? 'bg-primary-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    } ${loadingUsers ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Ellipsis for large page counts */}
                            {endPage < totalPages && (
                                <span className="px-2 text-gray-500">...</span>
                            )}
                        </div>

                        {/* Next button */}
                        <button
                            type="button"
                            onClick={handleNextPage}
                            disabled={!pagination.hasNext || loadingUsers}
                            className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Next page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Page info */}
                    <div className="text-xs text-gray-600">
                        Page {currentPage} of {totalPages}
                    </div>
                </div>
            </div>
        );
    };
// --- INPUT CHANGE HANDLER FOR SEARCH ---
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setUserSearchTerm(value);
        setIsUserDropdownOpen(true);

        // Reset to page 1 ONLY when search term changes (not when dropdown opens)
        if (value !== userSearchTerm) {
            setPagination(prev => ({
                ...prev,
                currentPage: 1
            }));
        }
    };
    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Header */}
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
                                {/* Trigger/Input */}
                                <input
                                    type="text"
                                    value={getSelectedUserDisplay()}
                                    onChange={handleSearchChange}
                                    onClick={() => {
                                        setIsUserDropdownOpen(true);
                                    }}
                                    placeholder={loadingUsers ? t('pitchOwnerForm:sections.user.loading') : t('pitchOwnerForm:sections.user.defaultOption')}
                                    className={`w-full p-3 pr-10 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${errors.user_id ? 'border-red-500' : 'border-gray-200'}`}
                                    autoComplete="off"
                                />

                                <div className="absolute right-3 top-3.5 text-gray-500 pointer-events-none">
                                    {loadingUsers ? <Loader2 size={18} className="animate-spin" /> : <ChevronDown size={18} />}
                                </div>
                            </div>

                            {/* Dropdown List */}
                            {isUserDropdownOpen && (
                                <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
                                    {/* User List */}
                                    <div className="overflow-y-auto max-h-60" ref={userListRef}>
                                        {/* Show loader only if explicitly loading */}
                                        {loadingUsers && users.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto"/>
                                                <p className="mt-2 text-sm">Loading users...</p>
                                            </div>
                                        ) : users.length > 0 ? (
                                            <ul className="py-1">
                                                {users.map(user => {
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
                                                {userSearchTerm
                                                    ? `No users found for "${userSearchTerm}"`
                                                    : 'No users available'
                                                }
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination Controls */}
                                    {renderPagination()}
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

                {/* Section 4: Images */}
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