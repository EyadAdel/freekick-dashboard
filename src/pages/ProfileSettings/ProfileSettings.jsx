import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, User } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import profileService from '../../services/profileService';
import MainInput from '../../components/MainInput';

import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import { useDispatch } from "react-redux";
// Import translation hook
import { useTranslation } from 'react-i18next';
// Import the image utility
import { getImageUrl } from '../../utils/imageUtils.js';

const ProfileSettings = () => {
    const { t } = useTranslation('profileSettings');
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('pageTitle')));
    }, [dispatch, t]);

    // React Hook Form setup for profile
    const {
        register: registerProfile,
        handleSubmit: handleSubmitProfile,
        formState: { errors: profileErrors, isDirty: isProfileDirty },
        reset: resetProfileForm,
        setValue: setProfileValue,
    } = useForm({
        defaultValues: {
            contact_name: '',
            pitch_name: '',
            email: '',
            contact_phone: '',
            state: '',
            city: '',
            pitch_address: '',
            auto_accept_bookings: true
        }
    });
    const [selectedImageFile, setSelectedImageFile] = useState(null);

    // React Hook Form setup for security
    const {
        register: registerSecurity,
        handleSubmit: handleSubmitSecurity,
        formState: { errors: securityErrors },
        reset: resetSecurityForm,
        watch: watchSecurity
    } = useForm({
        defaultValues: {
            current_password: '',
            new_password: '',
            confirm_password: ''
        }
    });

    const newPassword = watchSecurity('new_password');

    // Updated preferences data structure
    const [preferences, setPreferences] = useState({
        app_updates: true,
        app_news: true,
        app_booking: true,
        app_promotions: true,
        sms_booking: true,
        sms_promotions: true,
        whatsapp_booking: true,
        whatsapp_promotions: true,
        whatsapp_news: true
    });

    // Security data
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

    // Fetch user profile on mount
    useEffect(() => {
        fetchProfile();
        fetchPreferences();
        fetchTwoFactorStatus();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        const result = await profileService.getProfile();

        if (result.success) {
            const profileData = {
                contact_name: result.data.contact_name || '',
                pitch_name: result.data.pitch_name || '',
                email: result.data.email || '',
                contact_phone: result.data.contact_phone || '',
                state: result.data.state || '',
                city: result.data.city || '',
                pitch_address: result.data.pitch_address || '',
                auto_accept_bookings: result.data.auto_accept_bookings ?? true
            };

            resetProfileForm(profileData);
            setSelectedImageFile(null); // Reset selected file

            // Set the profile image URL for display using the utility
            if (result.data.profile_image) {
                setProfileImageUrl(getImageUrl(result.data.profile_image));
            }
        } else {
            toast.error(result.error || t('messages.loadProfileError'));
        }
        setLoading(false);
    };

    const fetchPreferences = async () => {
        const result = await profileService.getPreferences();
        if (result.success) {
            setPreferences({
                app_updates: result.data.app_updates ?? true,
                app_news: result.data.app_news ?? true,
                app_booking: result.data.app_booking ?? true,
                app_promotions: result.data.app_promotions ?? true,
                sms_booking: result.data.sms_booking ?? true,
                sms_promotions: result.data.sms_promotions ?? true,
                whatsapp_booking: result.data.whatsapp_booking ?? true,
                whatsapp_promotions: result.data.whatsapp_promotions ?? true,
                whatsapp_news: result.data.whatsapp_news ?? true
            });
        }
    };

    const fetchTwoFactorStatus = async () => {
        const result = await profileService.getTwoFactorStatus();

        if (result.success) {
            setTwoFactorEnabled(result.data.enabled ?? true);
        }
    };

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error(t('validation.validImage'));
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error(t('validation.imageSize'));
            return;
        }

        if (profileImageUrl && profileImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(profileImageUrl);
        }

        const previewUrl = URL.createObjectURL(file);
        setProfileImageUrl(previewUrl);

        setSelectedImageFile(file);
        setProfileValue('profile_image_dirty', true, { shouldDirty: true });

        toast.success(t('messages.imageSelected'));
    };

    useEffect(() => {
        return () => {
            if (profileImageUrl && profileImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(profileImageUrl);
            }
        };
    }, [profileImageUrl]);

    const onProfileSubmit = async (data) => {
        setLoading(true);

        try {
            const formData = new FormData();

            formData.append('contact_name', data.contact_name);
            formData.append('pitch_name', data.pitch_name);
            formData.append('email', data.email);
            formData.append('contact_phone', data.contact_phone);
            formData.append('state', data.state);
            formData.append('city', data.city);
            formData.append('pitch_address', data.pitch_address);
            formData.append('auto_accept_bookings', data.auto_accept_bookings);

            if (selectedImageFile instanceof File) {
                formData.append('profile_image', selectedImageFile);
            }

            const result = await profileService.updateProfile(formData);

            if (result.success) {
                toast.success(result.message || t('messages.profileUpdated'));
                setSelectedImageFile(null);
                resetProfileForm({
                    ...data,
                    profile_image_dirty: undefined
                });
            } else {
                toast.error(result.error || t('messages.profileUpdateError'));
            }
        } catch (error) {
            toast.error(t('messages.errorOccurred'));
        }

        setLoading(false);
    };

    const handlePreferencesSubmit = async () => {
        setLoading(true);
        const result = await profileService.updatePreferences(preferences);

        if (result.success) {
            toast.success(result.message || t('messages.preferencesUpdated'));
        } else {
            toast.error(result.error || t('messages.preferencesUpdateError'));
        }

        setLoading(false);
    };

    const onSecuritySubmit = async (data) => {
        if (data.new_password !== data.confirm_password) {
            toast.error(t('validation.passwordsDoNotMatch'));
            return;
        }

        setLoading(true);

        try {
            const result = await profileService.changePassword(
                data.current_password,
                data.new_password
            );

            if (result.success) {
                toast.success(result.message || t('messages.passwordChanged'));
                resetSecurityForm();
            } else {
                toast.error(result.error || t('messages.passwordChangeError'));
            }
        } catch (error) {
            toast.error(t('messages.errorOccurred'));
        }

        setLoading(false);
    };

    const handleTwoFactorToggle = async () => {
        const newStatus = !twoFactorEnabled;
        setLoading(true);

        try {
            const result = await profileService.toggleTwoFactor(newStatus);

            if (result.success) {
                setTwoFactorEnabled(newStatus);
                const statusText = newStatus ? t('common.enabled') : t('common.disabled');
                toast.success(result.message || t('messages.twoFactorUpdated', { status: statusText }));
            } else {
                toast.error(result.error || t('messages.twoFactorError'));
            }
        } catch (error) {
            toast.error(t('messages.errorOccurred'));
        }

        setLoading(false);
    };

    const formatPreferenceLabel = (key) => {
        return t(`preferences.labels.${key}`);
    };

    const preferenceGroups = [
        {
            title: t('preferences.groups.app'),
            preferences: ['app_updates', 'app_news', 'app_booking', 'app_promotions']
        },
        {
            title: t('preferences.groups.sms'),
            preferences: ['sms_booking', 'sms_promotions']
        },
        {
            title: t('preferences.groups.whatsapp'),
            preferences: ['whatsapp_booking', 'whatsapp_promotions', 'whatsapp_news']
        }
    ];

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex px-6">
                            {[
                                { id: 'profile', label: t('tabs.editProfile') },
                                { id: 'preferences', label: t('tabs.preferences') },
                                { id: 'security', label: t('tabs.security') }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`lg:px-6 px-4 py-4 font-medium xl:text-lg text-sm transition-colors relative ${
                                        activeTab === tab.id
                                            ? 'text-primary-500'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-8">
                        {/* Edit Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className={'flex flex-col lg:flex-row items-start gap-8 w-full'}>
                                <div className="flex w-full lg:w-fit items-center lg:justify-start justify-center space-x-6">
                                    <div className="relative group">
                                        <div className="w-32 h-32 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center animate-avatar-float-slow overflow-hidden">
                                            {profileImageUrl ? (
                                                <img
                                                    className={'w-full h-full object-cover'}
                                                    src={profileImageUrl}
                                                    alt="Profile"
                                                />
                                            ) : (
                                                <User className="w-16 h-16 text-white" />
                                            )}
                                        </div>
                                        <label
                                            htmlFor="profile-picture-upload"
                                            className={`absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer ${
                                                loading ? 'bg-gray-400' : 'bg-primary-500 hover:bg-primary-600'
                                            }`}
                                        >
                                            <Camera className="w-5 h-5 text-white" />
                                            <input
                                                id="profile-picture-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={loading}
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <aside className={'w-full'}>
                                    <form onSubmit={handleSubmitProfile(onProfileSubmit)}>
                                        <input type="hidden" {...registerProfile('image')} />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <MainInput
                                                label={t('profile.contactName')}
                                                name="contact_name"
                                                type="text"
                                                {...registerProfile('contact_name', { required: t('validation.contactNameRequired') })}
                                                error={profileErrors.contact_name?.message}
                                                placeholder={t('profile.placeholders.contactName')}
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label={t('profile.pitchName')}
                                                name="pitch_name"
                                                type="text"
                                                {...registerProfile('pitch_name')}
                                                error={profileErrors.pitch_name?.message}
                                                placeholder={t('profile.placeholders.pitchName')}
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label={t('profile.email')}
                                                name="email"
                                                type="email"
                                                {...registerProfile('email', {
                                                    required: t('validation.emailRequired'),
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: t('validation.emailInvalid')
                                                    }
                                                })}
                                                error={profileErrors.email?.message}
                                                placeholder="om23440@gmail.com"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label={t('profile.phoneNumber')}
                                                name="contact_phone"
                                                type="tel"
                                                {...registerProfile('contact_phone', {
                                                    required: t('validation.phoneRequired'),
                                                    pattern: {
                                                        value: /^[\+]?[1-9][\d]?[\-\s\.]?\(?\d{3}\)?[\-\s\.]?\d{3}[\-\s\.]?\d{4,6}$/,
                                                        message: t('validation.phoneInvalid')
                                                    }
                                                })}
                                                error={profileErrors.contact_phone?.message}
                                                placeholder="+201064160586"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label={t('profile.state')}
                                                name="state"
                                                type="text"
                                                {...registerProfile('state')}
                                                error={profileErrors.state?.message}
                                                placeholder={t('profile.placeholders.state')}
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label={t('profile.city')}
                                                name="city"
                                                type="text"
                                                {...registerProfile('city')}
                                                error={profileErrors.city?.message}
                                                placeholder={t('profile.placeholders.city')}
                                                disabled={loading}
                                            />

                                            <div className="md:col-span-2">
                                                <MainInput
                                                    label={t('profile.pitchAddress')}
                                                    name="pitch_address"
                                                    type="text"
                                                    {...registerProfile('pitch_address')}
                                                    error={profileErrors.pitch_address?.message}
                                                    placeholder={t('profile.placeholders.pitchAddress')}
                                                    disabled={loading}
                                                />
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="auto_accept_bookings"
                                                    {...registerProfile('auto_accept_bookings')}
                                                    className="w-4 h-4 text-primary-500 rounded"
                                                    disabled={loading}
                                                />
                                                <label htmlFor="auto_accept_bookings" className="text-gray-700">
                                                    {t('profile.autoAcceptBookings')}
                                                </label>
                                            </div>
                                        </div>
                                        <div className="mt-8 flex justify-end gap-4">
                                            <button
                                                type="button"
                                                onClick={() => resetProfileForm()}
                                                disabled={!isProfileDirty || loading}
                                                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                {t('profile.reset')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || !isProfileDirty}
                                                className="lg:px-8 px-2 py-3 text-sm lg:text-base bg-primary-500  text-white  rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed  hover:shadow-xl"
                                            >
                                                {loading ? t('profile.saving') : t('profile.saveChanges')}
                                            </button>
                                        </div>
                                    </form>
                                </aside>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-8">
                                {preferenceGroups.map((group) => (
                                    <div key={group.title} className="space-y-4 mb-8">
                                        <h4 className="lg:text-lg font-medium text-gray-800 border-b pb-2">
                                            {group.title}
                                        </h4>

                                        <div className="space-y-4">
                                            {group.preferences.map((prefKey) => (
                                                <div key={prefKey} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                    <div>
                                                        <span className="text-gray-800 text-sm lg:font-medium">
                                                            {formatPreferenceLabel(prefKey)}
                                                        </span>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={preferences[prefKey]}
                                                            onChange={() => setPreferences({ ...preferences, [prefKey]: !preferences[prefKey] })}
                                                            disabled={loading}
                                                        />
                                                        <div className={`w-10 h-5 lg:w-12 lg:h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary-500 peer-disabled:opacity-50 transition-colors`}></div>
                                                        <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 lg:w-5 lg:h-5 rounded-full shadow-md transition-transform peer-checked:translate-x-5 lg:peer-checked:translate-x-6`}></span>
                                                        <span className="sr-only">Toggle {formatPreferenceLabel(prefKey)}</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handlePreferencesSubmit}
                                        disabled={loading}
                                        className="px-8 py-3 text-sm lg:text-base bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                    >
                                        {loading ? t('profile.saving') : t('preferences.savePreferences')}
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="lg:text-lg text-sm font-semibold text-gray-900 mb-4">{t('security.twoFactorHeading')}</h3>
                                    <div className="flex items-center justify-between py-4">
                                        <span className="text-gray-700 text-xs lg:text-base">{t('security.twoFactorDesc')}</span>
                                        <button
                                            onClick={handleTwoFactorToggle}
                                            disabled={loading}
                                            className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${twoFactorEnabled ? 'bg-primary-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('security.changePasswordHeading')}</h3>
                                    <form onSubmit={handleSubmitSecurity(onSecuritySubmit)}>
                                        <div className="space-y-4">
                                            <MainInput
                                                label={t('security.currentPassword')}
                                                name="current_password"
                                                type="password"
                                                {...registerSecurity('current_password', {
                                                    required: t('validation.currentPasswordRequired'),
                                                    minLength: { value: 6, message: t('validation.passwordMinLength') }
                                                })}
                                                error={securityErrors.current_password?.message}
                                                placeholder={t('security.placeholders.currentPassword')}
                                                disabled={loading}
                                            />
                                            <MainInput
                                                label={t('security.newPassword')}
                                                name="new_password"
                                                type="password"
                                                {...registerSecurity('new_password', {
                                                    required: t('validation.newPasswordRequired'),
                                                    minLength: { value: 6, message: t('validation.passwordMinLength') },
                                                    pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: t('validation.passwordComplexity') }
                                                })}
                                                error={securityErrors.new_password?.message}
                                                placeholder={t('security.placeholders.newPassword')}
                                                disabled={loading}
                                            />
                                            <MainInput
                                                label={t('security.confirmPassword')}
                                                name="confirm_password"
                                                type="password"
                                                {...registerSecurity('confirm_password', {
                                                    required: t('validation.confirmPasswordRequired'),
                                                    validate: (value) => value === watchSecurity('new_password') || t('validation.passwordsDoNotMatch')
                                                })}
                                                error={securityErrors.confirm_password?.message}
                                                placeholder={t('security.placeholders.confirmPassword')}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="mt-8 flex justify-end gap-4">
                                            <button
                                                type="button"
                                                onClick={() => resetSecurityForm()}
                                                disabled={loading}
                                                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                {t('security.clear')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="lg:px-8 px-2 py-3 text-sm lg:text-base bg-primary-500 hover:bg-secondary-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                            >
                                                {loading ? t('profile.saving') : t('security.changePasswordBtn')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;