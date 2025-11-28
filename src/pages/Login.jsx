// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Eye, EyeOff } from 'lucide-react';
import { MdPhoneInTalk } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import LogoText from "../components/common/LogoText.jsx";
import LogoLoader from "../components/common/LogoLoader.jsx";

const Login = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, isAuthenticated, isLoading, error } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the intended destination or default to dashboard
    const from = location.state?.from?.pathname || '/';

    useEffect(() => {
        if (isAuthenticated) {
            // Keep showing loader during navigation
            setIsSubmitting(true);
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    // Reset submitting state if there's an error
    useEffect(() => {
        if (error && !isLoading) {
            setIsSubmitting(false);
        }
    }, [error, isLoading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        login(phone, password);
    };

    const formatPhoneNumber = (value) => {
        // Remove all non-digit and non-plus characters
        const cleaned = value.replace(/[^\d+]/g, '');

        // If it starts with +, preserve it
        const hasPlus = cleaned.startsWith('+');
        const digits = hasPlus ? cleaned.slice(1) : cleaned;

        // Format based on length
        if (digits.length <= 3) {
            return hasPlus ? `+${digits}` : digits;
        } else if (digits.length <= 5) {
            return hasPlus ? `+${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
        } else if (digits.length <= 8) {
            return hasPlus ? `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}` : digits;
        } else {
            return hasPlus ? `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}` : digits;
        }
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhone(formatted);
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

            {/* Login Form Container - Apply blur when submitting */}
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
                        {/* Phone Number Field */}
                        <div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MdPhoneInTalk className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="text"
                                    required
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    placeholder="Your phone number"
                                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <TbLockPassword className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Your password"
                                    className="block w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isSubmitting}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error.message || 'Login failed. Please check your credentials.'}
                            </div>
                        )}

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