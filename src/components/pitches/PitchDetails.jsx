import React, { useState, useEffect } from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    MapPin, CheckCircle2, XCircle,
    Info, Users, Calendar,
    Edit, LayoutGrid, Layers, Crown, Building2, Maximize,
    Clock, Save, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';

// --- Services ---
import { pitchesService } from '../../services/pitches/pitchesService.js';
import { venuesService } from '../../services/venues/venuesService.js';
import { specialPricingService } from '../../services/specialPricingService.js';
import { daysOfWeekService } from '../../services/daysOfWeek/daysOfWeekService.js';
import { bookingService } from '../../services/bookings/bookingService.js';

// --- Components ---
import ArrowIcon from '../../components/common/ArrowIcon';
import VenuesForm from './PitchesForm.jsx';

// --- Utils ---
import { IMAGE_BASE_URL } from "../../utils/ImageBaseURL.js";

// --- Helper: Language Translation ---
const getTrans = (obj, lang = 'en') => {
    if (!obj) return {};
    if (obj.name) return obj;
    return obj?.[lang] || obj?.en || {};
};

// --- Helper: Generate Time Options (00:00 - 23:00) ---
const generateTimeOptions = () => {
    const times = [];
    for (let i = 0; i < 24; i++) {
        const hour = i;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const formatted = `${String(displayHour).padStart(2, '0')}:00 ${period}`;
        const value = `${String(hour).padStart(2, '0')}:00`;
        times.push({ value, label: formatted });
    }
    return times;
};

// --- Helper: Date Formatting for Calendar ---
const formatDateForApi = (date) => date.toISOString().split('T')[0]; // YYYY-MM-DD

const formatTimeLabel = (hour) => {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const nextH = (hour + 1) % 12 || 12;
    const nextAmpm = (hour + 1) < 12 || (hour + 1) === 24 ? 'AM' : 'PM';
    return `${String(h).padStart(2, '0')}:00 ${ampm} - ${String(nextH).padStart(2, '0')}:00 ${nextAmpm}`;
};

// ==========================================
// COMPONENT: Simple Status Toggle
// ==========================================
const SimpleToggle = ({ isActive, onToggle, isLoading, t }) => {
    return (
        <div className="flex items-center gap-3">
            {/* Label color and text updates automatically */}
            <span className={`text-sm font-medium transition-colors ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {isActive ? t('status.active', 'Active') : t('status.inactive', 'Inactive')}
            </span>

            <button
                type="button"
                onClick={onToggle}
                disabled={isLoading}
                // Logical positioning: 'flex' with 'gap' handles the swap of label/button automatically in RTL
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
                    isActive ? 'bg-green-600' : 'bg-gray-200'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className="sr-only">Use setting</span>
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isActive
                            ? 'translate-x-5 rtl:-translate-x-5' // Positive X for LTR, Negative X for RTL
                            : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
};

// ==========================================
// COMPONENT: LiveSlotCalendar
// ==========================================
const LiveSlotCalendar = ({ id, t, currentLang }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'
    const [activeTab, setActiveTab] = useState('booked');

    const [bookings, setBookings] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- Helper: Get Visible Week Days ---
    const getWeekDays = (baseDate) => {
        const days = [];
        const start = new Date(baseDate);
        start.setDate(baseDate.getDate() - 2);
        for (let i = 0; i < 5; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays(selectedDate);

    // --- Helper: Check if dates match (ignoring time) ---
    const isSameDate = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    };

    // --- Fetch Data ---
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                let startDateRange = new Date(selectedDate);
                let endDateRange = new Date(selectedDate);

                if (viewMode === 'week') {
                    startDateRange = new Date(weekDays[0]);
                    endDateRange = new Date(weekDays[weekDays.length - 1]);
                }

                startDateRange.setHours(0, 0, 0, 0);
                endDateRange.setHours(23, 59, 59, 999);

                const bookingsParams = {
                    pitch__id: id,
                    start_time__gte: startDateRange.toISOString(),
                    start_time__lte: endDateRange.toISOString(),
                    page_size: 1000
                };

                const queryDateForAvailability = formatDateForApi(selectedDate);

                const [bookingsRes, availabilityRes] = await Promise.all([
                    bookingService.getAll(bookingsParams),
                    pitchesService.getPitchAvailableTime(id, queryDateForAvailability)
                ]);

                const bookingData = bookingsRes.results || bookingsRes || [];
                setBookings(bookingData);

                const availData = availabilityRes.data?.available_times || [];
                setAvailability(availData);

            } catch (error) {
                console.error("Error fetching calendar data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate, id, viewMode]);

    // --- Calculate Slots Logic ---
    const slots = [];
    for (let i = 0; i < 24; i++) {
        const startHour = i;

        const booking = bookings.find(b => {
            if (!b.start_time) return false;
            const bookingDate = new Date(b.start_time);
            const onSelectedDay = isSameDate(bookingDate, selectedDate);
            const atCurrentHour = bookingDate.getHours() === startHour;
            return onSelectedDay && atCurrentHour &&
                (b.status === 'completed' || b.status === 'pending');
        });

        const availSlot = availability.find(item => {
            const timeStr = item[0];
            if (!timeStr) return false;
            const h = parseInt(timeStr.split(':')[0], 10);
            return h === startHour;
        });

        let status = 'blocked';

        if (booking) {
            status = 'booked';
        } else if (availSlot) {
            const isAvailable = availSlot[3];
            if (isAvailable === true) {
                status = 'empty';
            } else {
                status = 'blocked';
            }
        } else {
            status = 'blocked';
        }

        if (activeTab === 'booked' && status !== 'booked') continue;
        if (activeTab === 'empty' && status !== 'empty') continue;
        if (activeTab === 'blocked' && status !== 'blocked') continue;

        slots.push({
            hour: i,
            label: formatTimeLabel(i),
            status,
            data: booking || availSlot
        });
    }

    const handleDateChange = (daysToAdd) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + daysToAdd);
        setSelectedDate(newDate);
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'booked': return t('calendar.status.booked', 'Slot Booked');
            case 'empty': return t('calendar.status.open', 'Slot Open');
            case 'blocked': return t('calendar.status.blocked', 'Slot Blocked');
            default: return status;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    {t('calendar.title', 'Live Slot Calendar')}
                </h3>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                            viewMode === 'week'
                                ? 'bg-white text-primary-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t('calendar.viewWeek', 'Week')}
                    </button>
                    <button
                        onClick={() => setViewMode('day')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                            viewMode === 'day'
                                ? 'bg-white text-primary-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t('calendar.viewDay', 'Day')}
                    </button>
                </div>
            </div>

            <div className="bg-gray-50/50 border-b border-gray-100">
                <div className="flex items-center justify-between p-2 sm:px-4">
                    <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-white rounded-full transition-colors rtl:rotate-180">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-gray-800">
                        {selectedDate.toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'default', { month: 'short', year: 'numeric' })}
                    </span>
                    <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-white rounded-full transition-colors rtl:rotate-180">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-5 gap-2 px-2 pb-2">
                    {weekDays.map((date, idx) => {
                        const isSelected = formatDateForApi(date) === formatDateForApi(selectedDate);
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(date)}
                                className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                                    isSelected
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'hover:bg-white text-gray-500'
                                }`}
                            >
                                <span className={`text-[10px] uppercase font-bold ${isSelected ? 'opacity-100' : 'opacity-80'}`}>
                                    {date.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' })}
                                </span>
                                <span className="text-lg font-bold">
                                    {date.getDate().toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US')}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex border-b border-gray-100">
                {['booked', 'empty', 'blocked'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-bold capitalize border-b-2 transition-colors ${
                            activeTab === tab
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        {t(`calendar.tabs.${tab}`, `${tab} Slots`)}
                    </button>
                ))}
            </div>

            <div className="p-4 sm:p-6 space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-500" /></div>
                ) : slots.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        {t('calendar.noSlots', { status: t(`calendar.tabs.${activeTab}`) })}
                    </div>
                ) : (
                    slots.map((slot) => (
                        <div
                            key={slot.hour}
                            className={`rounded-xl p-4 border transition-all ${
                                slot.status === 'booked' ? 'bg-orange-50/60 border-orange-100' :
                                    slot.status === 'blocked' ? 'bg-gray-100 border-gray-200 opacity-75' :
                                        'bg-white border-gray-100 hover:border-primary-200'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold uppercase tracking-wide ${
                                            slot.status === 'booked' ? 'text-orange-600' :
                                                slot.status === 'blocked' ? 'text-gray-600' : 'text-green-600'
                                        }`}>
                                            {getStatusLabel(slot.status)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">{slot.label}</p>

                                    {slot.status === 'booked' && slot.data?.user_info && (
                                        <div className="flex items-center mt-3 gap-3">
                                            <div className="relative">
                                                {slot.data.user_info.image ? (
                                                    <img
                                                        src={slot.data.user_info.image}
                                                        alt={slot.data.user_info.name}
                                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">
                                                        {slot.data.user_info.name ? slot.data.user_info.name.substring(0, 2).toUpperCase() : 'US'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-800">{slot.data.user_info.name}</span>
                                                <span className="text-[10px] text-gray-500">{slot.data.user_info.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ==========================================
// COMPONENT: PricingEditor
// ==========================================
const PricingEditor = ({ pitchId, t, currentLang }) => {
    const timeOptions = generateTimeOptions();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [daysList, setDaysList] = useState([]);
    const [schedule, setSchedule] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [daysRes, pricingRes] = await Promise.all([
                    daysOfWeekService.getAll(),
                    specialPricingService.getAll({ pitch__id: pitchId })
                ]);
                const daysData = daysRes.results || daysRes || [];
                daysData.sort((a, b) => a.id - b.id);
                setDaysList(daysData);

                const pricingData = pricingRes.results || pricingRes || [];
                const initialSchedule = {};

                pricingData.forEach(item => {
                    if (item.day_of_week) {
                        initialSchedule[item.day_of_week] = {
                            id: item.id,
                            start_time: item.start_time ? item.start_time.slice(0, 5) : '13:00',
                            end_time: item.end_time ? item.end_time.slice(0, 5) : '23:00',
                            price: item.special_price_per_hour,
                            is_active: true
                        };
                    }
                });
                setSchedule(initialSchedule);
            } catch (error) {
                console.error("Error loading pricing editor data:", error);
            } finally {
                setLoading(false);
            }
        };
        if (pitchId) fetchData();
    }, [pitchId]);

    const getEntry = (dayId) => {
        return schedule[dayId] || {
            id: null,
            start_time: '13:00',
            end_time: '23:00',
            price: '',
            is_active: false
        };
    };

    const handleInputChange = (dayId, field, value) => {
        setSchedule(prev => {
            const current = getEntry(dayId);
            return {
                ...prev,
                [dayId]: {
                    ...current,
                    [field]: value,
                    is_active: field === 'price' && value !== '' ? true : current.is_active
                }
            };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const promises = daysList.map(async (day) => {
                const entry = getEntry(day.id);
                const payload = {
                    is_active: true,
                    start_time: `${entry.start_time}:00`,
                    end_time: `${entry.end_time}:00`,
                    special_price_per_hour: entry.price,
                    pitch: pitchId,
                    day_of_week: day.id
                };

                if (entry.is_active && entry.price) {
                    if (entry.id) {
                        return specialPricingService.update(entry.id, payload);
                    } else {
                        const res = await specialPricingService.create(payload);
                        setSchedule(prev => ({
                            ...prev,
                            [day.id]: { ...prev[day.id], id: res.id }
                        }));
                        return res;
                    }
                } else if (entry.id && !entry.price) {
                    await specialPricingService.delete(entry.id);
                    setSchedule(prev => ({
                        ...prev,
                        [day.id]: { ...prev[day.id], id: null, is_active: false }
                    }));
                }
            });
            await Promise.all(promises);
        } catch (error) {
            console.error("Error saving pricing:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary-600" /></div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{t('pricing.title', 'Pricing Editor')}</h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-primary-600 text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {t('pricing.update', 'Update Price Changes')}
                </button>
            </div>

            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">{t('pricing.headers.day', 'Day')}</div>
                <div className="col-span-3">{t('pricing.headers.from', 'Time Range From')}</div>
                <div className="col-span-3">{t('pricing.headers.to', 'Time Range To')}</div>
                <div className="col-span-3">{t('pricing.headers.price', 'Price')}</div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-2">
                {daysList.map((day) => {
                    const entry = getEntry(day.id);
                    const dayName = getTrans(day.translations, currentLang)?.name || day.name || day.day || t('pricing.unknownDay', "Unknown Day");

                    return (
                        <div key={day.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center pb-4 sm:pb-0 border-b sm:border-0 border-gray-100 last:border-0">
                            <div className="sm:col-span-3 flex items-center justify-between sm:justify-start">
                                <span className="font-medium text-gray-900">{dayName}</span>
                            </div>
                            <div className="sm:col-span-3">
                                <label className="sm:hidden text-xs text-gray-400 mb-1 block">{t('pricing.headers.from', 'From')}</label>
                                <div className="relative">
                                    <select
                                        value={entry.start_time}
                                        onChange={(e) => handleInputChange(day.id, 'start_time', e.target.value)}
                                        className="w-full pl-3 pr-8 rtl:pr-3 rtl:pl-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                                    >
                                        {timeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <Clock className="absolute right-3 rtl:right-auto rtl:left-3 top-2.5 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <div className="sm:col-span-3">
                                <label className="sm:hidden text-xs text-gray-400 mb-1 block">{t('pricing.headers.to', 'To')}</label>
                                <div className="relative">
                                    <select
                                        value={entry.end_time}
                                        onChange={(e) => handleInputChange(day.id, 'end_time', e.target.value)}
                                        className="w-full pl-3 pr-8 rtl:pr-3 rtl:pl-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                                    >
                                        {timeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <Clock className="absolute right-3 rtl:right-auto rtl:left-3 top-2.5 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <div className="sm:col-span-3">
                                <label className="sm:hidden text-xs text-gray-400 mb-1 block">{t('pricing.headers.price', 'Price')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">{t('card.priceAED', 'AED')}</span>
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={entry.price}
                                        onChange={(e) => handleInputChange(day.id, 'price', e.target.value)}
                                        className="w-full pl-12 pr-3 rtl:pl-3 rtl:pr-12 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Updated Header Component (Normal Scroll, Simple Design) ---
const Header = ({ onBack, onUpdate, isEditing, t, isActive, onToggleStatus, isToggling }) => (
    <div className="bg-white shadow-sm mb-6 z-10 relative">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">

            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-3 group text-gray-500 hover:text-primary-700 transition-colors self-start sm:self-auto"
            >
                <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
                    <ArrowIcon className="w-6 h-6 transform rotate-90 text-gray-400 group-hover:text-primary-600 rtl:-rotate-90" />
                </div>
                <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{t('header.backToPitches', 'Back to Pitches')}</span>
                    <span className="block font-bold text-gray-900 leading-tight">{t('header.pitchDetails', 'Pitch Details')}</span>
                </div>
            </button>

            {!isEditing && (
                <div className="flex items-center gap-5 self-end sm:self-auto">
                    {/* Active/Inactive Simple Toggle */}
                    <SimpleToggle
                        isActive={isActive}
                        onToggle={onToggleStatus}
                        isLoading={isToggling}
                        t={t}
                    />

                    <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

                    {/* Update Button */}
                    <button
                        onClick={onUpdate}
                        className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 hover:shadow-lg transition-all duration-300"
                    >
                        <Edit size={16} />
                        <span>{t('header.updatePitch', 'Update Pitch')}</span>
                    </button>
                </div>
            )}
        </div>
    </div>
);

// --- PitchProfileCard Component ---
const PitchProfileCard = ({ pitch, venueName, t, currentLang }) => {
    const backendTrans = getTrans(pitch.translations, currentLang);
    const mainImage = pitch.image
        ? `${IMAGE_BASE_URL}${pitch.image}`
        : 'https://via.placeholder.com/400x300';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group h-full flex flex-col">
            <div className="relative h-56 sm:h-64 lg:h-72 w-full shrink-0">
                <img
                    src={mainImage}
                    alt="Pitch Cover"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${
                        pitch.is_active ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                    }`}>
                        {pitch.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {pitch.is_active ? t('status.active', 'Active') : t('status.inactive', 'Inactive')}
                    </span>
                </div>

                {pitch.is_primary && (
                    <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-10">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm bg-yellow-500/90 text-white">
                            <Crown size={12} />
                            {t('status.primary', 'Primary')}
                        </span>
                    </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 text-white rtl:text-right">
                    <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-1 drop-shadow-md line-clamp-2">
                        {backendTrans.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm opacity-90 rtl:justify-end">
                        <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span className="font-semibold">{pitch.size} {t('card.players', 'Players')}</span>
                        </div>
                        {pitch.venue && (
                            <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span className="truncate max-w-[120px] sm:max-w-[180px]">
                                    {venueName || `${t('card.venueId', 'Venue ID')}: ${pitch.venue}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 border-b border-gray-100 divide-x divide-gray-100 rtl:divide-x-reverse">
                <div className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('card.bookings', 'Bookings')}</span>
                    <span className="text-base sm:text-lg font-bold text-gray-900">{pitch.num_of_bookings}</span>
                </div>
                <div className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('card.created', 'Created')}</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {new Date(pitch.created_at).toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                </div>
            </div>
            <div className="p-4 sm:p-6 text-center bg-gray-50/50">
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('card.pricePerHour', 'Price Per Hour')}</p>
                <div className="text-2xl sm:text-3xl font-extrabold text-primary-600 flex items-center justify-center gap-1">
                    <span className="text-base sm:text-lg text-gray-400 font-medium">{t(`card.priceAED`)}</span>
                    {Math.floor(Number(pitch.price_per_hour))}
                    <span className="text-xs text-gray-400 font-normal self-end mb-1">.00</span>
                </div>
            </div>
            <div className="p-4 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4 bg-white flex-grow">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{t('card.playersCapacity', 'Players Capacity')}</p>
                        <p className="text-sm font-medium truncate">
                            {pitch.size} vs {pitch.size} ({pitch.size * 2} {t('common.max', 'Max')})
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{t('card.venue', 'Venue')}</p>
                        <p className="text-sm font-medium text-primary-600 hover:underline cursor-pointer truncate">
                            {venueName || `Venue ID: ${pitch.venue}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{t('card.pitchSize', 'Pitch Size')}</p>
                        <p className="text-sm font-medium">{pitch.size}-a-side</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PitchInfoSection Component ---
const PitchInfoSection = ({ pitch, parentPitchName, t, currentLang }) => {
    const backendTrans = getTrans(pitch.translations, currentLang);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary-500" /> {t('info.title', 'Pitch Details')}
                </h3>
            </div>
            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {t('info.description', 'Description')}
                    </h4>
                    <p className="text-gray-600 text-sm leading-6 sm:leading-7 whitespace-pre-wrap">
                        {backendTrans.description || t('info.noDescription', 'No description provided for this pitch.')}
                    </p>
                </div>
                <div className="w-full h-px bg-gray-100"></div>
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        {t('info.specifications', 'Specifications')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                                <Users size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold text-gray-500">{t('info.sizeLabel', 'Pitch Size')}</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">{pitch.size}-a-side</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                                <LayoutGrid size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold text-gray-500">{t('info.typeLabel', 'Type')}</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {pitch.is_primary ? t('info.mainPitch', 'Main Pitch') : t('info.subPitch', 'Sub Pitch')}
                                </p>
                            </div>
                        </div>
                        {pitch.parent_pitch && (
                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 shrink-0">
                                    <Layers size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold text-gray-500">{t('info.parentPitch', 'Parent Pitch')}</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {parentPitchName || `ID: ${pitch.parent_pitch}`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full h-px bg-gray-100"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="shrink-0" />
                        <span>{t('card.created', 'Created')}: {new Date(pitch.created_at).toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="shrink-0" />
                        <span>{t('card.updated', 'Last Updated')}: {new Date(pitch.updated_at).toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const PitchDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('pitchDetails');
    const currentLang = i18n.language;

    // const { pitchId } = location.state || {};
    const { id } = useParams();

    const [pitch, setPitch] = useState(null);
    const [venueName, setVenueName] = useState(null);
    const [parentPitchName, setParentPitchName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Toggle for IsActive loading state
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    useEffect(() => {
        const fetchPitchDetails = async () => {
            if (!id) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const response = await pitchesService.getPitchById(id);
                if (response && response.data) {
                    const pitchData = response.data;
                    setPitch(pitchData);

                    if (pitchData.venue) {
                        try {
                            const venueRes = await venuesService.getVenueById(pitchData.venue);
                            const venueData = venueRes.data;
                            const vTrans = getTrans(venueData.translations, currentLang);
                            if (vTrans && vTrans.name) setVenueName(vTrans.name);
                        } catch (venueError) {
                            console.error("Failed to fetch venue details:", venueError);
                        }
                    }

                    if (pitchData.parent_pitch) {
                        try {
                            const parentRes = await pitchesService.getPitchById(pitchData.parent_pitch);
                            const parentData = parentRes.data;
                            const pTrans = getTrans(parentData.translations, currentLang);
                            if (pTrans && pTrans.name) setParentPitchName(pTrans.name);
                        } catch (parentError) {
                            console.error("Failed to fetch parent pitch details:", parentError);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch pitch details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPitchDetails();
    }, [id, refreshKey, currentLang]);

    const handleUpdateSuccess = () => {
        setIsEditing(false);
        setRefreshKey(prev => prev + 1);
    };

    // Handler for status toggling
    const handleToggleStatus = async () => {
        if (!pitch || isTogglingStatus) return;

        setIsTogglingStatus(true);
        try {
            const newStatus = !pitch.is_active;
            // Call the update service
            await pitchesService.updatePitch(pitch.id, { is_active: newStatus });

            // Update local state immediately for better UX
            setPitch(prev => ({
                ...prev,
                is_active: newStatus
            }));
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setIsTogglingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!id || !pitch) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <p className="text-gray-500 mb-4">{t('messages.notFound', 'Pitch not found')}</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                    {t('messages.back', 'Go Back')}
                </button>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className=" mx-auto py-6 ">
                    <VenuesForm
                        initialData={null}
                        pitchDetails={{ data: pitch }}
                        onCancel={() => setIsEditing(false)}
                        onSuccess={handleUpdateSuccess}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Header
                onBack={() => navigate(-1)}
                onUpdate={() => setIsEditing(true)}
                isEditing={isEditing}
                t={t}
                isActive={pitch.is_active}
                onToggleStatus={handleToggleStatus}
                isToggling={isTogglingStatus}
            />

            <div className=" mx-auto py-6 ">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column (Sticky on Large Screens) */}
                    <div className="col-span-1">
                        <div className="lg:sticky lg:top-24 h-fit space-y-6">
                            <PitchProfileCard pitch={pitch} venueName={venueName} t={t} currentLang={currentLang} />

                            {/* Info Section */}
                            <PitchInfoSection pitch={pitch} parentPitchName={parentPitchName} t={t} currentLang={currentLang} />
                        </div>
                    </div>

                    {/* Right Column (Scrollable Content) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Live Slot Calendar */}
                        <LiveSlotCalendar
                            pitchId={pitch.id}
                            t={t}
                            currentLang={currentLang}
                        />

                        {/* Pricing Editor */}
                        <PricingEditor pitchId={pitch.id} t={t} currentLang={currentLang} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PitchDetails;