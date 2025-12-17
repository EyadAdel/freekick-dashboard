// src/components/common/MuiPhoneInput.jsx
import React from 'react';
import { FormControl, FormHelperText } from '@mui/material';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';

const MuiPhoneInput = ({
                           value = '',
                           onChange,
                           label = 'Phone Number',
                           error = false,
                           helperText = '',
                           required = false,
                           disabled = false,
                           fullWidth = true,
                           size = 'medium',
                           ...props
                       }) => {

    // 1. Language Detection
    const getAppLanguage = () => {
        if (typeof window === 'undefined') return 'en';
        try {
            return localStorage.getItem('appLanguage') || 'en';
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            return 'en';
        }
    };

    const appLanguage = getAppLanguage();
    const isRTL = appLanguage === 'en';

    // 2. Dynamic Height
    const getInputHeight = () => {
        switch (size) {
            case 'small': return '40px';
            case 'large': return '56px';
            default: return '48px';
        }
    };

    // 3. Dynamic Padding based on Direction
    const getInputPadding = () => {
        // Format: "Top Right Bottom Left"
        if (size === 'small') {
            // If RTL: Flag is on Right (needs big padding right), Text starts from Left (small padding)
            return isRTL ? '8px 52px 8px 14px' : '8px 14px 8px 52px';
        }
        // Large/Default
        return isRTL ? '16.5px 60px 16.5px 14px' : '16.5px 14px 16.5px 60px';
    };

    return (
        <FormControl
            fullWidth={fullWidth}
            error={error}
            disabled={disabled}
            required={required}
            dir={isRTL ? 'rtl' : 'ltr'} // Sets alignment for helper text
            sx={{
                '& .react-tel-input .form-control': {
                    width: '100%', // Ensure library class doesn't override width
                }
            }}
        >
            <PhoneInput
                country={'ae'}
                value={value}
                onChange={onChange}

                // Localization (Optional: Customize placeholder based on lang)
                searchPlaceholder={isRTL ? 'بحث عن الدولة...' : 'Search countries...'}

                inputProps={{
                    required,
                    disabled,
                    name: 'phone', // Good practice to have a name
                }}

                inputStyle={{
                    width: '100%',
                    height: getInputHeight(),
                    padding: getInputPadding(),
                    fontSize: '16px',
                    borderColor: error ? '#f44336' : '#ccc',
                    backgroundColor: disabled ? 'rgba(0, 0, 0, 0.12)' : '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    // Note: We keep direction 'ltr' for the input text itself
                    // because phone numbers (+20 123) are always displayed LTR.
                    direction: 'ltr',
                    textAlign: isRTL ? 'left' : 'left',
                }}

                buttonStyle={{
                    padding: '0 8px',
                    border: 'none',
                    background: 'transparent',

                    // RTL Logic for Button Position
                    left: isRTL ? 'auto' : 'auto',
                    // right: isRTL ? '0' : 'auto',

                    // Flip Borders
                    borderRight: isRTL ? 'none' : '1px solid #e2e8f0',
                    borderLeft: isRTL ? '1px solid #e2e8f0' : 'none',

                    // Flip Border Radius
                    borderRadius: isRTL ? '0 12px 12px 0' : '12px 0 0 12px',
                }}

                containerStyle={{
                    width: '100%',
                    direction: isRTL ? 'ltr' : 'ltr', // Ensures the dropdown renders correctly
                }}

                dropdownStyle={{
                    zIndex: 9999,
                    borderRadius: '12px',
                    textAlign: isRTL ? 'right' : 'left'
                }}

                enableSearch={true}
                specialLabel=""
                {...props}
            />

            {helperText && (
                <FormHelperText sx={{
                    mx: 0,
                    mt: 0.5,
                    textAlign: isRTL ? 'left' : 'left'
                }}>
                    {helperText}
                </FormHelperText>
            )}
        </FormControl>
    );
};

export default MuiPhoneInput;