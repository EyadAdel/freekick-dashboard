// src/hooks/useAuth.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, logoutUser, clearError, getCurrentUser, checkAuth } from '../features/auth/authSlice.js';

export const useAuth = () => {
    const dispatch = useDispatch();
    const { user, token, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);
    const login = (phone, password) => {
        let cleanPhone = phone.replace(/[^\d+]/g, '');
        if (!cleanPhone.startsWith('+')) {
            cleanPhone = `+${cleanPhone}`;
        }
        dispatch(loginUser({ phone: cleanPhone, password }));
    };

    const logout = () => {
        dispatch(logoutUser());

    };

    const resetError = () => {
        dispatch(clearError());
    };

    const fetchUser = () => {
        dispatch(getCurrentUser());
    };

    useEffect(() => {
        return () => {
            if (error) {
                resetError();
            }
        };
    }, [error]);

    return {
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        resetError,
        fetchUser
    };
};