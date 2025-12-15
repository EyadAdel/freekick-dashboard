import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { TextField, MenuItem, InputAdornment } from '@mui/material';
import { useTranslation } from 'react-i18next'; // Import Hook

// Import your service and constants
import { pitchOwnersService } from '../../services/pitchOwners/pitchOwnersService';
import { stuffActionListService } from '../../services/stuffActionListService.js';

const AddActionModal = ({ isOpen, onClose, onSuccess, staffId }) => {
    const { t } = useTranslation('pitchOwnerDetails'); // Use same namespace

    // Initial State
    const initialFormState = {
        kind: '',
        amount: '',
        description: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormState);
            setErrors({});
            setLoading(false);
        }
    }, [isOpen]);

    // Handle Input Changes
    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // Validation
    const validate = () => {
        const newErrors = {};
        if (!formData.kind) newErrors.kind = t('actionModal.validation.kindRequired');
        if (!formData.amount || formData.amount <= 0) newErrors.amount = t('actionModal.validation.amountRequired');
        if (!formData.description) newErrors.description = t('actionModal.validation.descRequired');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            const payload = {
                staff: staffId, // The ID from the parent component
                kind: formData.kind,
                amount: formData.amount,
                description: formData.description
            };

            await pitchOwnersService.createStaffAction(payload);

            // On success
            onSuccess(); // Refresh parent table
            onClose();   // Close modal
        } catch (error) {
            console.error("Submission error", error);
            // Toast is already handled in the service
        } finally {
            setLoading(false);
        }
    };

    // Render nothing if closed
    if (!isOpen) return null;

    // Common MUI Style for consistency
    const muiInputStyles = {
        backgroundColor: 'white',
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&.Mui-focused fieldset': {
                borderColor: '#3b82f6', // primary-500
            },
        },
    };

    const actionOptions = stuffActionListService.getAll();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">{t('actionModal.title')}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* 1. Kind (Dropdown) */}
                    <TextField
                        select
                        fullWidth
                        label={t('actionModal.labels.actionType')}
                        variant="outlined"
                        size="small"
                        value={formData.kind}
                        onChange={(e) => handleChange('kind', e.target.value)}
                        error={!!errors.kind}
                        helperText={errors.kind}
                        sx={muiInputStyles}
                    >
                        {actionOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* 2. Amount (Number) */}
                    <TextField
                        fullWidth
                        type="number"
                        label={t('actionModal.labels.amount')}
                        variant="outlined"
                        size="small"
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', e.target.value)}
                        error={!!errors.amount}
                        helperText={errors.amount}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">AED</InputAdornment>,
                            inputProps: { min: 0, step: "0.01" }
                        }}
                        sx={muiInputStyles}
                    />

                    {/* 3. Description (Textarea) */}
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label={t('actionModal.labels.description')}
                        variant="outlined"
                        placeholder={t('actionModal.labels.descPlaceholder')}
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        error={!!errors.description}
                        helperText={errors.description}
                        sx={muiInputStyles}
                    />

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            disabled={loading}
                        >
                            {t('actionModal.buttons.cancel')}
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    {t('actionModal.buttons.saving')}
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    {t('actionModal.buttons.submit')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddActionModal;