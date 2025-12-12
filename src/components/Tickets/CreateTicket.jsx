// // FILE LOCATION: src/pages/tickets/CreateTicket.jsx
//
// import React, { useState, useEffect, useRef } from 'react';
// import { useForm, Controller } from 'react-hook-form';
// import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
// import { toast } from 'react-toastify';
// import MainInput from '../../components/MainInput';
// import { uploadService } from '../../services/upload/uploadService.js';
// import { generateUniqueFileName } from '../../utils/fileUtils';
// import { useTickets } from '../../hooks/useTickets';
// import ArrowIcon from "../common/ArrowIcon.jsx";
// import {IMAGE_BASE_URL} from '../../utils/ImageBaseURL.js'
// // Configure your base image URL here
//
// const CreateTicket = ({ onBack, editTicket = null }) => {
//     const [imagePreview, setImagePreview] = useState(null);
//     const [uploading, setUploading] = useState(false);
//     const [uploadedFileName, setUploadedFileName] = useState(null);
//     const [selectedFile, setSelectedFile] = useState(null);
//     const [isEditingExistingImage, setIsEditingExistingImage] = useState(false);
//     const fileInputRef = useRef(null);
//
//     const { addTicket, editTicket: updateTicket, loading } = useTickets();
//
//     const {
//         control,
//         handleSubmit,
//         formState: { errors },
//         reset,
//         setValue,
//         trigger,
//     } = useForm({
//         defaultValues: {
//             name: '',
//             date: '',
//             city: '',
//             place: '',
//             description: '',
//             url: '',
//             price: '',
//             is_active: true
//         }
//     });
//
//     // Populate form when editing
//     useEffect(() => {
//         if (editTicket) {
//             reset({
//                 name: editTicket.name || '',
//                 date: editTicket.date ? editTicket.date.split('T')[0] : '',
//                 city: editTicket.city || '',
//                 place: editTicket.place || '',
//                 description: editTicket.description || '',
//                 url: editTicket.url || '',
//                 price: editTicket.price || '',
//                 is_active: editTicket.is_active ?? true,
//             });
//
//             if (editTicket.image) {
//                 // Always treat editTicket.image as a filename (not URL)
//                 setUploadedFileName(editTicket.image);
//
//                 // Create the full image URL by combining base URL with filename
//                 const fullImageUrl = `${IMAGE_BASE_URL}${editTicket.image}`;
//                 setImagePreview(fullImageUrl);
//                 setIsEditingExistingImage(true);
//
//                 console.log('Edit mode - Image details:', {
//                     filename: editTicket.image,
//                     fullUrl: fullImageUrl
//                 });
//             }
//         } else {
//             // Reset states for create mode
//             setImagePreview(null);
//             setUploadedFileName(null);
//             setIsEditingExistingImage(false);
//         }
//     }, [editTicket, reset]);
//
//     // Handle image selection and auto-upload
//     const handleImageSelect = async (e) => {
//         const file = e.target.files?.[0];
//         if (!file) return;
//
//         // Validate file type
//         if (!file.type.startsWith('image/')) {
//             toast.error('Please select a valid image file');
//             return;
//         }
//
//         // Validate file size (5MB max)
//         if (file.size > 5 * 1024 * 1024) {
//             toast.error('Image size must be less than 5MB');
//             return;
//         }
//
//         // Set preview immediately using local file
//         const reader = new FileReader();
//         reader.onloadend = () => {
//             setImagePreview(reader.result);
//         };
//         reader.readAsDataURL(file);
//
//         // Reset editing flag since user selected a new image
//         setIsEditingExistingImage(false);
//
//         // Auto-upload the file
//         await uploadImageFile(file);
//     };
//
//     // Upload image to AWS
//     const uploadImageFile = async (file) => {
//         if (!file) return;
//
//         try {
//             setUploading(true);
//             const uniqueName = generateUniqueFileName(file.name);
//
//             // Upload the file
//             const result = await uploadService.processFullUpload(file, uniqueName);
//
//             // Store only the filename
//             setUploadedFileName(uniqueName);
//             toast.success('Image uploaded successfully');
//
//             return uniqueName;
//         } catch (error) {
//             toast.error('Failed to upload image');
//             console.error('Upload error:', error);
//
//             // Reset on error
//             setImagePreview(null);
//             setUploadedFileName(null);
//             setIsEditingExistingImage(false);
//             if (fileInputRef.current) {
//                 fileInputRef.current.value = '';
//             }
//             return null;
//         } finally {
//             setUploading(false);
//         }
//     };
//
//     // Handle file drop
//     const handleDrop = async (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//
//         const file = e.dataTransfer.files?.[0];
//         if (file) {
//             await handleImageSelect({ target: { files: [file] } });
//         }
//     };
//
//     // Handle drag over
//     const handleDragOver = (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//     };
//
//     // Remove selected image
//     const handleRemoveImage = () => {
//         setImagePreview(null);
//         setUploadedFileName(null);
//         setSelectedFile(null);
//         setIsEditingExistingImage(false);
//         if (fileInputRef.current) {
//             fileInputRef.current.value = '';
//         }
//
//         // If in edit mode and removing existing image, we need to clear the image field
//         if (editTicket?.image) {
//             // This will be handled in the form submission by sending null/empty
//         }
//     };
//
//     // Get image URL for display
//     const getImageUrlForDisplay = (filename) => {
//         if (!filename) return null;
//
//         // If it's a base64 data URL (from new upload), return as-is
//         if (filename.startsWith('data:')) {
//             return filename;
//         }
//
//         // If it's a URL string (could be from edit), return as-is
//         if (filename.startsWith('http') || filename.startsWith('blob:')) {
//             return filename;
//         }
//
//         // Otherwise, construct URL from base URL and filename
//         return `${IMAGE_BASE_URL}${filename}`;
//     };
//
//     // Handle form submission
//     const onSubmit = async (data) => {
//         // Validate form
//         const isValid = await trigger();
//         if (!isValid) {
//             toast.error('Please fix form errors before submitting');
//             return;
//         }
//
//         // If there's a new image selected but upload failed or not completed
//         if (imagePreview && !uploadedFileName && !isEditingExistingImage) {
//             toast.error('Please wait for image upload to complete');
//             return;
//         }
//
//         const formData = {
//             ...data,
//             price: parseFloat(data.price) || 0,
//             // Send only the filename, not the full URL
//             image: uploadedFileName || (isEditingExistingImage ? editTicket?.image : null),
//         };
//
//         console.log('Submitting ticket data:', {
//             ...formData,
//             imageStatus: uploadedFileName ? 'new uploaded file' :
//                 isEditingExistingImage ? 'existing image retained' : 'no image'
//         });
//
//         try {
//             let result;
//             if (editTicket) {
//                 result = await updateTicket(editTicket.id, formData);
//             } else {
//                 result = await addTicket(formData);
//             }
//
//             console.log('API Result:', result);
//
//             if (result.success || result.type?.includes('fulfilled')) {
//                 toast.success(editTicket ? 'Ticket updated successfully' : 'Ticket created successfully');
//                 setTimeout(() => onBack(), 1000);
//             } else {
//                 const errorMsg = result.error || result.payload?.message || 'Operation failed';
//                 toast.error(errorMsg);
//             }
//         } catch (error) {
//             console.error('Submission error:', error);
//             toast.error(error.message || 'An error occurred');
//         }
//     };
//
//     return (
//         <div className="container mx-auto px-4">
//             {/* Header */}
//             <button
//                 onClick={onBack}
//                 className="flex items-center gap-2 text-xl bg-white p-5 py-3 rounded-lg w-full text-gray-600 hover:text-gray-900 mb-4 transition-colors"
//             >
//                 <ArrowIcon size={'xl'} direction={'left'} />
//                 <span className="font-medium">Back to Tickets</span>
//             </button>
//
//             {/* Form */}
//             <form onSubmit={handleSubmit(onSubmit)} className="">
//                 <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
//                     {/* Image Upload Section */}
//                     <div className="mb-6">
//                         <h1 className="text-xl lg:text-2xl font-bold text-primary-700">
//                             {editTicket ? 'Edit Ticket' : 'Create New Ticket'}
//                         </h1>
//                         <p className="text-gray-400 mt-2 text-xs">
//                             {editTicket ? 'Update ticket information' : 'Fill in the details to create a new event'}
//                         </p>
//                     </div>
//                     <div className="my-6"></div>
//
//                     {/* Date and City Row */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {/* Event Name */}
//                         <Controller
//                             name="name"
//                             control={control}
//                             rules={{
//                                 required: 'Event name is required',
//                                 minLength: { value: 3, message: 'Name must be at least 3 characters' }
//                             }}
//                             render={({ field }) => (
//                                 <MainInput
//                                     label="Event Name"
//                                     type="text"
//                                     placeholder="Enter event name"
//                                     required
//                                     error={errors.name?.message}
//                                     disabled={loading}
//                                     {...field}
//                                 />
//                             )}
//                         />
//                         <Controller
//                             name="date"
//                             control={control}
//                             rules={{ required: 'Event date is required' }}
//                             render={({ field }) => (
//                                 <MainInput
//                                     label="Event Date"
//                                     type="date"
//                                     required
//                                     error={errors.date?.message}
//                                     disabled={loading}
//                                     {...field}
//                                 />
//                             )}
//                         />
//
//                         <Controller
//                             name="city"
//                             control={control}
//                             rules={{ required: 'City is required' }}
//                             render={({ field }) => (
//                                 <MainInput
//                                     label="City"
//                                     type="select"
//                                     placeholder="Enter city"
//                                     options={[
//                                         { value: 'Abu_Dhabi', label: 'Abu Dhabi' },
//                                         { value: 'Dubai', label: 'Dubai' },
//                                         { value: 'Sharjah', label: 'Sharjah' },
//                                         { value: 'Ajman', label: 'Ajman' },
//                                         { value: 'Umm_Al_Quwain', label: 'Umm Al Quwain' },
//                                         { value: 'Ras_Al_Khaimah', label: 'Ras Al Khaimah' },
//                                         { value: 'Fujairah', label: 'Fujairah' }
//                                     ]}
//                                     required
//                                     error={errors.city?.message}
//                                     disabled={loading}
//                                     {...field}
//                                 />
//                             )}
//                         />
//
//                         {/* Place and Price Row */}
//                         <Controller
//                             name="place"
//                             control={control}
//                             rules={{ required: 'Place is required' }}
//                             render={({ field }) => (
//                                 <MainInput
//                                     label="Venue/Place"
//                                     type="text"
//                                     placeholder="Enter venue name"
//                                     required
//                                     error={errors.place?.message}
//                                     disabled={loading}
//                                     {...field}
//                                 />
//                             )}
//                         />
//
//                         <Controller
//                             name="price"
//                             control={control}
//                             rules={{
//                                 required: 'Price is required',
//                                 min: { value: 0, message: 'Price must be positive' }
//                             }}
//                             render={({ field }) => (
//                                 <MainInput
//                                     label="Price"
//                                     type="number"
//                                     placeholder="0.00"
//                                     required
//                                     error={errors.price?.message}
//                                     disabled={loading}
//                                     {...field}
//                                 />
//                             )}
//                         />
//                         <Controller
//                             name="description"
//                             control={control}
//                             render={({ field }) => (
//                                 <MainInput
//                                     label="Description"
//                                     type="textarea"
//                                     rows={'1'}
//                                     placeholder="Enter event description"
//                                     error={errors.description?.message}
//                                     disabled={loading}
//                                     {...field}
//                                 />
//                             )}
//                         />
//
//                         {/* Ticket URL */}
//                         <Controller
//                             name="url"
//                             control={control}
//                             rules={{
//                                 pattern: {
//                                     value: /^https?:\/\/.+/,
//                                     message: 'Please enter a valid URL starting with http:// or https://'
//                                 }
//                             }}
//                             render={({ field }) => (
//                                 <MainInput
//                                     label="Ticket URL"
//                                     type="text"
//                                     placeholder="https://example.com/tickets"
//                                     error={errors.url?.message}
//                                     helperText="Link where users can purchase tickets"
//                                     disabled={loading}
//                                     {...field}
//                                 />
//                             )}
//                         />
//                         {/* Active Status Checkbox */}
//                         <Controller
//                             name="is_active"
//                             control={control}
//                             render={({ field: { value, onChange, ...field } }) => (
//                                 <MainInput
//                                     label="Active Ticket"
//                                     type="checkbox"
//                                     className={'flex py-5 flex-col-reverse'}
//                                     helperText=""
//                                     checked={value}
//                                     onChange={(e) => onChange(e.target.checked)}
//                                     disabled={loading}
//                                     {...field}
//                                 />
//                             )}
//                         />
//                     </div>
//
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-3">
//                             Event Image
//                         </label>
//                         <div className="flex flex-col gap-6">
//                             {/* Image Preview Area with Drop Zone */}
//                             <div className="w-full">
//                                 {imagePreview ? (
//                                     <div className="relative">
//                                         <img
//                                             src={getImageUrlForDisplay(imagePreview)}
//                                             alt="Preview"
//                                             className="w-full h-48 object-cover rounded-lg border-2 border-primary-300"
//                                             onError={(e) => {
//                                                 // Fallback if image fails to load
//                                                 e.target.onerror = null;
//                                                 e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
//                                             }}
//                                         />
//                                         <button
//                                             type="button"
//                                             onClick={handleRemoveImage}
//                                             className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
//                                         >
//                                             <X size={16} />
//                                         </button>
//                                         {isEditingExistingImage && (
//                                             <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
//                                                 Existing Image
//                                             </div>
//                                         )}
//                                     </div>
//                                 ) : (
//                                     <div
//                                         className="w-full h-36 bg-gray-50 rounded-lg border-2 border-dashed border-primary-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors"
//                                         onClick={() => !uploading && fileInputRef.current?.click()}
//                                         onDrop={handleDrop}
//                                         onDragOver={handleDragOver}
//                                     >
//                                         {uploading ? (
//                                             <>
//                                                 <Loader2 size={40} className="text-primary-500 mb-2 animate-spin" />
//                                                 <p className="text-sm text-gray-500">Uploading...</p>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <Upload size={40} className="text-gray-400 mb-2" />
//                                                 <p className="text-sm text-gray-500">
//                                                     Drag & drop an image or click to select
//                                                 </p>
//                                                 <p className="text-xs text-gray-400 mt-1">
//                                                     PNG, JPG, JPEG up to 5MB
//                                                 </p>
//                                             </>
//                                         )}
//                                     </div>
//                                 )}
//                             </div>
//
//                             {/* File Input (Hidden) */}
//                             <input
//                                 ref={fileInputRef}
//                                 type="file"
//                                 accept="image/*"
//                                 onChange={handleImageSelect}
//                                 disabled={uploading || loading}
//                                 className="hidden"
//                                 id="image-upload"
//                             />
//
//                             {/* Upload Status */}
//                             <div className="space-y-3">
//                                 <div className="flex items-center gap-3">
//                                     <label
//                                         htmlFor="image-upload"
//                                         className={`inline-flex text-sm lg:text-base items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors font-medium ${
//                                             (uploading || loading) ? 'opacity-50 cursor-not-allowed' : ''
//                                         }`}
//                                     >
//                                         <Upload size={18} />
//                                         {imagePreview ? 'Change Image' : 'Choose Image'}
//                                     </label>
//
//                                     {uploading && (
//                                         <div className="flex items-center gap-2">
//                                             <Loader2 size={18} className="animate-spin text-primary-500" />
//                                             <span className="text-sm text-gray-600">Uploading...</span>
//                                         </div>
//                                     )}
//                                 </div>
//
//                                 {uploadedFileName && (
//                                     <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
//                                         <div className="flex items-center gap-2">
//                                             <div className="w-2 h-2 bg-green-600 rounded-full mt-1"></div>
//                                             <span className="text-sm font-medium text-green-600">
//                                                 {isEditingExistingImage ? 'Existing Image' : 'New Image Uploaded'}
//                                             </span>
//                                         </div>
//                                         <div className="text-xs text-gray-600 mt-1">
//                                             <div className="font-mono bg-gray-100 p-1 rounded">
//                                                 {uploadedFileName}
//                                             </div>
//                                             {/*<p className="mt-1">Only filename will be sent to server</p>*/}
//                                             {/*{isEditingExistingImage && (*/}
//                                             {/*    <p className="text-blue-600 mt-1">*/}
//                                             {/*        Showing from: {IMAGE_BASE_URL}*/}
//                                             {/*    </p>*/}
//                                             {/*)}*/}
//                                         </div>
//                                     </div>
//                                 )}
//
//                                 <p className="text-xs text-gray-500">
//                                     Image will be uploaded automatically when selected. Supported formats: PNG, JPG, JPEG. Max size: 5MB
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//
//                     {/* Form Actions */}
//                     <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
//                         <button
//                             type="button"
//                             onClick={onBack}
//                             disabled={loading || uploading}
//                             className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             type="submit"
//                             disabled={loading || uploading}
//                             className="lg:px-6 text-sm lg:text-base px-2 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
//                         >
//                             {loading && <Loader2 size={18} className="animate-spin" />}
//                             {editTicket ? 'Update Ticket' : 'Create Ticket'}
//                         </button>
//                     </div>
//                 </div>
//             </form>
//         </div>
//     );
// };
//
// export default CreateTicket;
// FILE LOCATION: src/pages/tickets/CreateTicket.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import MainInput from '../../components/MainInput';
import { uploadService } from '../../services/upload/uploadService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { useTickets } from '../../hooks/useTickets';
import ArrowIcon from "../common/ArrowIcon.jsx";
import { getImageUrl, extractFilename, isFullUrl } from '../../utils/imageUtils';

const CreateTicket = ({ onBack, editTicket = null }) => {
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const { addTicket, editTicket: updateTicket, loading } = useTickets();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        trigger,
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
                console.log('Original editTicket.image:', editTicket.image);

                // Extract filename (always get filename for backend)
                const filename = extractFilename(editTicket.image);
                setUploadedFileName(filename);
                console.log('Extracted filename:', filename);

                // Get display URL - utility handles both cases
                const displayUrl = getImageUrl(editTicket.image);
                setImagePreview(displayUrl);
                console.log('Display URL:', displayUrl);
            }
        } else {
            // Reset states for create mode
            setImagePreview(null);
            setUploadedFileName(null);
        }
    }, [editTicket, reset]);

    // Handle image selection and auto-upload
    const handleImageSelect = async (e) => {
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

        // Set preview immediately using local file
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Auto-upload the file
        await uploadImageFile(file);
    };

    // Upload image to AWS
    const uploadImageFile = async (file) => {
        if (!file) return;

        try {
            setUploading(true);
            const uniqueName = generateUniqueFileName(file.name);

            // Upload the file
            await uploadService.processFullUpload(file, uniqueName);

            // Store only the filename
            setUploadedFileName(uniqueName);
            toast.success('Image uploaded successfully');

            return uniqueName;
        } catch (error) {
            toast.error('Failed to upload image');
            console.error('Upload error:', error);

            // Reset on error
            setImagePreview(null);
            setUploadedFileName(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return null;
        } finally {
            setUploading(false);
        }
    };

    // Handle file drop
    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (file) {
            await handleImageSelect({ target: { files: [file] } });
        }
    };

    // Handle drag over
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Remove selected image
    const handleRemoveImage = () => {
        setImagePreview(null);
        setUploadedFileName(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle form submission
    const onSubmit = async (data) => {
        // Validate form
        const isValid = await trigger();
        if (!isValid) {
            toast.error('Please fix form errors before submitting');
            return;
        }

        // If there's a new image selected but upload failed or not completed
        if (imagePreview && !uploadedFileName && !editTicket?.image) {
            toast.error('Please wait for image upload to complete');
            return;
        }

        const formData = {
            ...data,
            price: parseFloat(data.price) || 0,
            // Always send filename only to backend
            image: uploadedFileName || (editTicket?.image ? extractFilename(editTicket.image) : null),
        };

        console.log('Submitting ticket data:', formData);

        try {
            let result;
            if (editTicket) {
                result = await updateTicket(editTicket.id, formData);
            } else {
                result = await addTicket(formData);
            }

            if (result.success || result.type?.includes('fulfilled')) {
                toast.success(editTicket ? 'Ticket updated successfully' : 'Ticket created successfully');
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
        <div className="container mx-auto px-4">
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
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    {/* Image Upload Section */}
                    <div className="mb-6">
                        <h1 className="text-xl lg:text-2xl font-bold text-primary-700">
                            {editTicket ? 'Edit Ticket' : 'Create New Ticket'}
                        </h1>
                        <p className="text-gray-400 mt-2 text-xs">
                            {editTicket ? 'Update ticket information' : 'Fill in the details to create a new event'}
                        </p>
                    </div>
                    <div className="my-6"></div>

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
                        <div className="flex flex-col gap-6">
                            {/* Image Preview Area with Drop Zone */}
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
                                        {editTicket?.image && !uploadedFileName && (
                                            <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                                Existing Image
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className="w-full h-36 bg-gray-50 rounded-lg border-2 border-dashed border-primary-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors"
                                        onClick={() => !uploading && fileInputRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 size={40} className="text-primary-500 mb-2 animate-spin" />
                                                <p className="text-sm text-gray-500">Uploading...</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={40} className="text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500">
                                                    Drag & drop an image or click to select
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    PNG, JPG, JPEG up to 5MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* File Input (Hidden) */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                disabled={uploading || loading}
                                className="hidden"
                                id="image-upload"
                            />

                            {/* Upload Status */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <label
                                        htmlFor="image-upload"
                                        className={`inline-flex text-sm lg:text-base items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors font-medium ${
                                            (uploading || loading) ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <Upload size={18} />
                                        {imagePreview ? 'Change Image' : 'Choose Image'}
                                    </label>

                                    {uploading && (
                                        <div className="flex items-center gap-2">
                                            <Loader2 size={18} className="animate-spin text-primary-500" />
                                            <span className="text-sm text-gray-600">Uploading...</span>
                                        </div>
                                    )}
                                </div>

                                {uploadedFileName && (
                                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-600 rounded-full mt-1"></div>
                                            <span className="text-sm font-medium text-green-600">
                                                Image uploaded
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            <div className="font-mono bg-gray-100 p-1 rounded">
                                                {uploadedFileName}
                                            </div>
                                            {/*<p className="mt-1">Filename will be sent to server</p>*/}
                                        </div>
                                    </div>
                                )}

                                {editTicket?.image && !uploadedFileName && (
                                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                                            <span className="text-sm font-medium text-blue-600">
                                                Current Image
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            <div className="font-mono bg-gray-100 p-1 rounded">
                                                {extractFilename(editTicket.image)}
                                            </div>
                                            <p className="mt-1">Showing: {isFullUrl(editTicket.image) ? 'Full URL' : 'Filename with base URL'}</p>
                                            <p className="text-blue-600 text-xs mt-1 truncate">
                                                Display: {imagePreview}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500">
                                    Image will be uploaded automatically when selected. Supported formats: PNG, JPG, JPEG. Max size: 5MB
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