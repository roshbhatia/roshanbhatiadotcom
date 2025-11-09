import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import './styles/globals.css'

// Get root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

// Create React root
const root = createRoot(rootElement)

// Render app with theme provider
root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
