import { configureStore } from '@reduxjs/toolkit'
import contactsReducer from './commonSlice' // existing slice
import usernameReducer from './username' // new slice

const store = configureStore({
  reducer: {
    common: contactsReducer, // existing state
    username: usernameReducer // new username state
  }
  // Optional: enable devTools in production if needed
  // devTools: process.env.NODE_ENV !== "production",
})

export default store
