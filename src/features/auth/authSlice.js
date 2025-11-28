// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService.js';

// Async thunks
export const loginUser = createAsyncThunk(
    'auth/login',
    async ({ phone, password }, { rejectWithValue }) => {
        try {
            const tokenResponse = await authService.login(phone, password);

            if (!tokenResponse.data?.token) {
                throw new Error('No token in response');
            }
            localStorage.setItem('authToken', tokenResponse.data.token.access);
            localStorage.setItem('refreshToken', tokenResponse.data.token.refresh);

            const userResponse = await authService.getCurrentUser();

            return {
                tokens: tokenResponse.data.token,
                user: userResponse.data
            };
        } catch (error) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            return rejectWithValue(error.response?.data || 'Login failed');
        }
    }
);

export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authService.getCurrentUser();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to get user data');
        }
    }
);

export const checkAuth = createAsyncThunk(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        const token = localStorage.getItem('authToken');

        if (!token) {
            return rejectWithValue('No token found');
        }

        try {
            const userResponse = await authService.getCurrentUser();
            return userResponse.data;
        } catch (error) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');

            return rejectWithValue(error.response?.data || 'Token verification failed');
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout();
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            return null;
        } catch (error) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            return rejectWithValue(error.response?.data || 'Logout failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: localStorage.getItem('authToken'),
        refreshToken: localStorage.getItem('refreshToken'),
        isAuthenticated: false,
        isLoading: true,
        error: null,
        // Add this flag to track initial auth check
        authCheckCompleted: false
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.isLoading = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Check Auth - This runs when app starts
            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
                state.error = null;
                state.authCheckCompleted = true;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.refreshToken = null;
                state.authCheckCompleted = true;
            })
            // Login
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.tokens.access;
                state.refreshToken = action.payload.tokens.refresh;
                state.error = null;
                // Mark auth check as completed after successful login
                state.authCheckCompleted = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.refreshToken = null;
                state.error = action.payload;
            })
            // Get Current User
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.user = action.payload;
            })
            // Logout
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                state.isLoading = false;
                state.error = null;
            });
    }
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;