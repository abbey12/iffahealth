import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import dashboardSlice from './slices/dashboardSlice';
import usersSlice from './slices/usersSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    dashboard: dashboardSlice,
    users: usersSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
