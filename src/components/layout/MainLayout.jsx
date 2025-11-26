// src/components/layout/MainLayout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const MainLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-64">
                {/* Header */}
                <Header />

                {/* Page Content */}
                <main className="mt-20 p-8 overflow-y-auto h-[calc(100vh-80px)]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;