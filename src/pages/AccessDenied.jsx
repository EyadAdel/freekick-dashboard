// src/pages/AccessDenied/AccessDenied.jsx
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home, Trophy, Dribbble } from 'lucide-react';
import logo from '../assets/logo.svg';

const AccessDenied = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-full w-full   flex items-center justify-center  relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-32 h-32 bg-primary-300/20 rounded-full blur-3xl animate-float-slow"></div>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary-600/10 rounded-full blur-3xl animate-float-slower"></div>
                <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl animate-float-slowest"></div>

                {/* Floating Sports Icons */}
                <Trophy className="absolute top-32 right-32 w-12 h-12 text-primary-300/30 animate-float-slow" />
                <Dribbble className="absolute bottom-40 left-40 w-16 h-16 text-primary-500/20 animate-float-slower" />
            </div>

            <div className="max-w-2xl w-full relative z-10">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-primary-100">
                    {/* Logo Section */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-300/30 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-full">
                                <img
                                    src={logo}
                                    alt="FreeKick Logo"
                                    className="w-16 h-16 object-contain animate-avatar-float-slow"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6 relative">
                            <div className="absolute inset-0 bg-red-200 rounded-full animate-ping opacity-25"></div>
                            <ShieldX className="w-10 h-10 text-red-600 relative z-10" />
                        </div>

                        <div className="mb-6">
                            <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                                403
                            </h1>
                            <h2 className="text-2xl md:text-3xl font-bold text-secondary-600 mb-3">
                                Access Denied
                            </h2>
                            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-300 mx-auto rounded-full mb-4"></div>
                        </div>

                        <p className="text-gray-600 text-lg leading-relaxed mb-4">
                            Oops! You don't have permission to access this area.
                        </p>
                        <p className="text-gray-500 text-sm">
                            This section requires special access privileges. If you believe you should have access, please contact your administrator.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] "
                        >
                            <Home className="w-5 h-5" />
                            Back to Dashboard
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-primary-200 text-secondary-600 rounded-xl hover:bg-primary-50 transition-all duration-300 "
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Go Back
                        </button>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400 flex items-center justify-center ">
                            <img
                                src={logo}
                                alt="FreeKick Logo"
                                className="w-5 h-5 object-contain "
                            />
                            <span className="font-semibold text-secondary-600">FREE KICK</span>
                            <span>- Your Sports Activity Platform</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;