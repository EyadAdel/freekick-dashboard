import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

const MainInput = ({
                       label,
                       name,
                       type = 'text',
                       value,
                       onChange,
                       placeholder = '',
                       error = '',
                       helperText = '',
                       icon: Icon, // Pass an icon component (e.g., Mail)
                       options = [], // For select inputs
                       disabled = false,
                       required = false,
                       className = '',
                       ...props
                   }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isError = error.length > 0;

    // Toggle Password Visibility
    const togglePassword = () => setShowPassword(!showPassword);

    // Dynamic Input Type for Password
    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

    // Base Styles
    const baseStyles = `
    w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-200 ease-in-out
    placeholder:text-gray-400 focus:outline-none focus:ring-4
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
  `;

    // State Styles (Error vs Normal)
    const stateStyles = isError
        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100/50 text-red-900'
        : 'border-gray-200 bg-white focus:border-blue-600 focus:ring-blue-100 text-gray-900 hover:border-blue-300';

    // Wrapper for Inputs
    const renderInputWrapper = (children) => (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label htmlFor={name} className="text-sm font-medium text-gray-700 flex justify-between">
                    <span>{label} {required && <span className="text-red-500">*</span>}</span>
                </label>
            )}

            <div className="relative">
                {/* Left Icon (if provided) */}
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Icon size={18} />
                    </div>
                )}

                {children}

                {/* Right Icon (Error or Password Toggle) */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {type === 'password' && (
                        <button
                            type="button"
                            onClick={togglePassword}
                            disabled={disabled}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}

                    {isError && type !== 'password' && (
                        <AlertCircle size={18} className="text-red-500" />
                    )}
                </div>
            </div>

            {/* Helper Text or Error Message */}
            {(isError || helperText) && (
                <p className={`text-xs ${isError ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );

    // 1. Textarea
    if (type === 'textarea') {
        return renderInputWrapper(
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                rows={4}
                className={`${baseStyles} ${stateStyles} ${Icon ? 'pl-10' : ''} resize-none`}
                {...props}
            />
        );
    }

    // 2. Select
    if (type === 'select') {
        return renderInputWrapper(
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`${baseStyles} ${stateStyles} ${Icon ? 'pl-10' : ''} appearance-none`}
                {...props}
            >
                <option value="" disabled>{placeholder || 'Select an option'}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    }

    // 3. Checkbox (Special Layout)
    if (type === 'checkbox') {
        return (
            <div className={`flex items-start gap-3 ${className}`}>
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={value}
                        onChange={onChange}
                        disabled={disabled}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-blue-600 checked:bg-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                        {...props}
                    />
                    <Check size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col">
                    <label htmlFor={name} className="cursor-pointer text-sm font-medium text-gray-700">
                        {label}
                    </label>
                    {helperText && <p className="text-xs text-gray-500 mt-0.5">{helperText}</p>}
                    {isError && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
                </div>
            </div>
        );
    }

    // 4. Standard Input (Text, Email, Password, Number, Date, etc.)
    return renderInputWrapper(
        <input
            id={name}
            type={inputType}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`${baseStyles} ${stateStyles} ${Icon ? 'pl-10' : ''}`}
            {...props}
        />
    );
};

export default MainInput;