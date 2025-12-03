import React, {useEffect, useState} from 'react';
import {useVouchers} from "../../hooks/useVouchers.js";
import {Controller, useForm} from "react-hook-form";
import {toast} from "react-toastify";
import ArrowIcon from "../common/ArrowIcon.jsx";
import MainInput from "../MainInput.jsx";
import {Loader2} from "lucide-react";

const CreateVouchers =  ({ onBack, editVoucher = null }) => {
    const { addVoucher, editVoucher: updateVoucher, loading } = useVouchers();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm({
        defaultValues: {
            code: '',
            name: '',
            description: '',
            discount_type: 'percentage',
            discount_amount: '',
            max_discount_amount: '',
            num_of_uses: '',
            valid_from: '',
            valid_to: '',
            is_active: true
        }
    });

    const watchDiscountType = watch('discount_type');

    // Generate random voucher code
    const generateVoucherCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    // Populate form when editing
    useEffect(() => {
        if (editVoucher) {
            reset({
                code: editVoucher.code || '',
                name: editVoucher.name || '',
                description: editVoucher.description || '',
                discount_type: editVoucher.discount_type || 'percentage',
                discount_amount: editVoucher.discount_amount || '',
                max_discount_amount: editVoucher.max_discount_amount || '',
                num_of_uses: editVoucher.num_of_uses || '',
                valid_from: editVoucher.valid_from ? editVoucher.valid_from.split('T')[0] : '',
                valid_to: editVoucher.valid_to ? editVoucher.valid_to.split('T')[0] : '',
                is_active: editVoucher.is_active ?? true,
            });
        } else {
            // Auto-generate code for new voucher
            reset(prev => ({
                ...prev,
                code: generateVoucherCode()
            }));
        }
    }, [editVoucher, reset]);

    // Handle form submission
    const onSubmit = async (data) => {
        // Prepare the data for submission - convert to strings as expected by backend
        const formData = {
            is_active: Boolean(data.is_active),
            code: String(data.code),
            name: String(data.name),
            description: data.description ? String(data.description) : "",
            discount_type: String(data.discount_type),
            discount_amount: String(data.discount_amount || "0"),
            valid_from: data.valid_from ? `${data.valid_from}T00:00:00.000Z` : null,
            valid_to: data.valid_to ? `${data.valid_to}T23:59:59.999Z` : null,
            num_of_uses: data.num_of_uses ? parseInt(data.num_of_uses) : 9223372036854776000, // Max int for unlimited
            max_discount_amount: data.max_discount_amount ? String(data.max_discount_amount) : "",
        };

        // Remove completely empty optional fields if backend doesn't accept them
        const cleanedData = {
            ...formData,
            // For optional fields that should be omitted when empty
            ...(formData.description === "" && { description: undefined }),
            ...(formData.max_discount_amount === "" && { max_discount_amount: undefined }),
            ...(formData.valid_from === null && { valid_from: undefined }),
            ...(formData.valid_to === null && { valid_to: undefined }),
        };

        console.log('Submitting voucher data:', cleanedData);

        try {
            let result;
            if (editVoucher) {
                result = await updateVoucher({ id: editVoucher.id, data: cleanedData });
            } else {
                result = await addVoucher(cleanedData);
            }

            if (result.success || result.type?.includes('fulfilled')) {
                toast.success(editVoucher ? 'Voucher updated successfully' : 'Voucher created successfully');
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
    // Regenerate code
    const handleRegenerateCode = () => {
        const newCode = generateVoucherCode();
        reset(prev => ({ ...prev, code: newCode }));
    };

    return (
        <div className="container mx-auto px-4">
            {/* Header */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-xl bg-white p-5 py-3 rounded-lg w-full text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
                <ArrowIcon size={'xl'} direction={'left'} />
                <span className="font-medium">Back to Vouchers</span>
            </button>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="">
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-xl lg:text-2xl font-bold text-primary-700">
                            {editVoucher ? 'Edit Voucher' : 'Create New Voucher'}
                        </h1>
                        <p className="text-gray-400 mt-2 text-xs">
                            {editVoucher ? 'Update voucher information' : 'Fill in the details to create a new voucher'}
                        </p>
                    </div>
                    <div className="my-6"></div>

                    {/* Voucher Code and Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Controller
                                name="code"
                                control={control}
                                rules={{
                                    required: 'Voucher code is required',
                                    minLength: { value: 3, message: 'Code must be at least 3 characters' }
                                }}
                                render={({ field }) => (
                                    <MainInput
                                        label="Voucher Code"
                                        type="text"
                                        placeholder="Enter voucher code"
                                        required
                                        error={errors.code?.message}
                                        disabled={loading}
                                        {...field}
                                    />
                                )}
                            />
                            {!editVoucher && (
                                <button
                                    type="button"
                                    onClick={handleRegenerateCode}
                                    className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                                >
                                    Regenerate Code
                                </button>
                            )}
                        </div>

                        <Controller
                            name="name"
                            control={control}
                            rules={{
                                required: 'Voucher name is required',
                                minLength: { value: 3, message: 'Name must be at least 3 characters' }
                            }}
                            render={({ field }) => (
                                <MainInput
                                    label="Voucher Name"
                                    type="text"
                                    placeholder="Enter voucher name"
                                    required
                                    error={errors.name?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <MainInput
                                    label="Description (Optional)"
                                    type="textarea"
                                    rows="2"
                                    placeholder="Enter voucher description"
                                    error={errors.description?.message}
                                    disabled={loading}
                                    helperText="Optional description for the voucher"
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Discount Type and Amount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="discount_type"
                            control={control}
                            rules={{ required: 'Discount type is required' }}
                            render={({ field }) => (
                                <MainInput
                                    label="Discount Type"
                                    type="select"
                                    options={[
                                        { value: 'percentage', label: 'Percentage (%)' },
                                        { value: 'fixed', label: 'Fixed Amount ($)' }
                                    ]}
                                    required
                                    error={errors.discount_type?.message}
                                    disabled={loading}
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="discount_amount"
                            control={control}
                            rules={{
                                required: 'Discount amount is required',
                                min: { value: 0, message: 'Amount must be positive' },
                                validate: (value, formValues) => {
                                    if (formValues.discount_type === 'percentage' && value > 100) {
                                        return 'Percentage cannot exceed 100%';
                                    }
                                    return true;
                                }
                            }}
                            render={({ field }) => (
                                <MainInput
                                    label={`Discount ${watchDiscountType === 'percentage' ? 'Percentage' : 'Amount'}`}
                                    type="number"
                                    placeholder={watchDiscountType === 'percentage' ? "0" : "0.00"}
                                    required
                                    error={errors.discount_amount?.message}
                                    disabled={loading}
                                    step={watchDiscountType === 'percentage' ? 1 : 0.01}
                                    min={0}
                                    max={watchDiscountType === 'percentage' ? 100 : undefined}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Max Discount Amount (only for percentage type) */}
                    {watchDiscountType === 'percentage' && (
                        <div>
                            <Controller
                                name="max_discount_amount"
                                control={control}
                                rules={{
                                    min: { value: 0, message: 'Amount must be positive' }
                                }}
                                render={({ field }) => (
                                    <MainInput
                                        label="Maximum Discount Amount (Optional)"
                                        type="number"
                                        placeholder="0.00"
                                        error={errors.max_discount_amount?.message}
                                        disabled={loading}
                                        helperText="Maximum discount amount when using percentage (leave empty for no limit)"
                                        step={0.01}
                                        min={0}
                                        {...field}
                                    />
                                )}
                            />
                        </div>
                    )}

                    {/* Validity Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="valid_from"
                            control={control}
                            render={({ field }) => (
                                <MainInput
                                    label="Valid From (Optional)"
                                    type="date"
                                    error={errors.valid_from?.message}
                                    disabled={loading}
                                    helperText="Leave empty for immediate validity"
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="valid_to"
                            control={control}
                            render={({ field }) => (
                                <MainInput
                                    label="Valid Until (Optional)"
                                    type="date"
                                    error={errors.valid_to?.message}
                                    disabled={loading}
                                    helperText="Leave empty for no expiry"
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Usage Limit */}
                    <div>
                        <Controller
                            name="num_of_uses"
                            control={control}
                            rules={{
                                min: { value: 1, message: 'Must be at least 1' }
                            }}
                            render={({ field }) => (
                                <MainInput
                                    label="Maximum Usage Limit (Optional)"
                                    type="number"
                                    placeholder="Leave empty for unlimited"
                                    error={errors.num_of_uses?.message}
                                    disabled={loading}
                                    helperText="Maximum number of times this voucher can be used"
                                    min={1}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Active Status Checkbox */}
                    <div className="pt-4 border-t border-gray-200">
                        <Controller
                            name="is_active"
                            control={control}
                            render={({ field: { value, onChange, ...field } }) => (
                                <MainInput
                                    label="Active Voucher"
                                    type="checkbox"
                                    className={'flex py-5 flex-col-reverse'}
                                    checked={value}
                                    onChange={(e) => onChange(e.target.checked)}
                                    disabled={loading}
                                    helperText="Inactive vouchers cannot be used"
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={loading}
                            className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="lg:px-6 text-sm lg:text-base px-2 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {editVoucher ? 'Update Voucher' : 'Create Voucher'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateVouchers;