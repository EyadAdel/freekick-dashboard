import React, { useState } from 'react';
import MainInput from '../MainInput.jsx';
import { toast } from 'react-toastify';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { uploadService } from '../../services/upload/uploadService.js';
import ArrowIcon from "../common/ArrowIcon.jsx";

const BannerForm = ({
                        editingBanner,
                        onSubmit,
                        onCancel,
                        isLoading = false
                    }) => {
    const [formData, setFormData] = useState(editingBanner ? {
        image: editingBanner.image,
        imagePreview: editingBanner.image,
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

            // Use processFullUpload (NOT uploadImage - that doesn't exist!)
            const uploadResult = await uploadService.processFullUpload(
                file,
                uniqueName,
                (loaded, total, percent) => {
                    console.log(`📈 Upload progress: ${percent}%`);
                }
            );

            if (uploadResult && uploadResult.url) {
                console.log('✅ Banner image uploaded!');
                console.log('🖼️ Image URL:', uploadResult.url);
                console.log('📝 Filename:', uploadResult.filename);

                // Store ONLY the filename (not the full URL)
                setFormData(prev => ({
                    ...prev,
                    image: uploadResult.filename,  // Send filename to API
                    imagePreview: uploadResult.url  // Use full URL for preview
                }));

                toast.success('Image uploaded successfully');
            } else {
                throw new Error('No URL returned from upload');
            }
        } catch (error) {
            console.error('❌ Failed to upload banner image:', error);
            toast.error('Failed to upload image. Please try again.');

            // Reset preview on error
            setFormData(prev => ({
                ...prev,
                imagePreview: editingBanner?.image || null
            }));
        } finally {
            setUploading(false);
            // Clear file input
            e.target.value = '';
        }
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
            image: formData.image,  // This will be the filename only
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

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Banner Image *
                    </label>
                    <div className="border-2 border-dashed border-primary-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                        {formData.imagePreview ? (
                            <div className="space-y-4">
                                <img
                                    src={formData.imagePreview}
                                    alt="Preview"
                                    className="max-h-48 mx-auto rounded object-contain"
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('imageInput').click()}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium disabled:opacity-50"
                                    disabled={uploading || isLoading}
                                >
                                    {uploading ? 'Uploading...' : 'Change Image'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-blue-500 text-4xl">☁️</div>
                                <div className="text-gray-600">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('imageInput').click()}
                                        className="text-primary-600 hover:text-blue-700 font-medium disabled:opacity-50"
                                        disabled={uploading || isLoading}
                                    >
                                        {uploading ? 'Uploading...' : 'Select Image'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Supported formats: JPG, PNG, GIF • Max size: 5MB
                                </p>
                            </div>
                        )}
                        <input
                            id="imageInput"
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={uploading || isLoading}
                        />
                    </div>
                    {uploading && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Uploading to cloud storage...</span>
                        </div>
                    )}
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
                        disabled={isLoading || uploading}
                        className="lg:px-6 px-2 py-2 bg-primary-600 text-sm lg:text-base text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                    >
                        {isLoading ? 'SAVING...' : uploading ? 'UPLOADING...' : (editingBanner ? 'UPDATE BANNER' : 'CREATE BANNER')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BannerForm;