// src/pages/OTPVerification.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import LogoText from "../components/common/LogoText.jsx";
import LogoLoader from "../components/common/LogoLoader.jsx";

const OTPVerification = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();

    const phone = location.state?.phone;

    useEffect(() => {
        if (!phone) {
            toast.error('Please provide a phone number first');
            navigate('/login');
        }
    }, [phone, navigate]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value !== '' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        const newOtp = [...otp];

        for (let i = 0; i < pastedData.length; i++) {
            if (!isNaN(pastedData[i])) {
                newOtp[i] = pastedData[i];
            }
        }

        setOtp(newOtp);
        const lastFilledIndex = Math.min(pastedData.length, 5);
        inputRefs.current[lastFilledIndex]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const otpCode = otp.join('');

        if (otpCode.length !== 6) {
            toast.warning('Please enter the complete 6-digit OTP', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await authService.checkOtp(phone, otpCode);

            toast.success('OTP verified successfully!', {
                position: "top-right",
                autoClose: 2000,
            });

            navigate('/change-password', {
                state: { phone, otp: otpCode },
                replace: true
            });
        } catch (error) {
            toast.error(error.message || 'Invalid OTP. Please try again.', {
                position: "top-right",
                autoClose: 4000,
            });
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!canResend || isResending) return;

        setIsResending(true);

        try {
            await authService.checkOtpResetPassword(phone);

            toast.success('OTP sent successfully!', {
                position: "top-right",
                autoClose: 3000,
            });

            setTimer(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (error) {
            toast.error(error.message || 'Failed to resend OTP', {
                position: "top-right",
                autoClose: 4000,
            });
        } finally {
            setIsResending(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                        Verify OTP
                    </h1>

                    <p className="text-sm text-slate-600 text-center mb-8">
                        Please enter the OTP code sent to your mobile<br />
                        <span className="font-semibold text-primary-600">{phone}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-center gap-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-14 text-center text-xl font-bold bg-white border-2 border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    disabled={isSubmitting}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <div className="text-center">
                            {!canResend ? (
                                <p className="text-sm text-slate-600">
                                    Resend OTP in <span className="font-semibold text-primary-600">{formatTime(timer)}</span>
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={isResending}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50"
                                >
                                    {isResending ? 'Sending...' : 'Resend OTP'}
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-secondary-600 text-lg text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-white rounded-2xl">
                        <p className="text-xs text-slate-600 text-center leading-relaxed">
                            Didn't receive the code? Check your message inbox or try resending after the timer expires.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;