// src/components/common/MuiPhoneInput.jsx
import React from 'react';
import { TextField, FormControl, FormHelperText, Box } from '@mui/material';
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
    const getInputHeight = () => {
        switch (size) {
            case 'small': return '40px';
            case 'large': return '56px';
            default: return '48px';
        }
    };

    const getInputPadding = () => {
        switch (size) {
            case 'small': return '8px 14px 8px 52px';
            case 'large': return '16.5px 14px 16.5px 60px';
            default: return '16.5px 14px 16.5px 60px';
        }
    };

    return (
        // <FormControl
        //     fullWidth={fullWidth}
        //     error={error}
        //     disabled={disabled}
        //     required={required}
        // >
            <PhoneInput
                country={'ae'}
                value={value}
                onChange={onChange}
                inputProps={{
                    required,
                    disabled,
                    name: null,
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
                    '&:hover': {
                        borderColor: error ? '#f44336' : '#cbd5e1',
                    },
                    '&:focus': {
                        borderColor: error ? '#f44336' : '#3b82f6',
                        boxShadow: error ? '0 0 0 2px #f44336' : '0 0 0 2px #3b82f6',
                    },
                }}
                buttonStyle={{
                    padding: '0 8px',
                    border: 'none',
                    background: 'transparent',
                    borderRight: '1px solid #e2e8f0',
                    borderRadius: '12px 0 0 12px',
                }}
                containerStyle={{
                    width: '100%',
                }}
                dropdownStyle={{
                    zIndex: 9999,
                    borderRadius: '12px',
                }}
                enableSearch={true}
                searchPlaceholder="Search countries..."
                specialLabel=""
                {...props}
            />

            // {helperText && (
            //     <FormHelperText sx={{ mx: 0, mt: 0.5 }}>
            //         {helperText}
            //     </FormHelperText>
            // )}
        // </FormControl>
    );
};

export default MuiPhoneInput;