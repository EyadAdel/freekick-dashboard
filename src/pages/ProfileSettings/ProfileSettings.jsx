import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Settings, Bell, User, Phone } from 'lucide-react';
import { toast, } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import profileService from '../../services/profileService';
import MainInput from '../../components/MainInput'; // Adjust path as needed
import { uploadService } from '../../services/upload/uploadService'; // Import upload service
import { generateUniqueFileName } from '../../utils/fileUtils';
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";
import {useDispatch} from "react-redux"; // Import the utility
const ProfileSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState('https://www.bigfootdigital.co.uk/wp-content/uploads/2020/07/image-optimisation-scaled.jpg');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
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
            name: '',
            user_name: '',
            image:'https://www.bigfootdigital.co.uk/wp-content/uploads/2020/07/image-optimisation-scaled.jpg',
            email: '',
            phone: '',
            date_of_birth: '',
            present_address: '',
            permanent_address: '',
            city: '',
            postal_code: '',
            country: ''
        }
    });

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

    // Preferences data
    const [preferences, setPreferences] = useState({
        new_booking_activity: true,
        pitch_owner_requests: false,
        payment_activity: true
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
                name: result.data.name || '',
                user_name: result.data.user_name || '',
                email: result.data.email || '',
                phone: result.data.phone || '', // Added phone field
                date_of_birth: result.data.date_of_birth || '',
                present_address: result.data.present_address || '',
                permanent_address: result.data.permanent_address || '',
                city: result.data.city || '',
                postal_code: result.data.postal_code || '',
                country: result.data.country || '',
                image: result.data.image || 'https://www.bigfootdigital.co.uk/wp-content/uploads/2020/07/image-optimisation-scaled.jpg',
            };

            // Reset form with fetched data
            resetProfileForm(profileData);
        } else {
            toast.error(result.error || 'Failed to load profile');
        }

        setLoading(false);
    };

    const fetchPreferences = async () => {
        const result = await profileService.getPreferences();

        if (result.success) {
            setPreferences({
                new_booking_activity: result.data.new_booking_activity ?? true,
                pitch_owner_requests: result.data.pitch_owner_requests ?? false,
                payment_activity: result.data.payment_activity ?? true
            });
        }
    };

    const fetchTwoFactorStatus = async () => {
        const result = await profileService.getTwoFactorStatus();

        if (result.success) {
            setTwoFactorEnabled(result.data.enabled ?? true);
        }
    };

    const handleProfilePictureUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file (JPEG, PNG, etc.)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setIsUploadingImage(true);

        try {
            // Generate unique filename
            const uniqueFileName = generateUniqueFileName(file.name);

            // Upload the image using the upload service
            const uploadResult = await uploadService.processFullUpload(file, uniqueFileName);

            if (uploadResult && uploadResult.url) {
                // Update the form field with the new image URL
                setProfileValue('image', uploadResult.url, { shouldDirty: true });

                // Update the displayed image immediately
                setProfileImageUrl(uploadResult.url+pub-f8c5de66602c4f6f91311c6fd40e1794.r2.dev);

                toast.success('Profile picture uploaded successfully!');
            } else {
                toast.error('Failed to get image URL from upload');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload profile picture');
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Modified onProfileSubmit to include the image URL
    const onProfileSubmit = async (data) => {
        setLoading(true);

        try {
            // The image URL is already included in the form data
            const result = await profileService.updateProfile(data);

            if (result.success) {
                toast.success(result.message || 'Profile updated successfully');
                resetProfileForm(data); // Reset form state
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
                                                isUploadingImage ? 'bg-gray-400' : 'bg-primary-500 hover:bg-primary-600'
                                            }`}
                                        >
                                            {isUploadingImage ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Camera className="w-5 h-5 text-white" />
                                            )}
                                            <input
                                                id="profile-picture-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleProfilePictureUpload}
                                                className="hidden"
                                                disabled={isUploadingImage || loading}
                                            />
                                        </label>
                                    </div>
                                    {isUploadingImage && (
                                        <p className="text-sm text-gray-500">Uploading image...</p>
                                    )}
                                </div>

                                <aside className={'w-full'}>
                                    <form onSubmit={handleSubmitProfile(onProfileSubmit)}>
                                        {/* Hidden field for image URL */}
                                        <input
                                            type="hidden"
                                            {...registerProfile('image')}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Your form fields remain the same */}
                                            <MainInput
                                                label="Your Name"
                                                name="name"
                                                type="text"
                                                {...registerProfile('name', { required: 'Name is required' })}
                                                error={profileErrors.name?.message}
                                                placeholder="Charlene Reed"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="User Name"
                                                name="user_name"
                                                type="text"
                                                {...registerProfile('user_name')}
                                                error={profileErrors.user_name?.message}
                                                placeholder="charlene123"
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
                                                placeholder="charlenereed@gmail.com"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="Phone Number"
                                                name="phone"
                                                type="tel"
                                                {...registerProfile('phone', {
                                                    pattern: {
                                                        value: /^[\+]?[1-9][\d]?[\-\s\.]?\(?\d{3}\)?[\-\s\.]?\d{3}[\-\s\.]?\d{4,6}$/,
                                                        message: 'Invalid phone number'
                                                    }
                                                })}
                                                error={profileErrors.phone?.message}
                                                placeholder="+1 (555) 123-4567"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="Date of Birth"
                                                name="date_of_birth"
                                                type="date"
                                                {...registerProfile('date_of_birth')}
                                                error={profileErrors.date_of_birth?.message}
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="Present Address"
                                                name="present_address"
                                                type="text"
                                                {...registerProfile('present_address')}
                                                error={profileErrors.present_address?.message}
                                                placeholder="San Jose, California, USA"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="Permanent Address"
                                                name="permanent_address"
                                                type="text"
                                                {...registerProfile('permanent_address')}
                                                error={profileErrors.permanent_address?.message}
                                                placeholder="San Jose, California, USA"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="City"
                                                name="city"
                                                type="text"
                                                {...registerProfile('city')}
                                                error={profileErrors.city?.message}
                                                placeholder="San Jose"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="Postal Code"
                                                name="postal_code"
                                                type="text"
                                                {...registerProfile('postal_code')}
                                                error={profileErrors.postal_code?.message}
                                                placeholder="45962"
                                                disabled={loading}
                                            />

                                            <MainInput
                                                label="Country"
                                                name="country"
                                                type="text"
                                                {...registerProfile('country')}
                                                error={profileErrors.country?.message}
                                                placeholder="USA"
                                                disabled={loading}
                                            />
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

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <div>
                                <div className="space-y-6">
                                    <h3 className="lg:text-lg font-semibold text-gray-900 mb-4">Notification</h3>

                                    {[
                                        { key: 'new_booking_activity', label: 'New Booking activity' },
                                        { key: 'pitch_owner_requests', label: 'Pitch Owner requests' },
                                        { key: 'payment_activity', label: 'Payment Activity' }
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-100">
                                            <span className="text-gray-700 text-sm lg:text-base">{item.label}</span>
                                            <button
                                                onClick={() => setPreferences({ ...preferences, [item.key]: !preferences[item.key] })}
                                                disabled={loading}
                                                className={`relative lg:w-12 lg:h-6 w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${
                                                    preferences[item.key] ? 'bg-primary-500' : 'bg-gray-300'
                                                }`}
                                            >
                                                <span
                                                    className={`absolute top-0.5 left-0.5 w-4 h-4 lg:w-5 lg:h-5 bg-white rounded-full shadow-md transition-transform ${
                                                        preferences[item.key] ? 'translate-x-5 lg:translate-x-6' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handlePreferencesSubmit}
                                        disabled={loading}
                                        className="px-8 py-3 text-sm lg:text-base bg-primary-500 hover:bg-secondary-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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