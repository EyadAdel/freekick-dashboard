// src/routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LogoLoader from "../components/common/LogoLoader.jsx";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">

                <LogoLoader/>
            </div>
        );
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

export default ProtectedRoute;