import React, { useState } from 'react';
import MainInput from '../MainInput.jsx';
import { toast } from 'react-toastify';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { uploadService } from '../../services/upload/uploadService.js';
import ArrowIcon from "../common/ArrowIcon.jsx";
import { getImageUrl, extractFilename, isFullUrl } from '../../utils/imageUtils';

const BannerForm = ({
                        editingBanner,
                        onSubmit,
                        onCancel,
                        isLoading = false
                    }) => {
    const [formData, setFormData] = useState(editingBanner ? {
        image: editingBanner.image ? extractFilename(editingBanner.image) : null,
        imagePreview: editingBanner.image ? getImageUrl(editingBanner.image) : null,
        type: editingBanner.type,
        value: editingBanner.value,
        is_active: editingBanner.is_active
    } : {
        image: null,
        imagePreview: null,
        type: '',
        value: '',
        is_active: true
    });

    const [uploading, setUploading] = useState(false);

    // Handle image upload
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload JPG, PNG, or GIF images only');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        // Create preview immediately for better UX
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                imagePreview: reader.result
            }));
        };
        reader.readAsDataURL(file);

        // Upload image to R2
        try {
            setUploading(true);
            console.log('📤 Starting banner image upload...');

            // Generate unique filename
            const uniqueName = generateUniqueFileName(file.name);
            console.log('🏷️ Generated filename:', uniqueName);

            // Upload the file
            await uploadService.processFullUpload(
                file,
                uniqueName,
                (loaded, total, percent) => {
                    console.log(`📈 Upload progress: ${percent}%`);
                }
            );

            console.log('✅ Banner image uploaded!');
            console.log('📝 Filename:', uniqueName);

            // Store ONLY the filename (not the full URL)
            setFormData(prev => ({
                ...prev,
                image: uniqueName,  // Send filename to API
                imagePreview: reader.result  // Use data URL for preview
            }));

            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('❌ Failed to upload banner image:', error);
            toast.error('Failed to upload image. Please try again.');

            // Reset preview on error
            setFormData(prev => ({
                ...prev,
                image: editingBanner?.image ? extractFilename(editingBanner.image) : null,
                imagePreview: editingBanner?.image ? getImageUrl(editingBanner.image) : null
            }));
        } finally {
            setUploading(false);
            // Clear file input
            e.target.value = '';
        }
    };

    // Handle file drop (optional enhancement)
    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (file) {
            await handleImageChange({ target: { files: [file] } });
        }
    };

    // Handle drag over
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Remove selected image
    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            image: null,
            imagePreview: null
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.image) {
            toast.error('Please upload an image');
            return;
        }

        if (!formData.type) {
            toast.error('Please select a banner type');
            return;
        }

        if (!formData.value.trim()) {
            toast.error('Please enter a banner value');
            return;
        }

        console.log('💾 Submitting banner with data:', {
            image: formData.image,  // Filename only
            type: formData.type,
            value: formData.value,
            is_active: formData.is_active
        });

        // Send to API with filename only
        onSubmit({
            image: formData.image,  // Filename like: "1765224834383_banner_image.jpg"
            type: formData.type,
            value: formData.value,
            is_active: formData.is_active
        });
    };

    const bannerTypeOptions = [
        { label: 'Venues', value: 'venue' },
        { label: 'Text', value: 'text' },
        { label: 'Link', value: 'link' },
        { label: 'Tournaments', value: 'tournaments' }
    ];

    return (
        <div>
            <button
                onClick={onCancel}
                className="flex items-center gap-2 text-xl bg-white mb-5 p-5 py-3 rounded-lg w-full text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowIcon size={'xl'} direction={'left'} />
                <span className="font-medium">Back to Banners</span>
            </button>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-lg p-6 shadow-sm bg-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-primary-700">
                        {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                    </h2>
                </div>

                {/* Image Upload - Enhanced with Ticket form styling */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Banner Image *
                    </label>
                    <div className="flex flex-col gap-4">
                        {/* Image Preview Area */}
                        <div className="w-full">
                            {formData.imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={formData.imagePreview}
                                        alt="Preview"
                                        className="w-full h-48 object-contain rounded-lg border-2 border-primary-300 bg-gray-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        disabled={uploading || isLoading}
                                    >
                                        ✕
                                    </button>
                                    {editingBanner?.image && !formData.image?.startsWith('data:') && (
                                        <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                            {formData.image === extractFilename(editingBanner.image) ? 'Existing Image' : 'New Image'}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className="w-full h-36 bg-gray-50 rounded-lg border-2 border-dashed border-primary-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors"
                                    onClick={() => !uploading && document.getElementById('bannerImageInput').click()}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            <p className="text-sm text-gray-500">Uploading...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-4xl text-gray-400 mb-2">☁️</div>
                                            <p className="text-sm text-gray-500">
                                                Drag & drop an image or click to select
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                PNG, JPG, GIF up to 5MB
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* File Input */}
                        <input
                            id="bannerImageInput"
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={uploading || isLoading}
                        />

                        {/* Upload Status */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <label
                                    htmlFor="bannerImageInput"
                                    className={`inline-flex text-sm lg:text-base items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors font-medium ${
                                        (uploading || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    ☁️ {formData.imagePreview ? 'Change Image' : 'Choose Image'}
                                </label>

                                {uploading && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm text-gray-600">Uploading...</span>
                                    </div>
                                )}
                            </div>

                            {/* Upload Status Messages */}
                            {formData.image && (
                                <div className="flex items-start gap-2 p-3 rounded-lg"
                                     style={{
                                         backgroundColor: formData.image.startsWith('data:') ? '#f0fdf4' :
                                             editingBanner?.image ? '#eff6ff' : '#f0fdf4'
                                     }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full mt-1"
                                             style={{
                                                 backgroundColor: formData.image.startsWith('data:') ? '#16a34a' :
                                                     editingBanner?.image ? '#2563eb' : '#16a34a'
                                             }}
                                        ></div>
                                        <span className="text-sm font-medium"
                                              style={{
                                                  color: formData.image.startsWith('data:') ? '#16a34a' :
                                                      editingBanner?.image ? '#2563eb' : '#16a34a'
                                              }}
                                        >
                                            {formData.image.startsWith('data:') ? 'New Image' :
                                                editingBanner?.image && formData.image === extractFilename(editingBanner.image)
                                                    ? 'Existing Image' : 'Image Ready'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        <div className="font-mono bg-gray-100 p-1 rounded">
                                            {formData.image.startsWith('data:') ? 'data:image/...' : formData.image}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-500">
                                Image will be uploaded automatically when selected. Supported formats: JPG, PNG, GIF. Max size: 5MB
                            </p>
                        </div>
                    </div>
                </div>

                {/* Banner Type */}
                <MainInput
                    label="Banner Type"
                    name="type"
                    type="select"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    options={bannerTypeOptions}
                    placeholder="Select Type"
                    required
                    disabled={isLoading}
                />

                {/* Banner Value */}
                <MainInput
                    label="Banner Value"
                    name="value"
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter value (URL, ID, or text)"
                    required
                    disabled={isLoading}
                />

                {/* Is Active Toggle */}
                <MainInput
                    label="Is Active"
                    name="is_active"
                    type="checkbox"
                    className={'!text-primary-700'}
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    helperText="Enable or disable this banner"
                    disabled={isLoading}
                />

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading || uploading}
                        className="lg:px-6 px-2 py-2 border text-sm lg:text-base border-primary-600 text-primary-600 rounded-lg hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        CANCEL
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || uploading || !formData.image}
                        className="lg:px-6 px-2 py-2 bg-primary-600 text-sm lg:text-base text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                    >
                        {isLoading ? 'SAVING...' :
                            uploading ? 'UPLOADING...' :
                                (editingBanner ? 'UPDATE BANNER' : 'CREATE BANNER')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BannerForm;