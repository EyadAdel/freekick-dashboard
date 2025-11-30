// src/components/layout/MainLayout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import MobileSidebar from "./MobileSidebar.jsx";

const MainLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { direction } = useSelector((state) => state.language);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile/tablet screens
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <div className={`flex h-screen bg-gray-50 overflow-hidden ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            {/* Sidebar - Fixed Position */}
            <div className="hidden lg:block fixed top-0 bottom-0 z-50">
                <Sidebar
                    onToggle={setIsSidebarCollapsed}
                    direction={direction}
                    isCollapsed={isSidebarCollapsed}
                />
            </div>

            {/* Mobile/Tablet Overlay Sidebar */}
            <MobileSidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                direction={direction}
            />

            {/* Main content area - FIXED: Proper width calculation */}
            <div
                className={`flex-1 flex flex-col transition-all duration-300 ${
                    isMobile ? 'w-full' : ''
                }`}
                style={
                    !isMobile ? {
                        marginLeft: direction === 'rtl' ? 0 : (isSidebarCollapsed ? '4rem' : '14rem'),
                        marginRight: direction === 'rtl' ? (isSidebarCollapsed ? '4rem' : '14rem') : 0,
                        width: `calc(100% - ${isSidebarCollapsed ? '4rem' : '14rem'})`
                    } : {}
                }
            >
                {/* Header - Now properly positioned */}
                <Header
                    isSidebarCollapsed={isSidebarCollapsed}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                    direction={direction}
                />

                {/* Page Content - Adjusted padding */}
                <main className={`flex-1 lg:mt-[4rem] mt-3 overflow-y-auto overflow-x-hidden custom-scrollbar ${
                    isMobile ? 'pt-16 px-4' : 'pt-16 lg:px-8'
                } py-4 lg:py-8`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;