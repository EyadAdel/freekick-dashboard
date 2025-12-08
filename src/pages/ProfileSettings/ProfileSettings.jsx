import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Settings, Bell, User, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import profileService from '../../services/profileService';
import MainInput from '../../components/MainInput';

import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import { useDispatch } from "react-redux";

const ProfileSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Profile'));
    }, [dispatch]);

    // React Hook Form setup for profile
    const {
        register: registerProfile,
        handleSubmit: handleSubmitProfile,
        formState: { errors: profileErrors, isDirty: isProfileDirty },
        reset: resetProfileForm,
        setValue: setProfileValue,
        getValues: getProfileValues
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

            // Set the profile image URL for display
            if (result.data.profile_image) {
                setProfileImageUrl(result.data.profile_image);
            }
        } else {
            toast.error(result.error || 'Failed to load profile');
        }
        setLoading(false);
    };
    const fetchPreferences = async () => {
        const result = await profileService.getPreferences();
        console.log(result,'prefrences')
        if (result.success) {
            // Map the API response to our state structure
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

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (e.g., max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        // Clean up previous preview URL if it exists
        if (profileImageUrl && profileImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(profileImageUrl);
        }

        // Create preview URL for display
        const previewUrl = URL.createObjectURL(file);
        setProfileImageUrl(previewUrl);

        // Store the file in state
        setSelectedImageFile(file);

        // Mark form as dirty
        setProfileValue('profile_image_dirty', true, { shouldDirty: true });

        toast.success('Image selected successfully');
    };
// Clean up on component unmount
    useEffect(() => {
        return () => {
            if (profileImageUrl) {
                URL.revokeObjectURL(profileImageUrl);
            }
        };
    }, [profileImageUrl]);
    const onProfileSubmit = async (data) => {
        setLoading(true);

        try {
            // Create FormData to send file as binary
            const formData = new FormData();

            // Append all form fields EXCEPT profile_image
            formData.append('contact_name', data.contact_name);
            formData.append('pitch_name', data.pitch_name);
            formData.append('email', data.email);
            formData.append('contact_phone', data.contact_phone);
            formData.append('state', data.state);
            formData.append('city', data.city);
            formData.append('pitch_address', data.pitch_address);
            formData.append('auto_accept_bookings', data.auto_accept_bookings);

            // Append the file ONLY if a new one was selected
            if (selectedImageFile instanceof File) {
                formData.append('profile_image', selectedImageFile);
            }

            const result = await profileService.updateProfile(formData);

            if (result.success) {
                toast.success(result.message || 'Profile updated successfully');

                // Reset the selected file state
                setSelectedImageFile(null);

                // Update the form with new data (without profile_image)
                resetProfileForm({
                    ...data,
                    profile_image_dirty: undefined
                });
            } else {
                toast.error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('An error occurred while updating profile');
        }

        setLoading(false);
    };
    const handlePreferencesSubmit = async () => {
        setLoading(true);
        const result = await profileService.updatePreferences(preferences);

        if (result.success) {
            toast.success(result.message || 'Preferences updated successfully');
        } else {
            toast.error(result.error || 'Failed to update preferences');
        }

        setLoading(false);
    };

    const onSecuritySubmit = async (data) => {
        if (data.new_password !== data.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const result = await profileService.changePassword(
                data.current_password,
                data.new_password
            );

            if (result.success) {
                toast.success(result.message || 'Password changed successfully');
                resetSecurityForm();
            } else {
                toast.error(result.error || 'Failed to change password');
            }
        } catch (error) {
            toast.error('An error occurred while changing password');
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
                toast.success(result.message || `Two-factor authentication ${newStatus ? 'enabled' : 'disabled'}`);
            } else {
                toast.error(result.error || 'Failed to update two-factor authentication');
            }
        } catch (error) {
            toast.error('An error occurred while updating two-factor authentication');
        }

        setLoading(false);
    };

    // Helper function to format preference labels
    const formatPreferenceLabel = (key) => {
        const labelMap = {
            app_updates: 'App Updates',
            app_news: 'App News',
            app_booking: 'App Booking Notifications',
            app_promotions: 'App Promotions',
            sms_booking: 'SMS Booking Notifications',
            sms_promotions: 'SMS Promotions',
            whatsapp_booking: 'WhatsApp Booking Notifications',
            whatsapp_promotions: 'WhatsApp Promotions',
            whatsapp_news: 'WhatsApp News'
        };
        return labelMap[key] || key.replace(/_/g, ' ');
    };

    // Group preferences by category
    const preferenceGroups = [
        {
            title: 'App Notifications',
            preferences: [
                'app_updates',
                'app_news',
                'app_booking',
                'app_promotions'
            ]
        },
        {
            title: 'SMS Notifications',
            preferences: [
                'sms_booking',
                'sms_promotions'
            ]
        },
        {
            title: 'WhatsApp Notifications',
            preferences: [
                'whatsapp_booking',
                'whatsapp_promotions',
                'whatsapp_news'
            ]
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
                                { id: 'profile', label: 'Edit Profile' },
                                { id: 'preferences', label: 'Preferences' },
                                { id: 'security', label: 'Security' }
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
                                        {/* Hidden field for image URL */}
                                        <input
                                            type="hidden"
                                            {...registerProfile('image')}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <MainInput
                                                label=" Name"
                                                name="contact_name"
                                                type="text"
                                                {...registerProfile('contact_name', { required: 'Contact name is required' })}
                                                error={profileErrors.contact_name?.message}
                                                placeholder="Omar"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="Pitch Name"
                                                name="pitch_name"
                                                type="text"
                                                {...registerProfile('pitch_name')}
                                                error={profileErrors.pitch_name?.message}
                                                placeholder="Enter pitch name"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="Email"
                                                name="email"
                                                type="email"
                                                {...registerProfile('email', {
                                                    required: 'Email is required',
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: 'Invalid email address'
                                                    }
                                                })}
                                                error={profileErrors.email?.message}
                                                placeholder="om23440@gmail.com"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="Phone Number"
                                                name="contact_phone"
                                                type="tel"
                                                {...registerProfile('contact_phone', {
                                                    required: 'Phone number is required',
                                                    pattern: {
                                                        value: /^[\+]?[1-9][\d]?[\-\s\.]?\(?\d{3}\)?[\-\s\.]?\d{3}[\-\s\.]?\d{4,6}$/,
                                                        message: 'Invalid phone number'
                                                    }
                                                })}
                                                error={profileErrors.contact_phone?.message}
                                                placeholder="+201064160586"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="State"
                                                name="state"
                                                type="text"
                                                {...registerProfile('state')}
                                                error={profileErrors.state?.message}
                                                placeholder="Enter state"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="City"
                                                name="city"
                                                type="text"
                                                {...registerProfile('city')}
                                                error={profileErrors.city?.message}
                                                placeholder="Dubai"
                                                disabled={loading}
                                            />

                                            <div className="md:col-span-2">
                                                <MainInput
                                                    label="Pitch Address"
                                                    name="pitch_address"
                                                    type="text"
                                                    {...registerProfile('pitch_address')}
                                                    error={profileErrors.pitch_address?.message}
                                                    placeholder="Enter pitch address"
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
                                                    Auto Accept Bookings
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
                                                Reset
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || !isProfileDirty}
                                                className="lg:px-8 px-2 py-3 text-sm lg:text-base bg-primary-500  text-white  rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed  hover:shadow-xl"
                                            >
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                </aside>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-8">
                                {/*<h3 className="lg:text-2xl text-lg font-semibold text-gray-900 mb-6">Notifications </h3>*/}

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
                                                        {/*<p className="text-sm text-gray-500 mt-1">*/}
                                                        {/*    {prefKey.includes('app') && 'Receive notifications in the app'}*/}
                                                        {/*    {prefKey.includes('sms') && 'Receive notifications via SMS'}*/}
                                                        {/*    {prefKey.includes('whatsapp') && 'Receive notifications via WhatsApp'}*/}
                                                        {/*</p>*/}
                                                    </div>
                                                    <button
                                                        onClick={() => setPreferences({ ...preferences, [prefKey]: !preferences[prefKey] })}
                                                        disabled={loading}
                                                        className={`relative lg:w-12 lg:h-6 w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${
                                                            preferences[prefKey] ? 'bg-primary-500' : 'bg-gray-300'
                                                        }`}
                                                        aria-label={`Toggle ${formatPreferenceLabel(prefKey)}`}
                                                    >
                                                        <span
                                                            className={`absolute top-0.5 left-0.5 w-4 h-4 lg:w-5 lg:h-5 bg-white rounded-full shadow-md transition-transform ${
                                                                preferences[prefKey] ? 'translate-x-5 lg:translate-x-6' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
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
                                        {loading ? 'Saving...' : 'Save Preferences'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="lg:text-lg text-sm font-semibold text-gray-900 mb-4">Two-factor Authentication</h3>
                                    <div className="flex items-center justify-between py-4">
                                        <span className="text-gray-700 text-xs lg:text-base">Enable or disable two factor authentication</span>
                                        <button
                                            onClick={handleTwoFactorToggle}
                                            disabled={loading}
                                            className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                                                twoFactorEnabled ? 'bg-primary-500' : 'bg-gray-300'
                                            }`}
                                        >
                    <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                    />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>

                                    <form onSubmit={handleSubmitSecurity(onSecuritySubmit)}>
                                        <div className="space-y-4">
                                            {/* Current Password */}
                                            <MainInput
                                                label="Current Password"
                                                name="current_password"
                                                type="password"
                                                {...registerSecurity('current_password', {
                                                    required: 'Current password is required',
                                                    minLength: {
                                                        value: 6,
                                                        message: 'Password must be at least 6 characters'
                                                    }
                                                })}
                                                error={securityErrors.current_password?.message}
                                                placeholder="Enter current password"
                                                disabled={loading}
                                            />

                                            {/* New Password */}
                                            <MainInput
                                                label="New Password"
                                                name="new_password"
                                                type="password"
                                                {...registerSecurity('new_password', {
                                                    required: 'New password is required',
                                                    minLength: {
                                                        value: 6,
                                                        message: 'Password must be at least 6 characters'
                                                    },
                                                    pattern: {
                                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                                        message: 'Password must contain uppercase, lowercase, and number'
                                                    }
                                                })}
                                                error={securityErrors.new_password?.message}
                                                placeholder="Enter new password"
                                                disabled={loading}
                                            />

                                            {/* Confirm Password */}
                                            <MainInput
                                                label="Confirm New Password"
                                                name="confirm_password"
                                                type="password"
                                                {...registerSecurity('confirm_password', {
                                                    required: 'Please confirm your password',
                                                    validate: (value) =>
                                                        value === watchSecurity('new_password') || 'Passwords do not match'
                                                })}
                                                error={securityErrors.confirm_password?.message}
                                                placeholder="Confirm new password"
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
                                                Clear
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="lg:px-8 px-2 py-3 text-sm lg:text-base bg-primary-500 hover:bg-secondary-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                            >
                                                {loading ? 'Saving...' : 'Change Password'}
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