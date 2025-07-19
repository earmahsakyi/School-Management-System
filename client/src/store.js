import { configureStore } from '@reduxjs/toolkit';
import index from './reducer/index';

const store = configureStore({
  reducer: index,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,  // speeds up large state checks
      serializableCheck: false // skips checking for non-serializable values
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;
