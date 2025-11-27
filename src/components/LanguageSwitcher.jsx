// src/components/LanguageSwitcher.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../store/languageSlice';
import { Globe, ChevronDown } from 'lucide-react';

const LanguageSwitcher = () => {
    const dispatch = useDispatch();
    const { currentLanguage } = useSelector((state) => state.language);
    const [showDropdown, setShowDropdown] = React.useState(false);

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    ];

    const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

    const handleLanguageChange = (langCode) => {
        dispatch(setLanguage(langCode));
        setShowDropdown(false);
    };

    const handleClickOutside = (event) => {
        if (!event.target.closest('.language-switcher')) {
            setShowDropdown(false);
        }
    };

    React.useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative language-switcher">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Globe className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 uppercase">
                    {currentLang.code}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Select Language
                        </div>
                        {languages.map((language) => (
                            <button
                                key={language.code}
                                onClick={() => handleLanguageChange(language.code)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors ${
                                    currentLanguage === language.code
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-700'
                                }`}
                            >
                                <span className="text-lg">{language.flag}</span>
                                <span>{language.name}</span>
                                {currentLanguage === language.code && (
                                    <div className="w-2 h-2 bg-primary-600 rounded-full ml-auto"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;