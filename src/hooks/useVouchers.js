import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import {
    fetchVouchers,
    fetchVoucherById,
    createVoucher,
    updateVoucher,
    patchVoucher,
    deleteVoucher,
    fetchVoucherAnalytics,
    validateVoucherCode,
    clearError,
    clearSuccess,
    clearCurrentVoucher,
    clearValidatedVoucher
} from '../features/vouchers/vouchersSlice';

export const useVouchers = () => {
    const dispatch = useDispatch();

    const {
        vouchers,
        currentVoucher,
        analytics,
        validatedVoucher,
        pagination,
        loading,
        error,
        success
    } = useSelector(state => state.vouchers);

    // You could also fetch analytics automatically when hook is used
    useEffect(() => {
        // Optional: Fetch analytics when component mounts
        // dispatch(fetchVoucherAnalytics());
    }, [dispatch]);

    const getVouchers = useCallback((params) => {
        return dispatch(fetchVouchers(params));
    }, [dispatch]);

    const getVoucherById = useCallback((id) => {
        return dispatch(fetchVoucherById(id));
    }, [dispatch]);

    const addVoucher = useCallback((voucherData) => {
        return dispatch(createVoucher(voucherData));
    }, [dispatch]);

    const editVoucher = useCallback(({ id, data }) => {
        return dispatch(updateVoucher({ id, data }));
    }, [dispatch]);

    const editVoucherPartial = useCallback(({ id, data }) => {
        return dispatch(patchVoucher({ id, data }));
    }, [dispatch]);

    const removeVoucher = useCallback((id) => {
        return dispatch(deleteVoucher(id));
    }, [dispatch]);

    const getAnalytics = useCallback(() => {
        return dispatch(fetchVoucherAnalytics());
    }, [dispatch]);

    const validateCode = useCallback((code) => {
        return dispatch(validateVoucherCode(code));
    }, [dispatch]);

    const resetError = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    const resetSuccess = useCallback(() => {
        dispatch(clearSuccess());
    }, [dispatch]);

    const resetCurrentVoucher = useCallback(() => {
        dispatch(clearCurrentVoucher());
    }, [dispatch]);

    const resetValidatedVoucher = useCallback(() => {
        dispatch(clearValidatedVoucher());
    }, [dispatch]);

    return {
        vouchers,
        currentVoucher,
        analytics,
        validatedVoucher,
        pagination,
        loading,
        error,
        success,
        getVouchers,
        getVoucherById,
        addVoucher,
        editVoucher,
        editVoucherPartial,
        removeVoucher,
        getAnalytics,
        validateCode,
        resetError,
        resetSuccess,
        resetCurrentVoucher,
        resetValidatedVoucher,
    };
};