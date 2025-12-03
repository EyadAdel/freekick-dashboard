import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import vouchersService from '../../services/vouchers/vouchersService.js';

// Async thunks
export const fetchVouchers = createAsyncThunk(
    'vouchers/fetchVouchers',
    async (params, { rejectWithValue }) => {
        try {
            const data = await vouchersService.getVouchers(params);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchVoucherById = createAsyncThunk(
    'vouchers/fetchVoucherById',
    async (id, { rejectWithValue }) => {
        try {
            const data = await vouchersService.getVoucherById(id);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createVoucher = createAsyncThunk(
    'vouchers/createVoucher',
    async (voucherData, { rejectWithValue }) => {
        try {
            const data = await vouchersService.createVoucher(voucherData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateVoucher = createAsyncThunk(
    'vouchers/updateVoucher',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await vouchersService.updateVoucher(id, data);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const patchVoucher = createAsyncThunk(
    'vouchers/patchVoucher',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await vouchersService.patchVoucher(id, data);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteVoucher = createAsyncThunk(
    'vouchers/deleteVoucher',
    async (id, { rejectWithValue }) => {
        try {
            await vouchersService.deleteVoucher(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchVoucherAnalytics = createAsyncThunk(
    'vouchers/fetchAnalytics',
    async (_, { rejectWithValue }) => {
        try {
            const data = await vouchersService.getVoucherAnalytics();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const validateVoucherCode = createAsyncThunk(
    'vouchers/validateCode',
    async (code, { rejectWithValue }) => {
        try {
            const data = await vouchersService.validateVoucherCode(code);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Initial state
const initialState = {
    vouchers: [],
    currentVoucher: null,
    analytics: null,
    validatedVoucher: null,
    pagination: {
        count: 0,
        next: null,
        previous: null,
        currentPage: 1,
    },
    loading: false,
    error: null,
    success: false,
};

// Slice
const vouchersSlice = createSlice({
    name: 'vouchers',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.success = false;
        },
        clearCurrentVoucher: (state) => {
            state.currentVoucher = null;
        },
        clearValidatedVoucher: (state) => {
            state.validatedVoucher = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch vouchers
            .addCase(fetchVouchers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVouchers.fulfilled, (state, action) => {
                state.loading = false;
                state.vouchers = action.payload.results || [];
                state.pagination = {
                    count: action.payload.count,
                    next: action.payload.next,
                    previous: action.payload.previous,
                    currentPage: state.pagination.currentPage,
                };
            })
            .addCase(fetchVouchers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch voucher by ID
            .addCase(fetchVoucherById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVoucherById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentVoucher = action.payload;
            })
            .addCase(fetchVoucherById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create voucher
            .addCase(createVoucher.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createVoucher.fulfilled, (state, action) => {
                state.loading = false;
                state.vouchers.unshift(action.payload);
                state.success = true;
            })
            .addCase(createVoucher.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })

            // Update voucher
            .addCase(updateVoucher.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateVoucher.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.vouchers.findIndex(v => v.id === action.payload.id);
                if (index !== -1) {
                    state.vouchers[index] = action.payload;
                }
                state.currentVoucher = action.payload;
                state.success = true;
            })
            .addCase(updateVoucher.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })

            // Patch voucher
            .addCase(patchVoucher.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(patchVoucher.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.vouchers.findIndex(v => v.id === action.payload.id);
                if (index !== -1) {
                    state.vouchers[index] = action.payload;
                }
                state.currentVoucher = action.payload;
                state.success = true;
            })
            .addCase(patchVoucher.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })

            // Delete voucher
            .addCase(deleteVoucher.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteVoucher.fulfilled, (state, action) => {
                state.loading = false;
                state.vouchers = state.vouchers.filter(v => v.id !== action.payload);
                state.success = true;
            })
            .addCase(deleteVoucher.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch analytics
            .addCase(fetchVoucherAnalytics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVoucherAnalytics.fulfilled, (state, action) => {
                state.loading = false;
                state.analytics = action.payload;
            })
            .addCase(fetchVoucherAnalytics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Validate voucher code
            .addCase(validateVoucherCode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(validateVoucherCode.fulfilled, (state, action) => {
                state.loading = false;
                state.validatedVoucher = action.payload;
            })
            .addCase(validateVoucherCode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.validatedVoucher = null;
            });
    },
});

export const { clearError, clearSuccess, clearCurrentVoucher, clearValidatedVoucher } = vouchersSlice.actions;
export default vouchersSlice.reducer;