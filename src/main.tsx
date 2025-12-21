import { ChakraProvider } from '@chakra-ui/react'
import { extendTheme } from '@chakra-ui/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'


const colors = {
  brand: {
    900: '#1a365d',
    800: '#153e75',
    700: '#2a69ac',
  },
}

const theme = extendTheme({ colors })

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

if (!googleClientId) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not set. Google OAuth features will not work.')
}

// Always wrap in GoogleOAuthProvider to prevent errors when components use OAuth hooks
// Use a placeholder client ID if none is provided (will show error but won't crash)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || 'placeholder-client-id'}>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
) 
