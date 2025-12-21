import { useGoogleLogin } from '@react-oauth/google'
import { Button, Icon } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FaSignOutAlt, FaSignInAlt } from 'react-icons/fa'

export default function LoginButton({ showLogout = true }: { showLogout?: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  useEffect(() => {
    // Check if we already have a valid access token
    const token = localStorage.getItem('googleAccessToken')
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // Store the access token for API calls
      localStorage.setItem('googleAccessToken', tokenResponse.access_token)
      setIsAuthenticated(true)
      console.log('Authentication successful')
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('googleAuthChange'))
    },
    onError: () => {
      console.error('Login Failed')
    },
    // Request scopes for Calendar and Docs APIs
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ].join(' '),
  })

  const handleLogout = () => {
    localStorage.removeItem('googleAccessToken')
    setIsAuthenticated(false)
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('googleAuthChange'))
  }

  if (isAuthenticated && showLogout) {
    return (
      <Button onClick={handleLogout} size="xs" colorScheme="red" w="24px" h="24px" minW="24px" p={0}>
        <Icon as={FaSignOutAlt} />
      </Button>
    )
  }
  
  if (isAuthenticated && !showLogout) {
    return null
  }

  // Don't show login button if client ID is not configured
  if (!googleClientId || googleClientId === 'placeholder-client-id') {
    return null
  }

  return (
    <Button onClick={() => login()} size="xs" colorScheme="blue" w="24px" h="24px" minW="24px" p={0}>
      <Icon as={FaSignInAlt} />
    </Button>
  )
}