// src/pages/ChangePassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import LogoText from "../components/common/LogoText.jsx";
import LogoLoader from "../components/common/LogoLoader.jsx";

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        label: '',
        color: ''
    });

    const navigate = useNavigate();
    const location = useLocation();

    const phone = location.state?.phone;
    const otp = location.state?.otp;

    useEffect(() => {
        if (!phone || !otp) {
            toast.error('Invalid access. Please start from the beginning.');
            navigate('/login');
        }
    }, [phone, otp, navigate]);

    useEffect(() => {
        const password = formData.newPassword;
        let score = 0;

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        let label = '';
        let color = '';

        if (score === 0) {
            label = '';
            color = '';
        } else if (score <= 2) {
            label = 'Weak';
            color = 'bg-red-500';
        } else if (score <= 3) {
            label = 'Fair';
            color = 'bg-yellow-500';
        } else if (score <= 4) {
            label = 'Good';
            color = 'bg-blue-500';
        } else {
            label = 'Strong';
            color = 'bg-green-500';
        }

        setPasswordStrength({ score, label, color });
    }, [formData.newPassword]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validatePassword = () => {
        const { newPassword, confirmPassword } = formData;

        if (!newPassword || !confirmPassword) {
            toast.warning('Please fill in all fields', {
                position: "top-right",
                autoClose: 3000,
            });
            return false;
        }

        if (newPassword.length < 8) {
            toast.warning('Password must be at least 8 characters long', {
                position: "top-right",
                autoClose: 3000,
            });
            return false;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match', {
                position: "top-right",
                autoClose: 3000,
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validatePassword()) return;

        setIsSubmitting(true);

        try {
            await authService.resetPasswordConfirm(phone, otp, formData.newPassword);

            toast.success('Password changed successfully! Redirecting to login...', {
                position: "top-right",
                autoClose: 2000,
            });

            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 2000);
        } catch (error) {
            toast.error(error.message || 'Failed to change password. Please try again.', {
                position: "top-right",
                autoClose: 4000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-t from-primary-300 via-primary-500 to-primary-600 flex items-center justify-center p-4 relative overflow-hidden">
            {isSubmitting && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white/10 backdrop-blur-md rounded-full p-5 shadow-2xl">
                        <LogoLoader />
                    </div>
                </div>
            )}

            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full animate-float-slow"></div>
                <div className="absolute top-1/4 -right-16 w-32 h-32 bg-white/15 rounded-full animate-float-slower"></div>
                <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-white/5 rounded-full animate-float-slowest"></div>
            </div>

            <div className={`max-w-md w-full space-y-8 relative z-10 transition-all duration-300 ${
                isSubmitting ? 'blur-sm scale-95 opacity-80' : 'blur-0 scale-100 opacity-100'
            }`}>
                <div className="text-center">
                    <div className="flex items-center justify-center mb-8">
                        <LogoText/>
                    </div>
                </div>

                <div className="bg-white bg-opacity-50 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-primary-100 p-4 rounded-full">
                            <Lock className="h-8 w-8 text-primary-600" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-700 mb-3 text-center">
                        Change Password
                    </h1>

                    <p className="text-sm text-slate-600 text-center mb-8">
                        Enter your new password below
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    required
                                    value={formData.newPassword}
                                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                    placeholder="Enter your new password"
                                    className="block w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    disabled={isSubmitting}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    )}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.newPassword && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all ${
                                                    i < passwordStrength.score
                                                        ? passwordStrength.color
                                                        : 'bg-slate-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        Password strength: <span className="font-medium">{passwordStrength.label}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Re-enter New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    placeholder="Re-enter your new password"
                                    className="block w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={isSubmitting}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    )}
                                </button>
                            </div>

                            {/* Password Match Indicator */}
                            {formData.confirmPassword && (
                                <div className="mt-2 flex items-center gap-2">
                                    {formData.newPassword === formData.confirmPassword ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <p className="text-xs text-green-600 font-medium">Passwords match</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-red-600">Passwords do not match</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Save Password Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-secondary-600 text-lg text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Password'}
                        </button>
                    </form>

                    {/* Password Requirements */}
                    {/*<div className="mt-6 p-4 bg-white rounded-2xl">*/}
                    {/*    <p className="text-xs font-semibold text-slate-700 mb-2">Password must contain:</p>*/}
                    {/*    <ul className="text-xs text-slate-600 space-y-1">*/}
                    {/*        <li>• At least 8 characters</li>*/}
                    {/*        <li>• Uppercase and lowercase letters</li>*/}
                    {/*        <li>• At least one number</li>*/}
                    {/*        <li>• Special characters (recommended)</li>*/}
                    {/*    </ul>*/}
                    {/*</div>*/}
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;