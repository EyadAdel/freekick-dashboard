import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    title: 'Dashboard', // Fallback title
};

export const pageTitleSlice = createSlice({
    name: 'pageTitle',
    initialState,
    reducers: {
        // Action to set the title
        setPageTitle: (state, action) => {
            state.title = action.payload;
        },
        // Optional: Action to reset to default
        resetPageTitle: (state) => {
            state.title = initialState.title;
        },
    },
});

// Export Actions
export const { setPageTitle, resetPageTitle } = pageTitleSlice.actions;

// Export Selector (How you "get" the title)
export const selectPageTitle = (state) => state.pageTitle.title;

// Export Reducer
export default pageTitleSlice.reducer;