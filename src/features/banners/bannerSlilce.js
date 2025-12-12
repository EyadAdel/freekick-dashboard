import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import bannerService from '../../services/banners/bannerService.js';

const initialState = {
    banners: [],
    currentBanner: null,
    loading: false,
    error: null,
    totalCount: 0,
    page: 1,
    hasNext: false,
    hasPrevious: false,
    lastFetchParams: null,
};

export const fetchBanners = createAsyncThunk(
    'banners/fetchAll',
    async (params) => {
        const response = await bannerService.getBanners(params);
        return { ...response, params };
    }
);

export const fetchBannerById = createAsyncThunk(
    'banners/fetchById',
    async (id) => {
        return await bannerService.getBannerById(id);
    }
);

export const createBanner = createAsyncThunk(
    'banners/create',
    async (data, { dispatch, getState }) => {
        const newBanner = await bannerService.createBanner(data);

        const state = getState().banners;
        const lastParams = state.lastFetchParams || {};

        dispatch(fetchBanners(lastParams));

        return newBanner;
    }
);

export const updateBanner = createAsyncThunk(
    'banners/update',
    async ({ id, data }, { dispatch, getState }) => {
        const updatedBanner = await bannerService.updateBanner(id, data);

        const state = getState().banners;
        const lastParams = state.lastFetchParams || {};

        dispatch(fetchBanners(lastParams));

        return updatedBanner;
    }
);

export const deleteBanner = createAsyncThunk(
    'banners/delete',
    async (id, { dispatch, getState }) => {
        await bannerService.deleteBanner(id);

        const state = getState().banners;
        const lastParams = state.lastFetchParams || {};

        dispatch(fetchBanners(lastParams));

        return id;
    }
);

const bannerSlice = createSlice({
    name: 'banners',
    initialState,
    reducers: {
        clearCurrentBanner: (state) => {
            state.currentBanner = null;
        },
        setPage: (state, action) => {
            state.page = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBanners.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBanners.fulfilled, (state, action) => {
                state.loading = false;
                state.banners = action.payload.results;
                state.totalCount = action.payload.count;
                state.hasNext = !!action.payload.next;
                state.hasPrevious = !!action.payload.previous;
                state.lastFetchParams = action.payload.params;
            })
            .addCase(fetchBanners.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch banners';
            })
            .addCase(fetchBannerById.fulfilled, (state, action) => {
                state.currentBanner = action.payload;
            })
            .addCase(createBanner.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBanner.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createBanner.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create banner';
            })
            .addCase(updateBanner.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBanner.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(updateBanner.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update banner';
            })
            .addCase(deleteBanner.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBanner.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(deleteBanner.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete banner';
            });
    },
});

export const { clearCurrentBanner, setPage } = bannerSlice.actions;
export default bannerSlice.reducer;