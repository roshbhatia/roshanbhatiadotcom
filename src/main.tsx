import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { ModalProvider } from '@components/page/ModalContext'
import ModalStack from '@components/ModalStack'
import './styles/globals.css'

// Get root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

// Create React root
const root = createRoot(rootElement)

// Render app with theme and modal providers
root.render(
  <ThemeProvider>
    <ModalProvider>
      <App />
      <ModalStack />
    </ModalProvider>
  </ThemeProvider>
)
