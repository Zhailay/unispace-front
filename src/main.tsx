import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from '@/app/store'
import { I18nProvider } from '@/shared/i18n/I18nProvider'
import App from '@/app/App'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Не найден #root в index.html')

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <I18nProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </I18nProvider>
    </Provider>
  </StrictMode>,
)
