// FILE LOCATION: src/pages/tickets/CreateTicket.jsx

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import MainInput from '../../components/MainInput';
import { uploadService } from '../../services/upload/uploadService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { useTickets } from '../../hooks/useTickets';
import ArrowIcon from "../common/ArrowIcon.jsx";

const CreateTicket = ({ onBack, editTicket = null }) => {
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const { addTicket, editTicket: updateTicket, loading } = useTickets();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        defaultValues: {
            name: '',
            date: '',
            city: '',
            place: '',
            description: '',
            url: '',
            price: '',
            is_active: true
        }
    });

    // Populate form when editing
    useEffect(() => {
        if (editTicket) {
            reset({
                name: editTicket.name || '',
                date: editTicket.date ? editTicket.date.split('T')[0] : '',
                city: editTicket.city || '',
                place: editTicket.place || '',
                description: editTicket.description || '',
                url: editTicket.url || '',
                price: editTicket.price || '',
                is_active: editTicket.is_active ?? true,
            });
            if (editTicket.image) {
                setImagePreview(editTicket.image);
                // setUploadedImageUrl(editTicket.image);
                setUploadedImageUrl('https://www.shutterstock.com/image-photo/august-14-2019-istanbul-turkey-260nw-1492556879.jpg')
            }
        }
    }, [editTicket, reset]);

    // Handle image selection
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setSelectedFile(file);

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Upload image to AWS
    const handleImageUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select an image first');
            return;
        }

        try {
            setUploading(true);
            const uniqueName = generateUniqueFileName(selectedFile.name);
            const result = await uploadService.processFullUpload(selectedFile, uniqueName);

            // Use the URL returned from the upload service
            setUploadedImageUrl(result.url);

            toast.success('Image uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload image');
            console.error('Upload error:', error);
            setImagePreview(null);
            setSelectedFile(null);
        } finally {
            setUploading(false);
        }
    };

    // Remove selected image
    const handleRemoveImage = () => {
        setImagePreview(null);
        setUploadedImageUrl(null);
        setSelectedFile(null);
    };

    // Handle form submission
// Replace the entire onSubmit function with:
    const onSubmit = async (data) => {
        // Upload image if selected but not yet uploaded
        // if (selectedFile && !uploadedImageUrl) {
        //     toast.error('Please upload the image first');
        //     return;
        // }

        const formData = {
            ...data,
            price: parseFloat(data.price) || 0,
            // image: uploadedImageUrl || editTicket?.image || '1764601545377_Capture.PNG',
            image:'https://www.shutterstock.com/image-photo/august-14-2019-istanbul-turkey-260nw-1492556879.jpg'
        };

        console.log('Submitting ticket data:', formData); // Debug log

        try {
            let result;
            if (editTicket) {
                result = await updateTicket(editTicket.id, formData);
            } else {
                result = await addTicket(formData);
            }

            // Check the result structure
            console.log('API Result:', result); // Debug log

            if (result.success || result.type?.includes('fulfilled')) {
                toast.success(editTicket ? 'Ticket updated successfully' : 'Ticket created successfully');
                // Optional: delay before going back
                setTimeout(() => onBack(), 1000);
            } else {
                const errorMsg = result.error || result.payload?.message || 'Operation failed';
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.message || 'An error occurred');
        }
    };
    return (
        <div className="container mx-auto px-4 ">
            {/* Header */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-xl bg-white p-5 py-3 rounded-lg w-full text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
                <ArrowIcon size={'xl'} direction={'left'} />
                <span className="font-medium">Back to Tickets</span>
            </button>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="">
                <div className="bg-white rounded-lg shadow-sm  p-6 space-y-6">
                    {/* Image Upload Section */}
                    <div className="mb-6">

                        <h1 className="text-xl lg:text-2xl font-bold text-primary-700">
                            {editTicket ? 'Edit Ticket' : 'Create New Ticket'}
                        </h1>
                        <p className="text-gray-400 mt-2 text-xs">
                            {editTicket ? 'Update ticket information' : 'Fill in the details to create a new event event'}
                        </p>
                    </div>
                    <div className="   my-6"></div>


                    {/* Date and City Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Event Name */}
                        <Controller
                            name="name"
                            control={control}
                            rules={{
                                required: 'Event name is required',
                                minLength: { value: 3, message: 'Name must be at least 3 characters' }
                            }}
                            render={({ field }) => (
                                <MainInput
                                    label="Event Name"
                                    type="text"
                                    placeholder="Enter event name"
                                    required
                                    error={errors.name?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="date"
                            control={control}
                            rules={{ required: 'Event date is required' }}
                            render={({ field }) => (
                                <MainInput
                                    label="Event Date"
                                    type="date"
                                    required
                                    error={errors.date?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="city"
                            control={control}
                            rules={{ required: 'City is required' }}
                            render={({ field }) => (
                                <MainInput
                                    label="City"
                                    type="select"
                                    placeholder="Enter city"
                                    options={[
                                        { value: 'Abu_Dhabi', label: 'Abu Dhabi' },
                                        { value: 'Dubai', label: 'Dubai' },
                                        { value: 'Sharjah', label: 'Sharjah' },
                                        { value: 'Ajman', label: 'Ajman' },
                                        { value: 'Umm_Al_Quwain', label: 'Umm Al Quwain' },
                                        { value: 'Ras_Al_Khaimah', label: 'Ras Al Khaimah' },
                                        { value: 'Fujairah', label: 'Fujairah' }
                                    ]}
                                    required
                                    error={errors.city?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                    {/* Place and Price Row */}
                        <Controller
                            name="place"
                            control={control}
                            rules={{ required: 'Place is required' }}
                            render={({ field }) => (
                                <MainInput
                                    label="Venue/Place"
                                    type="text"
                                    placeholder="Enter venue name"
                                    required
                                    error={errors.place?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="price"
                            control={control}
                            rules={{
                                required: 'Price is required',
                                min: { value: 0, message: 'Price must be positive' }
                            }}
                            render={({ field }) => (
                                <MainInput
                                    label="Price"
                                    type="number"
                                    placeholder="0.00"
                                    required
                                    error={errors.price?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <MainInput
                                    label="Description"
                                    type="textarea"
                                    rows={'1'}
                                    placeholder="Enter event description"
                                    error={errors.description?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                        {/* Ticket URL */}
                        <Controller
                            name="url"
                            control={control}
                            rules={{
                                pattern: {
                                    value: /^https?:\/\/.+/,
                                    message: 'Please enter a valid URL starting with http:// or https://'
                                }
                            }}
                            render={({ field }) => (
                                <MainInput
                                    label="Ticket URL"
                                    type="text"
                                    placeholder="https://example.com/tickets"
                                    error={errors.url?.message}
                                    helperText="Link where users can purchase tickets"
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />
                        {/* Active Status Checkbox */}
                        <Controller
                            name="is_active"
                            control={control}
                            render={({ field: { value, onChange, ...field } }) => (
                                <MainInput
                                    label="Active Ticket"
                                    type="checkbox"
                                    className={'flex py-5 flex-col-reverse'}
                                    helperText=""
                                    checked={value}
                                    onChange={(e) => onChange(e.target.checked)}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Event Image
                        </label>
                        <div className="flex flex-col  gap-6">
                            {/* Image Preview */}
                            <div className="w-full">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-lg border-2 border-primary-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full h-36 bg-gray-50 rounded-lg border-2 border-dashed border-primary-300 flex flex-col items-center justify-center">
                                        <Upload size={40} className="text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500">No image selected</p>
                                    </div>
                                )}
                            </div>

                            {/* Upload Controls */}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        disabled={uploading || loading}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className={`inline-flex text-sm lg:text-base items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors font-medium ${
                                            (uploading || loading) ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <Upload size={18} />
                                        Choose Image
                                    </label>
                                </div>

                                {selectedFile && !uploadedImageUrl && (
                                    <button
                                        type="button"
                                        onClick={handleImageUpload}
                                        disabled={uploading || loading}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                Upload to Server
                                            </>
                                        )}
                                    </button>
                                )}

                                {uploadedImageUrl && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                        <span className="text-sm font-medium">Image uploaded successfully</span>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500">
                                    Supported formats: PNG, JPG, JPEG. Max size: 5MB
                                </p>
                            </div>
                        </div>
                    </div>




                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={loading || uploading}
                            className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="lg:px-6 text-sm lg:text-base px-2 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {editTicket ? 'Update Ticket' : 'Create Ticket'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateTicket;