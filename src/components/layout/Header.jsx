// src/components/layout/Header/Header.jsx
import { Bell, Search, Settings, User } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const notifications = [
        {
            id: 1,
            type: 'success',
            title: 'Booking confirmed',
            message: 'Ashraf Al-Shareel has confirmed his booking on the venue AL MARIYAH on 22 April at 7pm.',
            time: '11:30 AM',
            read: false
        },
        {
            id: 2,
            type: 'error',
            title: 'Booking Cancelled',
            message: "Naaman Zaki's booking at Zayed Sport City was canceled.",
            time: '2:45 PM',
            read: false
        },
        {
            id: 3,
            type: 'warning',
            title: 'Booking Cancellation Requested',
            message: 'Rahman Saeed has submitted a new request to list the venue Rawdhat in the app.',
            time: '4:20 PM',
            read: false
        }
    ];

    return (
        <header className="bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10 h-20">
            <div className="flex items-center justify-between h-full px-8">
                {/* Left side - Welcome message */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome, Ali</p>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Bell className="w-6 h-6 text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                                        <button className="text-sm text-primary-600 hover:text-primary-700">
                                            Mark all as read
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                                !notification.read ? 'bg-primary-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                                    notification.type === 'success' ? 'bg-green-500' :
                                                        notification.type === 'error' ? 'bg-red-500' :
                                                            'bg-yellow-500'
                                                }`}></div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-800 text-sm">
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-xs text-gray-400 mt-2 block">
                            {notification.time}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 text-center border-t border-gray-200">
                                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                        View more
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Settings className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left hidden lg:block">
                                <p className="text-sm font-medium text-gray-800">Ali Ahmed</p>
                                <p className="text-xs text-gray-500">Admin</p>
                            </div>
                        </button>

                        {/* Profile Dropdown */}
                        {showProfile && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div className="p-2">
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                                        Profile
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                                        Settings
                                    </button>
                                    <hr className="my-2" />
                                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;