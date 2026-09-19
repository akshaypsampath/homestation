import { useGoogleLogin } from '@react-oauth/google'
import { Button, Icon } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { FaSignOutAlt, FaSignInAlt } from 'react-icons/fa'
import { clearToken, getTokenExpiry, hasStoredToken, isAuthenticated, saveToken } from '../services/google-auth-service'

// Start renewing this long before the token expires
const REFRESH_WINDOW_MS = 10 * 60 * 1000
// Don't try to renew more often than this
const MIN_RETRY_MS = 60 * 1000

export default function LoginButton({ showLogout = true }: { showLogout?: boolean }) {
  const [signedIn, setSignedIn] = useState(isAuthenticated())
  const lastAttempt = useRef(0)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // Store the access token (and when it expires) for API calls
      saveToken(tokenResponse.access_token, tokenResponse.expires_in)
      setSignedIn(true)
      console.log('Authentication successful')
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('googleAuthChange'))
    },
    onError: (error) => {
      console.error('Login Failed', error)
    },
    // Silent renewals are opened without a click, which browsers may block
    onNonOAuthError: (error) => {
      console.warn('Login popup failed:', error)
    },
    // Request scopes for Calendar and Docs APIs
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ].join(' '),
  })

  // Keep the latest login fn in a ref so the timers below don't restart every render
  const loginRef = useRef(login)
  loginRef.current = login

  // Stay logged in: renew the access token shortly before it expires. Google access tokens last
  // about an hour. prompt: 'none' reuses the existing Google session and consent, so no UI shows
  // up if it works. If the browser blocks the popup, the next click or touch retries.
  useEffect(() => {
    const refreshIfNeeded = () => {
      if (!hasStoredToken()) return
      const msLeft = getTokenExpiry() - Date.now()
      if (msLeft > REFRESH_WINDOW_MS) return
      if (Date.now() - lastAttempt.current < MIN_RETRY_MS) return
      lastAttempt.current = Date.now()
      console.log('Renewing Google access token')
      loginRef.current({ prompt: 'none' })
    }

    const syncState = () => setSignedIn(isAuthenticated())

    refreshIfNeeded()
    const interval = setInterval(() => {
      refreshIfNeeded()
      syncState()
    }, 30 * 1000)

    window.addEventListener('googleAuthChange', syncState)
    window.addEventListener('pointerdown', refreshIfNeeded)
    window.addEventListener('keydown', refreshIfNeeded)
    document.addEventListener('visibilitychange', refreshIfNeeded)

    return () => {
      clearInterval(interval)
      window.removeEventListener('googleAuthChange', syncState)
      window.removeEventListener('pointerdown', refreshIfNeeded)
      window.removeEventListener('keydown', refreshIfNeeded)
      document.removeEventListener('visibilitychange', refreshIfNeeded)
    }
  }, [])

  const handleLogout = () => {
    clearToken()
    setSignedIn(false)
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('googleAuthChange'))
  }

  if (signedIn && showLogout) {
    return (
      <Button onClick={handleLogout} size="xs" colorScheme="red" w="24px" h="24px" minW="24px" p={0}>
        <Icon as={FaSignOutAlt} />
      </Button>
    )
  }

  if (signedIn && !showLogout) {
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
