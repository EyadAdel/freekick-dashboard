// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { toast } from 'react-toastify';
import { MdPhoneInTalk } from "react-icons/md";
import { ArrowLeft } from 'lucide-react';
import LogoText from "../components/common/LogoText.jsx";
import LogoLoader from "../components/common/LogoLoader.jsx";

const ForgotPassword = () => {
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const formatPhoneNumber = (value) => {
        const cleaned = value.replace(/[^\d+]/g, '');
        const hasPlus = cleaned.startsWith('+');
        const digits = hasPlus ? cleaned.slice(1) : cleaned;

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

    const cleanPhoneNumber = (phone) => {
        let cleanPhone = phone.replace(/[^\d+]/g, '');
        if (!cleanPhone.startsWith('+')) {
            cleanPhone = `+${cleanPhone}`;
        }
        return cleanPhone;
    };

    const handleInputChange = (value) => {
        setPhone(formatPhoneNumber(value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!phone) {
            toast.warning('Please enter your phone number', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        const cleanPhone = cleanPhoneNumber(phone);

        setIsSubmitting(true);

        try {
            await authService.checkOtpResetPassword(cleanPhone);

            toast.success('OTP sent successfully! Check your messages.', {
                position: "top-right",
                autoClose: 3000,
            });

            navigate('/verify-otp', {
                state: { phone: cleanPhone },
                replace: true
            });
        } catch (error) {
            toast.error(error.message || 'Failed to send OTP. Please try again.', {
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
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center text-slate-600 hover:text-slate-800 mb-6 transition-colors"
                        disabled={isSubmitting}
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">Back to Login</span>
                    </button>

                    <h1 className="text-2xl font-bold text-slate-700 mb-3 text-center">
                        Forgot Password?
                    </h1>

                    <p className="text-sm text-slate-600 text-center mb-8">
                        Don't worry! Enter your phone number and we'll send you an OTP to reset your password.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MdPhoneInTalk className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={phone}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    placeholder="Your phone number"
                                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-secondary-600 text-lg text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-white rounded-2xl">
                        <p className="text-xs text-slate-600 text-center leading-relaxed">
                            You'll receive a 6-digit verification code on your registered mobile number.
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-white text-sm">
                        Remember your password?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="font-semibold underline hover:text-primary-100 transition-colors"
                            disabled={isSubmitting}
                        >
                            Back to Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;