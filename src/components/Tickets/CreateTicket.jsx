import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import MainInput from '../../components/MainInput';
import { uploadService } from '../../services/upload/uploadService.js';
import { generateUniqueFileName } from '../../utils/fileUtils';
import { useTickets } from '../../hooks/useTickets';
import ArrowIcon from "../common/ArrowIcon.jsx";
import { getImageUrl, extractFilename, isFullUrl } from '../../utils/imageUtils';

const CreateTicket = ({ onBack, editTicket = null }) => {
    const { t, i18n } = useTranslation('createTicket');
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const isRTL = i18n.language === 'ar';

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
                // Extract filename (always get filename for backend)
                const filename = extractFilename(editTicket.image);
                setUploadedFileName(filename);

                // Get display URL - utility handles both cases
                const displayUrl = getImageUrl(editTicket.image);
                setImagePreview(displayUrl);
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
            toast.error(t('form.image.errors.invalidType'));
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('form.image.errors.sizeLimit'));
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
            toast.success(t('messages.success.uploaded'));

            return uniqueName;
        } catch (error) {
            toast.error(t('form.image.errors.uploadFailed'));
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
            toast.error(t('messages.error.formErrors'));
            return;
        }

        // If there's a new image selected but upload failed or not completed
        if (imagePreview && !uploadedFileName && !editTicket?.image) {
            toast.error(t('form.image.errors.waitForUpload'));
            return;
        }

        const formData = {
            ...data,
            price: parseFloat(data.price) || 0,
            // Always send filename only to backend
            image: uploadedFileName || (editTicket?.image ? extractFilename(editTicket.image) : null),
        };

        try {
            let result;
            if (editTicket) {
                result = await updateTicket(editTicket.id, formData);
            } else {
                result = await addTicket(formData);
            }

            if (result.success || result.type?.includes('fulfilled')) {
                toast.success(editTicket ? t('messages.success.updated') : t('messages.success.created'));
                setTimeout(() => onBack(), 1000);
            } else {
                const errorMsg = result.error || result.payload?.message || t('messages.error.operationFailed');
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.message || 'An error occurred');
        }
    };

    // Get city options for select
    const cityOptions = Object.entries({
        'Abu_Dhabi': t('form.city.options.Abu_Dhabi'),
        'Dubai': t('form.city.options.Dubai'),
        'Sharjah': t('form.city.options.Sharjah'),
        'Ajman': t('form.city.options.Ajman'),
        'Umm_Al_Quwain': t('form.city.options.Umm_Al_Quwain'),
        'Ras_Al_Khaimah': t('form.city.options.Ras_Al_Khaimah'),
        'Fujairah': t('form.city.options.Fujairah')
    }).map(([value, label]) => ({ value, label }));

    return (
        <div className="container mx-auto px-4">
            {/* Header */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-xl bg-white p-5 py-3 rounded-lg w-full text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
                <ArrowIcon size={'xl'} direction={isRTL ? 'right' : 'left'} />
                <span className="font-medium">{t('header.back')}</span>
            </button>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="">
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    {/* Header Section */}
                    <div className="mb-6">
                        <h1 className="text-xl lg:text-2xl font-bold text-primary-700">
                            {editTicket ? t('header.editTitle') : t('header.createTitle')}
                        </h1>
                        <p className="text-gray-400 mt-2 text-xs">
                            {editTicket ? t('header.editSubtitle') : t('header.createSubtitle')}
                        </p>
                    </div>
                    <div className="my-6"></div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Event Name */}
                        <Controller
                            name="name"
                            control={control}
                            rules={{
                                required: t('form.eventName.required'),
                                minLength: {value: 3, message: t('form.eventName.minLength')}
                            }}
                            render={({field}) => (
                                <MainInput
                                    label={t('form.eventName.label')}
                                    type="text"
                                    placeholder={t('form.eventName.placeholder')}
                                    required
                                    error={errors.name?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                        {/* Event Date */}
                        <Controller
                            name="date"
                            control={control}
                            rules={{required: t('form.date.required')}}
                            render={({field}) => (
                                <MainInput
                                    label={t('form.date.label')}
                                    type="date"
                                    required
                                    error={errors.date?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                        {/* City */}
                        <Controller
                            name="city"
                            control={control}
                            rules={{required: t('form.city.required')}}
                            render={({field}) => (
                                <MainInput
                                    label={t('form.city.label')}
                                    type="select"
                                    placeholder={t('form.city.placeholder')}
                                    options={cityOptions}
                                    required
                                    error={errors.city?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                        {/* Place */}
                        <Controller
                            name="place"
                            control={control}
                            rules={{required: t('form.place.required')}}
                            render={({field}) => (
                                <MainInput
                                    label={t('form.place.label')}
                                    type="text"
                                    placeholder={t('form.place.placeholder')}
                                    required
                                    error={errors.place?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                        {/* Price */}
                        <Controller
                            name="price"
                            control={control}
                            rules={{
                                required: t('form.price.required'),
                                min: {value: 0, message: t('form.price.min')}
                            }}
                            render={({field}) => (
                                <MainInput
                                    label={t('form.price.label')}
                                    type="number"
                                    placeholder={t('form.price.placeholder')}
                                    required
                                    error={errors.price?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                        {/* Description */}
                        <Controller
                            name="description"
                            control={control}
                            render={({field}) => (
                                <MainInput
                                    label={t('form.description.label')}
                                    type="textarea"
                                    rows={'1'}
                                    placeholder={t('form.description.placeholder')}
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
                                    message: t('form.url.pattern')
                                }
                            }}
                            render={({field}) => (
                                <MainInput
                                    label={t('form.url.label')}
                                    type="text"
                                    placeholder={t('form.url.placeholder')}
                                    error={errors.url?.message}
                                    helperText={t('form.url.helperText')}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                        {/* Active Status Checkbox */}
                        <Controller
                            name="is_active"
                            control={control}
                            render={({field: {value, onChange, ...field}}) => (
                                <MainInput
                                    label={t('form.activeStatus.label')}
                                    type="checkbox"
                                    className={'flex py-5 flex-col-reverse'}
                                    helperText={t('form.activeStatus.helperText')}
                                    checked={value}
                                    onChange={(e) => onChange(e.target.checked)}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Image Upload Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            {t('form.image.label')}
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
                                            title={t('buttons.removeImage')}
                                        >
                                            <X size={16}/>
                                        </button>
                                        {editTicket?.image && !uploadedFileName && (
                                            <div
                                                className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                                {t('form.image.existingImage')}
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
                                                <Loader2 size={40} className="text-primary-500 mb-2 animate-spin"/>
                                                <p className="text-sm text-gray-500">{t('form.image.uploading')}</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={40} className="text-gray-400 mb-2"/>
                                                <p className="text-sm text-gray-500">
                                                    {t('form.image.dragDrop')}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {t('form.image.supported')}
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
                                        <Upload size={18}/>
                                        {imagePreview ? t('form.image.change') : t('form.image.choose')}
                                    </label>

                                    {uploading && (
                                        <div className="flex items-center gap-2">
                                            <Loader2 size={18} className="animate-spin text-primary-500"/>
                                            <span className="text-sm text-gray-600">{t('form.image.uploading')}</span>
                                        </div>
                                    )}
                                </div>

                                {uploadedFileName && (
                                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-600 rounded-full mt-1"></div>
                                            <span className="text-sm font-medium text-green-600">
                                                {t('form.image.uploaded')}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            <div className="font-mono bg-gray-100 p-1 rounded">
                                                {uploadedFileName}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {editTicket?.image && !uploadedFileName && (
                                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                                            <span className="text-sm font-medium text-blue-600">
                                                {t('form.image.currentImage')}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            <div className="font-mono bg-gray-100 p-1 rounded">
                                                {extractFilename(editTicket.image)}
                                            </div>
                                            <p className="mt-1">
                                                {isFullUrl(editTicket.image) ?
                                                    t('messages.displayFullURL') :
                                                    t('messages.displayFilename')}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500">
                                    {t('form.image.uploadStatus')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="md:flex gap-4 pt-6 border-t">
                        <button type="button" onClick={onBack}
                                disabled={loading || uploading}
                                className="md:flex items-center justify-center hidden w-full bg-gray-100 hover:bg-gray-200 text-gray-800  font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">{t('buttons.cancel')}
                        </button>
                        <button type="submit"
                                disabled={loading || uploading}
                                className=" flex items-center w-full justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm text-sm md:text-base">
                            {loading && <Loader2 size={18} className="animate-spin"/>}
                            {editTicket ? t('buttons.update') : t('buttons.create')}
                    </button>
                        <button type="button" disabled={loading || uploading}  onClick={onBack}
                                className="flex-1 md:hidden bg-gray-100 w-full mt-3 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base">{t('buttons.cancel')}
                        </button>

                    </div>
                    {/*<div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">*/}
                    {/*    <button*/}
                    {/*        type="button"*/}
                    {/*        onClick={onBack}*/}
                    {/*        disabled={loading || uploading}*/}
                    {/*        className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"*/}
                    {/*    >*/}
                    {/*        {t('buttons.cancel')}*/}
                    {/*    </button>*/}
                    {/*    <button*/}
                    {/*        type="submit"*/}
                    {/*        disabled={loading || uploading}*/}
                    {/*        className="lg:px-6 text-sm lg:text-base px-2 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"*/}
                    {/*    >*/}
                    {/*        {loading && <Loader2 size={18} className="animate-spin"/>}*/}
                    {/*        {editTicket ? t('buttons.update') : t('buttons.create')}*/}
                    {/*    </button>*/}
                    {/*</div>*/}
                </div>
            </form>
        </div>
    );
};

export default CreateTicket;