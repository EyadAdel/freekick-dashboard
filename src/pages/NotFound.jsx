// src/pages/NotFound/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { Home, Search, Trophy, Target, Dribbble, Zap } from 'lucide-react';
import logo from '../assets/logo.svg';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-600/5 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-40 h-40 bg-primary-300/20 rounded-full blur-3xl animate-float-slow"></div>
                <div className="absolute bottom-20 right-20 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl animate-float-slower"></div>
                <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-secondary-600/10 rounded-full blur-2xl animate-float-slowest"></div>

                {/* Floating Sports Icons */}
                <Trophy className="absolute top-24 right-40 w-10 h-10 text-primary-300/30 animate-float-slow" />
                <Dribbble className="absolute bottom-32 left-32 w-14 h-14 text-primary-500/20 animate-float-slower" />
                <Target className="absolute top-1/2 left-20 w-12 h-12 text-primary-300/25 animate-float-slowest" />
                <Zap className="absolute bottom-1/4 right-32 w-8 h-8 text-secondary-600/20 animate-float-slow" />
            </div>

            <div className="max-w-4xl w-full relative z-10">
                <div className="text-center mt-8">
                    {/* Logo with Animation */}
                    <div className="flex justify-center mb-8">
                    {/*    <div className="relative">*/}
                    {/*        <div className="absolute inset-0 py-5 mt-5 bg-primary-300/40 rounded-full blur-2xl animate-pulse"></div>*/}
                    {/*        <div className="relative">*/}
                    {/*            <img*/}
                    {/*                src={logo}*/}
                    {/*                alt="FreeKick Logo"*/}
                    {/*                className="w-10 h-10 md:w-16 md:h-16 object-contain animate-avatar-float-slower drop-shadow-2xl"*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    </div>

                    {/* 404 Display */}
                    <div className="mb-8">
                        <div className="relative inline-block">
                            <h1 className="text-[150px] md:text-[200px] font-black leading-none bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 bg-clip-text text-transparent relative">
                                404
                            </h1>
                            {/* Decorative Elements */}
                            <div className="absolute -top-6 -right-6 w-12 h-12 border-4 border-primary-300 rounded-full animate-bounce"></div>
                            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-primary-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-primary-100 max-w-2xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-xl flex justify-center md:text-2xl font-bold text-secondary-600 mb-4">
                                Goal Missed!
                                {/*<div className="relative">*/}
                                {/*<div className="absolute inset-0 py-5 mt-5 bg-primary-300/40 rounded-full blur-2xl animate-pulse"></div>*/}
                                <div className="relative">
                                    <img
                                        src={logo}
                                        alt="FreeKick Logo"
                                        className="w-8 h-8 md:w-10 md:h-10 object-contain animate-avatar-float-slower drop-shadow-2xl"
                                    />
                            {/*    </div>*/}
                            </div>
                            </h2>
                            <div className="w-32 h-1 bg-gradient-to-r from-primary-500 to-primary-300 mx-auto rounded-full mb-6"></div>

                            <p className="text-gray-600 text-lg leading-relaxed mb-3">
                                The page you're looking for has been <span className="font-semibold text-primary-600">sent off the field</span>.
                            </p>
                            <p className="text-gray-500 text-base">
                                It seems like this URL doesn't exist or has been moved. Let's get you back in the game!
                            </p>
                        </div>

                        {/* Popular Pages */}
                        <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-2xl p-6 mb-8">
                            <h3 className="text-sm font-semibold text-secondary-600 mb-4 flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Quick Links
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl hover:bg-primary-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 border border-primary-100"
                                >
                                    <Home className="w-4 h-4" />
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/bookings')}
                                    className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl hover:bg-primary-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 border border-primary-100"
                                >
                                    <Target className="w-4 h-4" />
                                    Bookings
                                </button>
                                {/*<button*/}
                                {/*    onClick={() => navigate('/venues')}*/}
                                {/*    className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl hover:bg-primary-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 border border-primary-100"*/}
                                {/*>*/}
                                {/*    <Dribbble className="w-4 h-4" />*/}
                                {/*    Venues*/}
                                {/*</button>*/}
                                {/*<button*/}
                                {/*    onClick={() => navigate('/tournaments')}*/}
                                {/*    className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl hover:bg-primary-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 border border-primary-100"*/}
                                {/*>*/}
                                {/*    <Trophy className="w-4 h-4" />*/}
                                {/*    Tournaments*/}
                                {/*</button>*/}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-semibold"
                            >
                                <Home className="w-5 h-5" />
                                Return to Home
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full px-6 py-4 border-2 border-primary-200 text-secondary-600 rounded-xl hover:bg-primary-50 transition-all duration-300 font-medium"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>

                    {/* Footer Branding */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                            {/*<span className="text-2xl">⚽</span>*/}
                            <span dir='ltr' className="font-bold text-secondary-600 text-lg flex items-center">
                                FREE K
                                <img
                                    src={logo}
                                    alt="Logo"
                                    className="h-5 w-5 -mx-0.5 animate-avatar-float-slowest"
                                />
                                ICK
                            </span>
                            <span className="text-gray-400">- Play, Book, Compete</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;