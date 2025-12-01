import React, { useState } from 'react';
import MainInput from '../MainInput.jsx';
import { toast } from 'react-toastify';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { uploadService } from '../../services/upload/uploadService.js';

const BannerForm = ({
                        editingBanner,
                        onSubmit,
                        onCancel,
                        isLoading = false
                    }) => {
    const [formData, setFormData] = useState(editingBanner ? {
        // image: editingBanner.image,
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6ePimPYqT3Wv5BxneytQnoDKYT95tk0BU0nkZeEX8vYVqltuxxn5Y-DFdJzkk0KIbRUY&usqp=CAU',
        imagePreview: editingBanner.image,
        type: editingBanner.type,
        value: editingBanner.value,
        is_active: editingBanner.is_active
    } : {
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6ePimPYqT3Wv5BxneytQnoDKYT95tk0BU0nkZeEX8vYVqltuxxn5Y-DFdJzkk0KIbRUY&usqp=CAU',
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

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                imagePreview: reader.result
            }));
        };
        reader.readAsDataURL(file);

        // Upload image
        try {
            setUploading(true);
            const uniqueName = generateUniqueFileName(file.name);
            const urlData = await uploadService.getUploadUrl(file, uniqueName);
            await uploadService.uploadImage(file, urlData.url);

            // Store the uploaded image URL
            const imageUrl = urlData.url.split('?')[0]; // Remove query params
            setFormData(prev => ({
                ...prev,
                image: imageUrl
            }));

            toast.success('Image uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload image');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        // if (!formData.image) {
        //     toast.error('Please upload an image');
        //     return;
        // }
        //
        // if (!formData.type) {
        //     toast.error('Please select a banner type');
        //     return;
        // }
        //
        // if (!formData.value.trim()) {
        //     toast.error('Please enter a banner value');
        //     return;
        // }

        onSubmit({
            ...formData,
            // Remove imagePreview from the data sent to server
            imagePreview: undefined
        });
    };

    const bannerTypeOptions = [
        { label: 'Venue', value: 'venue' },
        { label: 'Text', value: 'text' },
        { label: 'Link', value: 'link' },
        { label: 'Tournaments', value: 'tournaments' }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                </h2>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                    ✕
                </button>
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Banner Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    {formData.imagePreview ? (
                        <div className="space-y-4">
                            <img
                                src={formData.imagePreview}
                                alt="Preview"
                                className="max-h-48 mx-auto rounded"
                            />
                            <button
                                type="button"
                                onClick={() => document.getElementById('imageInput').click()}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                disabled={uploading}
                            >
                                Change Image
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-blue-500 text-4xl">☁️</div>
                            <div className="text-gray-600">
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('imageInput').click()}
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                    disabled={uploading}
                                >
                                    Select Image
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
                    <p className="text-sm text-blue-600 mt-2">Uploading...</p>
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
                    disabled={isLoading}
                    className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    CANCEL
                </button>
                <button
                    type="submit"
                    disabled={isLoading || uploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                    {isLoading ? 'SAVING...' : (editingBanner ? 'UPDATE BANNER' : 'CREATE BANNER')}
                </button>
            </div>
        </form>
    );
};

export default BannerForm;