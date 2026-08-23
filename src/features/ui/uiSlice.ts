import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { getLang, setLang, type Lang } from '@/shared/i18n/lang'

interface Toast {
  id: number
  type: 'success' | 'error'
  message: string
}

interface UiState {
  lang: Lang
  sidebarOpen: boolean
  toasts: Toast[]
}

const initialState: UiState = {
  lang: getLang(),
  sidebarOpen: true,
  toasts: [],
}

let nextToastId = 1

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    langChanged(state, action: PayloadAction<Lang>) {
      state.lang = action.payload
      setLang(action.payload)
    },
    sidebarToggled(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    /** Замена flash-сообщений из hbs */
    toastPushed: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload)
      },
      prepare(type: Toast['type'], message: string) {
        return { payload: { id: nextToastId++, type, message } }
      },
    },
    toastDismissed(state, action: PayloadAction<number>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
  },
})

export const { langChanged, sidebarToggled, toastPushed, toastDismissed } = uiSlice.actions
export default uiSlice.reducer
