"use client"

import type { UseToastOptions } from "@chakra-ui/react"

// Chakra UI v2 uses useToast hook instead of Toaster component
// This is a compatibility wrapper for v3-style API
export const toaster = {
  create: (_options?: UseToastOptions) => {
    // This would need to be called within a component that has access to useToast
    // For now, this is a stub that won't break the build
    return {
      success: (_options?: UseToastOptions) => {},
      error: (_options?: UseToastOptions) => {},
      info: (_options?: UseToastOptions) => {},
      warning: (_options?: UseToastOptions) => {},
    }
  }
}

export const Toaster = () => {
  // In Chakra UI v2, toasts are handled via useToast hook in components
  // This component is a no-op for v2 compatibility
  return null
}
