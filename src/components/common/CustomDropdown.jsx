import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomDropdown = ({
                            options = [],
                            value,
                            onChange,
                            placeholder = 'Select an option',
                            className = '',
                            buttonClassName = '',
                            dropdownClassName = '',
                            optionClassName = '',
                            selectedOptionClassName = '',
                            label = null,
                            disabled = false
                        }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`appearance-none px-4 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400 rounded-lg text-sm pr-5 flex items-center justify-between min-w-[130px] disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
            >
                <span>{displayText}</span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && !disabled && (
                <div className={`absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 min-w-[120px] ${dropdownClassName}`}>
                    {options.map((option, index) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`px-4 py-3 text-xs cursor-pointer hover:bg-primary-50 transition-colors border-b border-primary-100 mx-2 last:border-b-0 ${
                                value === option.value
                                    ? `bg-primary-50 text-primary-700 font-medium ${selectedOptionClassName}`
                                    : `text-gray-700 ${optionClassName}`
                            }`}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;