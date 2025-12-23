import React, {useEffect, useState} from 'react';
import {useVouchers} from "../../hooks/useVouchers.js";
import {Controller, useForm} from "react-hook-form";
import {toast} from "react-toastify";
import ArrowIcon from "../common/ArrowIcon.jsx";
import MainInput from "../MainInput.jsx";
import {Loader2} from "lucide-react";
import { useTranslation } from 'react-i18next';

const CreateVouchers = ({ onBack, editVoucher = null }) => {
    const { t, i18n } = useTranslation(['createEditVoucher', 'common']);
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
    const isRTL = i18n.language === 'ar';

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
        // Prepare the data for submission
        const formData = {
            is_active: Boolean(data.is_active),
            code: String(data.code),
            name: String(data.name),
            description: data.description ? String(data.description) : "",
            discount_type: String(data.discount_type),
            discount_amount: String(data.discount_amount || "0"),
            valid_from: data.valid_from ? `${data.valid_from}T00:00:00.000Z` : null,
            valid_to: data.valid_to ? `${data.valid_to}T23:59:59.999Z` : null,
            num_of_uses: data.num_of_uses ? parseInt(data.num_of_uses) : 9223372036854776000,
            max_discount_amount: data.max_discount_amount ? String(data.max_discount_amount) : "",
        };

        // Remove empty optional fields
        const cleanedData = {
            ...formData,
            ...(formData.description === "" && { description: undefined }),
            ...(formData.max_discount_amount === "" && { max_discount_amount: undefined }),
            ...(formData.valid_from === null && { valid_from: undefined }),
            ...(formData.valid_to === null && { valid_to: undefined }),
        };

        try {
            let result;
            if (editVoucher) {
                result = await updateVoucher({ id: editVoucher.id, data: cleanedData });
            } else {
                result = await addVoucher(cleanedData);
            }

            if (result.success || result.type?.includes('fulfilled')) {
                toast.success(editVoucher
                    ? t('createEditVoucher:form.messages.success.edit')
                    : t('createEditVoucher:form.messages.success.create')
                );
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

    // Helper function to get discount type label
    const getDiscountTypeLabel = () => {
        return watchDiscountType === 'percentage'
            ? t('createEditVoucher:form.labels.discountAmount', { type: t('createEditVoucher:form.options.discountTypes[0].label') })
            : t('createEditVoucher:form.labels.discountAmount', { type: t('createEditVoucher:form.options.discountTypes[1].label') });
    };

    return (
        <div className="container mx-auto px-4">
            {/* Header */}
            <button
                onClick={onBack}
                className={`flex items-center gap-2 text-xl bg-white p-5 py-3 rounded-lg w-full text-gray-600 hover:text-gray-900 mb-4 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
                <ArrowIcon size={'xl'} direction={isRTL ? 'left' : 'left'} />
                <span className="font-medium">{t('createEditVoucher:backButton')}</span>
            </button>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="">
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-xl lg:text-2xl font-bold text-primary-700">
                            {editVoucher
                                ? t('createEditVoucher:title.edit')
                                : t('createEditVoucher:title.create')
                            }
                        </h1>
                        <p className="text-gray-400 mt-2 text-xs">
                            {editVoucher
                                ? t('createEditVoucher:form.helperText.description')
                                : t('createEditVoucher:form.helperText.description')
                            }
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
                                    required: t('createEditVoucher:form.messages.errors.required', {field: t('createEditVoucher:form.labels.code')}),
                                    minLength: {
                                        value: 3,
                                        message: t('createEditVoucher:form.messages.errors.minLength', {
                                            field: t('createEditVoucher:form.labels.code'),
                                            min: 3
                                        })
                                    }
                                }}
                                render={({field}) => (
                                    <MainInput
                                        label={t('createEditVoucher:form.labels.code')}
                                        type="text"
                                        placeholder={t('createEditVoucher:form.placeholders.code')}
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
                                    {t('createEditVoucher:form.buttons.regenerate')}
                                </button>
                            )}
                        </div>

                        <Controller
                            name="name"
                            control={control}
                            rules={{
                                required: t('createEditVoucher:form.messages.errors.required', {field: t('createEditVoucher:form.labels.name')}),
                                minLength: {
                                    value: 3,
                                    message: t('createEditVoucher:form.messages.errors.minLength', {
                                        field: t('createEditVoucher:form.labels.name'),
                                        min: 3
                                    })
                                }
                            }}
                            render={({field}) => (
                                <MainInput
                                    label={t('createEditVoucher:form.labels.name')}
                                    type="text"
                                    placeholder={t('createEditVoucher:form.placeholders.name')}
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
                            render={({field}) => (
                                <MainInput
                                    label={t('createEditVoucher:form.labels.description')}
                                    type="textarea"
                                    rows="2"
                                    placeholder={t('createEditVoucher:form.placeholders.description')}
                                    error={errors.description?.message}
                                    disabled={loading}
                                    helperText={t('createEditVoucher:form.helperText.description')}
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
                            rules={{
                                required: t('createEditVoucher:form.messages.errors.required', {field: t('createEditVoucher:form.labels.discountType')})
                            }}
                            render={({field}) => (
                                <MainInput
                                    label={t('createEditVoucher:form.labels.discountType')}
                                    type="select"
                                    options={t('createEditVoucher:form.options.discountTypes', {returnObjects: true})}
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
                                required: t('createEditVoucher:form.messages.errors.required', {field: getDiscountTypeLabel()}),
                                min: {
                                    value: 0,
                                    message: t('createEditVoucher:form.messages.errors.positive')
                                },
                                validate: (value, formValues) => {
                                    if (formValues.discount_type === 'percentage' && value > 100) {
                                        return t('createEditVoucher:form.messages.errors.percentageExceed');
                                    }
                                    return true;
                                }
                            }}
                            render={({field}) => (
                                <MainInput
                                    label={getDiscountTypeLabel()}
                                    type="number"
                                    placeholder={
                                        watchDiscountType === 'percentage'
                                            ? t('createEditVoucher:form.placeholders.percentage')
                                            : t('createEditVoucher:form.placeholders.fixed')
                                    }
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
                                    min: {
                                        value: 0,
                                        message: t('createEditVoucher:form.messages.errors.positive')
                                    }
                                }}
                                render={({field}) => (
                                    <MainInput
                                        label={t('createEditVoucher:form.labels.maxDiscountAmount')}
                                        type="number"
                                        placeholder={t('createEditVoucher:form.placeholders.fixed')}
                                        error={errors.max_discount_amount?.message}
                                        disabled={loading}
                                        helperText={t('createEditVoucher:form.helperText.maxDiscount')}
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
                            render={({field}) => (
                                <MainInput
                                    label={t('createEditVoucher:form.labels.validFrom')}
                                    type="date"
                                    error={errors.valid_from?.message}
                                    disabled={loading}
                                    helperText={t('createEditVoucher:form.helperText.validFrom')}
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="valid_to"
                            control={control}
                            render={({field}) => (
                                <MainInput
                                    label={t('createEditVoucher:form.labels.validTo')}
                                    type="date"
                                    error={errors.valid_to?.message}
                                    disabled={loading}
                                    helperText={t('createEditVoucher:form.helperText.validTo')}
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
                                min: {
                                    value: 1,
                                    message: t('createEditVoucher:form.messages.errors.minUsage')
                                }
                            }}
                            render={({field}) => (
                                <MainInput
                                    label={t('createEditVoucher:form.labels.usageLimit')}
                                    type="number"
                                    placeholder={t('createEditVoucher:form.placeholders.usageLimit')}
                                    error={errors.num_of_uses?.message}
                                    disabled={loading}
                                    helperText={t('createEditVoucher:form.helperText.usageLimit')}
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
                            render={({field: {value, onChange, ...field}}) => (
                                <MainInput
                                    label={t('createEditVoucher:form.labels.activeStatus')}
                                    type="checkbox"
                                    className={'flex py-5 flex-col-reverse'}
                                    checked={value}
                                    onChange={(e) => onChange(e.target.checked)}
                                    disabled={loading}
                                    helperText={t('createEditVoucher:form.helperText.activeStatus')}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Form Actions */}
                    <div className={`md:flex gap-4 pt-6 border-t ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                        {/* Desktop Cancel Button (Hidden on Mobile) */}
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={loading}
                            className="hidden md:flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base disabled:opacity-50"
                        >
                            {t('createEditVoucher:form.buttons.cancel')}
                        </button>

                        {/* Primary Action Button (Full width on all screens) */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center w-full justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm text-sm md:text-base disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin"/>
                            ) : (
                                editVoucher
                                    ? t('createEditVoucher:form.buttons.submit.edit')
                                    : t('createEditVoucher:form.buttons.submit.create')
                            )}
                        </button>

                        {/* Mobile Cancel Button (Hidden on Desktop) */}
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={loading}
                            className="md:hidden flex items-center justify-center w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base disabled:opacity-50"
                        >
                            {t('createEditVoucher:form.buttons.cancel')}
                        </button>
                    </div>
                    {/*<div className={`flex items-center justify-end gap-4 pt-6 border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>*/}
                    {/*    <button*/}
                    {/*        type="button"*/}
                    {/*        onClick={onBack}*/}
                    {/*        disabled={loading}*/}
                    {/*        className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"*/}
                    {/*    >*/}
                    {/*        {t('createEditVoucher:form.buttons.cancel')}*/}
                    {/*    </button>*/}
                    {/*    <button*/}
                    {/*        type="submit"*/}
                    {/*        disabled={loading}*/}
                    {/*        className="lg:px-6 text-sm lg:text-base px-2 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"*/}
                    {/*    >*/}
                    {/*        {loading && <Loader2 size={18} className="animate-spin"/>}*/}
                    {/*        {editVoucher*/}
                    {/*            ? t('createEditVoucher:form.buttons.submit.edit')*/}
                    {/*            : t('createEditVoucher:form.buttons.submit.create')*/}
                    {/*        }*/}
                    {/*    </button>*/}
                    {/*</div>*/}
                </div>
            </form>
        </div>
    );
};

export default CreateVouchers;