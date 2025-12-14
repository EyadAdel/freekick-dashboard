import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ============================================================================
// UTILITY CLASS
// ============================================================================

class DateFormatter {
    static toAPI(date) {
        return date.toISOString().split('T')[0];
    }

    static toDisplay(date, locale = 'en-US') {
        const options = {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        };

        // For Arabic locale, adjust the weekday format
        if (locale === 'ar') {
            options.weekday = 'long';
            options.month = 'long';
        }

        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', options);
    }

    static toInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// ============================================================================
// DATE PICKER POPUP COMPONENT
// ============================================================================

const DatePickerPopup = ({
                             show,
                             tempDate,
                             onDateChange,
                             onDateBlur,
                             onYesterday,
                             onTomorrow,
                             onClose
                         }) => {
    const { t, i18n } = useTranslation(['calendar', 'common']);

    if (!show) return null;

    return (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-[280px]">
            <div className={`mb-3 flex ${i18n.dir() === 'rtl' ? 'flex-row-reverse' : 'justify-between'} items-center`}>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={onYesterday}
                        className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {t('calendar.datePicker.yesterday', 'Yesterday')}
                    </button>
                    <button
                        onClick={onTomorrow}
                        className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {t('calendar.datePicker.tomorrow', 'Tomorrow')}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                >
                    {t('calendar.datePicker.close', '✕')}
                </button>
            </div>
            <input
                type="date"
                value={DateFormatter.toInput(tempDate)}
                onChange={onDateChange}
                onBlur={onDateBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr" // Keep date input LTR for consistency
            />
        </div>
    );
};

// ============================================================================
// REUSABLE DATE PICKER COMPONENT
// ============================================================================

const ReusableDatePicker = ({
                                selectedDate,
                                onDateChange,
                                disabled = false,
                                showTodayButton = true,
                                compact = false
                            }) => {
    const { t, i18n } = useTranslation(['calendar']);
    const [tempDate, setTempDate] = useState(selectedDate);
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        onDateChange(newDate);
        setShowPicker(false);
    };

    const setToday = () => {
        onDateChange(new Date());
        setShowPicker(false);
    };

    const setYesterday = () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        onDateChange(yesterday);
        setShowPicker(false);
    };

    const setTomorrow = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        onDateChange(tomorrow);
        setShowPicker(false);
    };

    const handleDateChange = (event) => {
        setTempDate(new Date(event.target.value));
    };

    const handleDateBlur = () => {
        onDateChange(tempDate);
        setTimeout(() => setShowPicker(false), 0);
    };

    // Sync temp date when picker opens
    useEffect(() => {
        if (showPicker) {
            setTempDate(selectedDate);
        }
    }, [showPicker, selectedDate]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                if (tempDate && DateFormatter.toInput(tempDate) !== DateFormatter.toInput(selectedDate)) {
                    onDateChange(tempDate);
                }
                setShowPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [tempDate, selectedDate, onDateChange]);

    // Check if current language is RTL
    const isRTL = i18n.dir() === 'rtl';

    if (compact) {
        return (
            <div className="flex items-center gap-2 relative" ref={pickerRef}>
                <button
                    onClick={() => changeDate(-1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
                    disabled={disabled}
                    aria-label={t('calendar:datePicker.previousDay')}
                >
                    {isRTL ? (
                        <ChevronRight className="w-4 h-4 text-primary-600" />
                    ) : (
                        <ChevronLeft className="w-4 h-4 text-primary-600" />
                    )}
                </button>

                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="text-sm text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                    disabled={disabled}
                >
                    <Calendar className="w-4 h-4 text-primary-600" />
                    {DateFormatter.toDisplay(selectedDate, i18n.language)}
                </button>

                <button
                    onClick={() => changeDate(1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
                    disabled={disabled}
                    aria-label={t('calendar:datePicker.nextDay')}
                >
                    {isRTL ? (
                        <ChevronLeft className="w-4 h-4 text-primary-600" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-primary-600" />
                    )}
                </button>

                <DatePickerPopup
                    show={showPicker}
                    tempDate={tempDate}
                    onDateChange={handleDateChange}
                    onDateBlur={handleDateBlur}
                    onYesterday={setYesterday}
                    onTomorrow={setTomorrow}
                    onClose={() => setShowPicker(false)}
                />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 relative" ref={pickerRef}>
            <button
                onClick={() => changeDate(-1)}
                className="p-2 rounded-lg transition-all disabled:opacity-50"
                disabled={disabled}
                aria-label={t('calendar:datePicker.previousDay')}
            >
                {isRTL ? (
                    <ChevronRight className="w-5 h-5 xl:w-8 xl:h-8 font-bold text-primary-700" />
                ) : (
                    <ChevronLeft className="w-5 h-5 xl:w-8 xl:h-8 font-bold text-primary-700" />
                )}
            </button>

            <button
                onClick={() => setShowPicker(!showPicker)}
                className="text-sm lg:text-lg font-semibold text-gray-900 lg:min-w-[200px] text-center lg:px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={disabled}
            >
                {DateFormatter.toDisplay(selectedDate, i18n.language)}
            </button>

            {showTodayButton && (
                <button
                    onClick={setToday}
                    className="lg:px-4 lg:py-2 px-2 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm lg:text-base rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50"
                    disabled={disabled}
                >
                    {t('calendar.header.today', 'Today')}
                </button>
            )}

            <button
                onClick={() => changeDate(1)}
                className="p-2 rounded-lg transition-all disabled:opacity-50"
                disabled={disabled}
                aria-label={t('calendar:datePicker.nextDay')}
            >
                {isRTL ? (
                    <ChevronLeft className="w-5 h-5 xl:w-8 xl:h-8 font-bold text-primary-700" />
                ) : (
                    <ChevronRight className="w-5 h-5 xl:w-8 xl:h-8 font-bold text-primary-700" />
                )}
            </button>

            <DatePickerPopup
                show={showPicker}
                tempDate={tempDate}
                onDateChange={handleDateChange}
                onDateBlur={handleDateBlur}
                onYesterday={setYesterday}
                onTomorrow={setTomorrow}
                onClose={() => setShowPicker(false)}
            />
        </div>
    );
};

export { ReusableDatePicker, DateFormatter };