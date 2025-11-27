// src/components/layout/MainLayout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { useState } from 'react';
import { useSelector } from 'react-redux';

const MainLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { direction } = useSelector((state) => state.language);

    return (
        <div className={`flex h-screen bg-gray-50 overflow-hidden ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            {/* Sidebar - Fixed Position */}
            <Sidebar onToggle={setIsSidebarCollapsed} />

            {/* Main Content Area - Takes full remaining width */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${
                isSidebarCollapsed ? (direction === 'rtl' ? 'mr-16' : 'ml-16') : (direction === 'rtl' ? 'mr-56' : 'ml-56')
            }`}>
                {/* Header - Fixed at top */}
                <Header isSidebarCollapsed={isSidebarCollapsed} />

                {/* Page Content - Scrollable, full width with top padding for fixed header */}
                <main className="flex-1 overflow-y-auto pt-20 px-8 py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;