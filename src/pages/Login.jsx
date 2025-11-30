// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import { MdPhoneInTalk } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import LogoText from "../components/common/LogoText.jsx";
import LogoLoader from "../components/common/LogoLoader.jsx";
import MuiPhoneInput from "../components/common/MuiPhoneInput.jsx";

const Login = () => {
    const [formData, setFormData] = useState({
        phone: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const { login, isAuthenticated, isLoading, error, resetError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    // Handle successful authentication
    useEffect(() => {
        if (isAuthenticated) {
            setIsSubmitting(true);
            toast.success('Login successful! Redirecting...', {
                position: "top-right",
                autoClose: 2000,
            });
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    // Handle authentication errors
    useEffect(() => {
        if (error && !isLoading) {
            setIsSubmitting(false);
            toast.error(error.message || 'Login failed. Please check your credentials.', {
                position: "top-right",
                autoClose: 4000,
            });
            resetError();
        }
    }, [error, isLoading, resetError]);

    const handlePhoneChange = (value, country) => {
        setFormData(prev => ({ ...prev, phone: value }));

        // Clear error when user starts typing
        if (phoneError) {
            setPhoneError('');
        }

        // Basic validation
        if (value && value.length < 8) {
            setPhoneError('Please enter a valid phone number');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        let isValid = true;

        // Phone validation
        if (!formData.phone) {
            setPhoneError('Phone number is required');
            isValid = false;
        } else if (formData.phone.length < 8) {
            setPhoneError('Please enter a valid phone number');
            isValid = false;
        }

        // Password validation
        if (!formData.password) {
            toast.warning('Please enter your password', {
                position: "top-right",
                autoClose: 3000,
            });
            isValid = false;
        }

        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        login(formData.phone, formData.password);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className="min-h-screen bg-gradient-to-t from-primary-300 via-primary-500 to-primary-600 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Logo Loader Overlay */}
            {isSubmitting && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white/10 backdrop-blur-md rounded-full p-5 shadow-2xl">
                        <LogoLoader />
                    </div>
                </div>
            )}

            {/* Animated Background Circles */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full animate-float-slow"></div>
                <div className="absolute top-1/4 -right-16 w-32 h-32 bg-white/15 rounded-full animate-float-slower"></div>
                <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-white/5 rounded-full animate-float-slowest"></div>
            </div>

            {/* Login Form Container */}
            <div className={`max-w-md w-full space-y-8 relative z-10 transition-all duration-300 ${
                isSubmitting ? 'blur-sm scale-95 opacity-80' : 'blur-0 scale-100 opacity-100'
            }`}>
                {/* Header with Logo */}
                <div className="text-center">
                    <div className="flex items-center justify-center mb-8">
                        <LogoText/>
                    </div>
                </div>

                {/* Login Form Card */}
                <div className="bg-white bg-opacity-50 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
                    <h1 className="text-2xl font-bold text-slate-700 mb-8 text-center">
                        Welcome to Admin Panel
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Phone Number Field with MUI Phone Input */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                {/*<div className="absolute inset-y-0 left-0 -pl-4  flex items-center pointer-events-none z-10">*/}
                                {/*    <MdPhoneInTalk className="h-5 w-5 text-slate-400" />*/}
                                {/*</div>*/}
                                <MuiPhoneInput
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    error={!!phoneError}
                                    helperText={phoneError}
                                    required
                                    disabled={isSubmitting}
                                    size="medium"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <TbLockPassword className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    placeholder="Your password"
                                    className="block w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                    onClick={togglePasswordVisibility}
                                    disabled={isSubmitting}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-secondary-600 text-lg text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Logging in...' : 'Login'}
                        </button>

                        {/* Links Below Button */}
                        <div className="flex items-center justify-between text-sm pt-2">
                            <span className="text-slate-600">Don't have an account?</span>
                            <button
                                type="button"
                                className="text-primary-600 hover:text-primary-700 font-medium"
                                disabled={isSubmitting}
                                onClick={() => navigate('/forgot-password')}
                            >
                                Reset Password
                            </button>
                        </div>
                    </form>

                    {/* Footer Info Box */}
                    <div className="mt-6 bg-white rounded-2xl p-5 flex items-center justify-between">
                        <div className="text-xs text-slate-600 leading-relaxed">
                            <p>This platform is for</p>
                            <p>administrators only. If you're</p>
                            <p>looking for the user</p>
                            <p>application, please visit our</p>
                            <p className="text-primary-600 font-medium">User App.</p>
                        </div>
                        <div className="flex -space-x-1">
                            <div className="w-5 h-5 rounded-full bg-primary-300 border-2 border-white animate-avatar-float-slow"></div>
                            <div className="w-5 h-5 rounded-full bg-primary-700 border-2 border-white animate-avatar-float-slowest"></div>
                            <div className="w-5 h-5 rounded-full bg-secondary-600 border-2 border-white animate-avatar-float-slower"></div>
                        </div>
                    </div>
                </div>

                {/* Bottom Contact Link */}
                <div className="text-center">
                    <p className="text-white text-sm">
                        Can't access your account?{' '}
                        <button
                            className="font-semibold underline hover:text-primary-100 transition-colors"
                            disabled={isSubmitting}
                        >
                            Contact us
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;