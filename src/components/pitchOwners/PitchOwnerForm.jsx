import React, { useState, useEffect, useRef } from 'react';
import MainInput from './../MainInput.jsx';
import { uploadService } from '../../services/upload/uploadService.js';
import { authService } from '../../services/authService.js';
import { pitchOwnersService } from '../../services/pitchOwners/pitchOwnersService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { citiesList } from '../../services/citiesList/citiesListService.js';

import {
    Save, X, UploadCloud, Trash2, Loader2,
    Edit, User, Mail, Phone, MapPin, Percent,
    FileText, ToggleLeft, ToggleRight, Building, CreditCard
} from 'lucide-react';
import { toast } from 'react-toastify';

const PitchOwnerForm = ({ onCancel, onSuccess, initialData = null }) => {

    // --- STATE ---
    const [formData, setFormData] = useState({
        user_id: '',
        user_info: '', // This will hold the name (or notes)
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

    // Image States
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [finalImageName, setFinalImageName] = useState('');
    const [isImageUploading, setIsImageUploading] = useState(false);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef(null);

    // --- FETCH USERS FOR DROPDOWN ---
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const data = await authService.getUsers();
                const usersArray = data.data.results;
                const userList = Array.isArray(usersArray) ? usersArray : (data.results || []);
                setUsers(userList);
            } catch (error) {
                console.error("Failed to fetch users", error);
                toast.error("Could not load users list.");
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    // --- POPULATE FORM WITH API DATA ---
    useEffect(() => {
        if (initialData) {
            // Handle if the data is wrapped in { data: ... } or passed directly
            const data = initialData.data || initialData;

            setFormData({
                // Map 'user' ID (int) from API to 'user_id'
                user_id: data.user_id || data.user || data.user_info?.id || '',
                // UPDATED: Set user_info input to the name from the user_info object
                user_info: data.user_info?.name || '',

                // Map 'pitch_name' from API to 'name'
                name: data.pitch_name || data.name || (data.translations?.en?.name) || '',

                // Map 'pitch_address' from API to 'address'
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

            // Handle Image (API returns 'profile_image', form logic uses 'image')
            const img = data.profile_image || data.image;
            if (img) {
                setImagePreview(img);
                setFinalImageName(img);
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

        if (name === 'user_id') {
            const selectedUser = users.find(u => u.id === value || u.id === parseInt(value));
            // Optional: Auto-fill user_info with user name when selecting from dropdown if needed
            // if (selectedUser) {
            //     setFormData(prev => ({ ...prev, user_info: selectedUser.name }));
            // }
        }

        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // --- IMAGE UPLOAD LOGIC ---
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
            const result = await uploadService.processFullUpload(file, generatedName);
            const uploadedName = result.key || result.fileName || generatedName;

            setFinalImageName(uploadedName);
            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error("Image upload failed", error);
            setSelectedImage(null);
            setImagePreview(null);
            setFinalImageName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
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
        setFinalImageName('');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.user_id) newErrors.user_id = "User selection is required";
        if (!formData.name) newErrors.name = "Pitch Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.contact_phone) newErrors.contact_phone = "Contact Phone is required";
        if (!formData.commission_rate) newErrors.commission_rate = "Commission Rate is required";
        if (isImageUploading) {
            toast.warning("Please wait for image to finish uploading.");
            return;
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            // Prepare payload
            const payload = {
                ...formData,
                kind: 'pitch_owner',
                pitch_name: formData.name,
                pitch_address: formData.address,

                // Translations structure
                translations: {
                    en: { name: formData.name },
                    ar: { name: formData.name }
                },

                profile_image: finalImageName || null
            };

            const targetId = initialData?.data?.id || initialData?.id;

            if (targetId) {
                // UPDATE
                await pitchOwnersService.updateStaff(targetId, payload);
            } else {
                // CREATE
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
                            {initialData ? "Edit Pitch Owner" : "New Pitch Owner"}
                        </h2>
                        <p className="text-primary-100 text-sm mt-1">
                            {initialData ? "Update the details for this pitch owner." : "Manage pitch owner details."}
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
                        <User size={20} /> User Account
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* User Dropdown */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Select User <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    name="user_id"
                                    value={formData.user_id}
                                    onChange={handleChange}
                                    className={`w-full p-3 bg-gray-50 border rounded-lg appearance-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${errors.user_id ? 'border-red-500' : 'border-gray-200'}`}
                                >
                                    <option value="">-- Choose a User --</option>
                                    {loadingUsers ? (
                                        <option disabled>Loading users...</option>
                                    ) : (
                                        users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} - ({user.phone})
                                            </option>
                                        ))
                                    )}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500">
                                    {loadingUsers ? <Loader2 size={16} className="animate-spin" /> : "▼"}
                                </div>
                            </div>
                            {errors.user_id && <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>}
                        </div>

                        {/* User Info (Text Input) */}
                        <MainInput
                            label="User Info / Notes"
                            name="user_info"
                            value={formData.user_info}
                            onChange={handleChange}
                            icon={FileText}
                            placeholder="Additional user details..."
                        />
                    </div>
                </div>

                {/* Section 2: Pitch Details */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-600 border-b pb-2 flex items-center gap-2">
                        <MapPin size={20} /> Pitch Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="">
                            <MainInput
                                label="Pitch Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                icon={Building}
                                required
                            />
                        </div>

                        <div className="">
                            <MainInput
                                label="Pitch Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                icon={MapPin}
                                placeholder="Full street address"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">City</label>
                            <div className="relative">
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                >
                                    <option value="">-- Select City --</option>
                                    {citiesList.map(city => (
                                        <option key={city.value} value={city.value}>{city.label}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                            </div>
                        </div>

                        <MainInput
                            label="State / Province"
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
                        <CreditCard size={20}/> Contact & Financials
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MainInput
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            icon={Mail}
                            required
                        />
                        <MainInput
                            label="Contact Person Name"
                            name="contact_name"
                            value={formData.contact_name}
                            onChange={handleChange}
                            icon={User}
                        />
                        <MainInput
                            label="Contact Phone"
                            name="contact_phone"
                            value={formData.contact_phone}
                            onChange={handleChange}
                            error={errors.contact_phone}
                            icon={Phone}
                            required
                        />
                        <MainInput
                            label="EID (Entity ID)"
                            name="eid"
                            value={formData.eid}
                            onChange={handleChange}
                            icon={FileText}
                        />
                        <MainInput
                            label="Commission Rate (%)"
                            name="commission_rate"
                            type="number"
                            value={formData.commission_rate}
                            onChange={handleChange}
                            error={errors.commission_rate}
                            icon={Percent}
                            placeholder="e.g. 10"
                            required
                        />

                    </div>
                    {/* Status */}
                    <div className="bg-primary-50 p-6 rounded-lg space-y-4 border border-primary-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MainInput type="checkbox" label="Is Active ?" name="is_active" value={formData.is_active} onChange={handleChange} />
                        </div>
                    </div>


                </div>

                {/* Section 4: Image Upload */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pitch Image <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div
                        onClick={() => !isImageUploading && fileInputRef.current.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors 
                        ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary-500'}
                        ${isImageUploading ? 'cursor-wait bg-gray-50' : 'cursor-pointer'}`}
                    >
                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={onFileChange}
                               disabled={isImageUploading}/>

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
                                <p className="text-sm font-medium text-gray-700">Click to upload pitch image</p>
                                <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg">Cancel</button>
                    <button type="submit" disabled={isSubmitting || isImageUploading} className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg">
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {initialData ? "Update Pitch Owner" : "Save Pitch Owner"}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PitchOwnerForm;