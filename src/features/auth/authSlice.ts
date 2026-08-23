import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CurrentUser } from '@/shared/types/api'

interface AuthState {
  user: CurrentUser | null
  /** false, пока не отработал первый /auth/me — до этого нельзя решать, куда редиректить */
  initialized: boolean
}

const initialState: AuthState = {
  user: null,
  initialized: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedIn(state, action: PayloadAction<CurrentUser>) {
      state.user = action.payload
      state.initialized = true
    },
    loggedOut(state) {
      state.user = null
      state.initialized = true
    },
    /** Сессии нет — стартовая проверка завершена, пользователь анонимный */
    authChecked(state) {
      state.initialized = true
    },
  },
})

export const { loggedIn, loggedOut, authChecked } = authSlice.actions
export default authSlice.reducer
