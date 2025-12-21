/**
 * Frontend Google API service using OAuth 2.0 access tokens
 */

const API_BASE_URL = 'https://www.googleapis.com'

/**
 * Get the stored access token
 */
function getAccessToken(): string | null {
  return localStorage.getItem('googleAccessToken')
}

/**
 * Make an authenticated request to Google APIs
 */
async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken()
  if (!token) {
    throw new Error('No access token found. Please authenticate first.')
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error?.message || `API request failed: ${response.statusText} (${response.status})`)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to reach Google API. Please check your internet connection.')
    }
    throw error
  }
}

/**
 * Lists events from the user's primary calendar
 */
export async function listCalendarEvents(
  calendarId: string = 'primary',
  maxResults: number = 10,
  timeMin?: string
) {
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    ...(timeMin && { timeMin }),
  })

  return authenticatedFetch(`/calendar/v3/calendars/${calendarId}/events?${params}`)
}

/**
 * Get a specific calendar event
 */
export async function getCalendarEvent(calendarId: string, eventId: string) {
  return authenticatedFetch(`/calendar/v3/calendars/${calendarId}/events/${eventId}`)
}

/**
 * List all calendars for the user
 */
export async function listCalendars() {
  return authenticatedFetch('/calendar/v3/users/me/calendarList')
}

/**
 * Get calendar access control list
 */
export async function getCalendarACL(calendarId: string) {
  return authenticatedFetch(`/calendar/v3/calendars/${calendarId}/acl`)
}

/**
 * Get a Google Doc by ID
 */
export async function getDocument(documentId: string) {
  return authenticatedFetch(`/docs/v1/documents/${documentId}`)
}

/**
 * List files from Google Drive (can filter for Docs)
 */
export async function listDriveFiles(
  q?: string,
  pageSize: number = 10,
  pageToken?: string
) {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    ...(q && { q }),
    ...(pageToken && { pageToken }),
  })

  return authenticatedFetch(`/drive/v3/files?${params}`)
}

/**
 * Find a document by name in Google Drive root directory
 */
export async function findDocumentByName(name: string) {
  try {
    // Escape single quotes in the name for the query
    const escapedName = name.replace(/'/g, "\\'")
    // Search for files with the exact name, in root directory (no parents), and of type Google Docs
    const query = `name='${escapedName}' and 'root' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`
    const params = new URLSearchParams({
      q: query,
      pageSize: '10',
      fields: 'files(id, name)',
    })

    console.log('Searching for document with query:', query);
    const result = await authenticatedFetch(`/drive/v3/files?${params}`)
    console.log('Search result:', result);
    
    if (result.files && result.files.length > 0) {
      return result.files[0].id
    }
    throw new Error(`Document "${name}" not found in root directory`)
  } catch (error) {
    console.error('Error in findDocumentByName:', error);
    throw error;
  }
}

/**
 * Get document content and extract all text lines
 * Uses Drive API export to avoid CORS issues
 */
export async function getDocumentContent(documentId: string) {
  try {
    console.log('Fetching document content for ID:', documentId);
    
    // Use Drive API export endpoint to get document as plain text
    // This avoids CORS issues that the Docs API has
    const token = getAccessToken()
    if (!token) {
      throw new Error('No access token found. Please authenticate first.')
    }

    const exportUrl = `${API_BASE_URL}/drive/v3/files/${documentId}/export?mimeType=text/plain`
    
    const response = await fetch(exportUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      await response.text().catch(() => response.statusText)
      throw new Error(`Failed to export document: ${response.statusText} (${response.status})`)
    }

    const text = await response.text()
    console.log('Document exported successfully, length:', text.length);
    
    // Extract all lines, preserving empty lines for newline formatting
    const lines = text.split('\n')
    
    console.log('Extracted lines:', lines.length);
    return lines
  } catch (error) {
    console.error('Error in getDocumentContent:', error);
    throw error;
  }
}

/**
 * Get document images organized by day of the week
 * Exports as HTML to extract image URLs and any applied effects/styles
 */
export async function getDocumentImagesByDay(documentId: string): Promise<Record<string, string>> {
  try {
    console.log('Fetching document images for ID:', documentId);
    
    const token = getAccessToken()
    if (!token) {
      throw new Error('No access token found. Please authenticate first.')
    }

    // Export as HTML to get image URLs
    const exportUrl = `${API_BASE_URL}/drive/v3/files/${documentId}/export?mimeType=text/html`
    
    const response = await fetch(exportUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      await response.text().catch(() => response.statusText)
      throw new Error(`Failed to export document: ${response.statusText} (${response.status})`)
    }

    const html = await response.text()
    console.log('Document exported as HTML, length:', html.length);
    
    // Parse HTML to extract images and their associated day labels
    const imagesByDay: Record<string, string> = {}
    
    // Days of the week (full names and common variations)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayAbbrevs = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayPatterns = [...days, ...dayAbbrevs]
    
    // Create a temporary DOM parser (browser environment)
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Find all images
    const images = Array.from(doc.querySelectorAll('img'))
    console.log(`Found ${images.length} images in document`);
    
    // Strategy: Find all day names first, then match each day to its nearest image
    // Get all elements in document order
    const allElements = Array.from(doc.querySelectorAll('*'))
    const dayPositions: Array<{ day: string; fullDay: string; index: number; element: Element }> = []
    
    // Find all day names and their positions (looking for day followed by colon)
    allElements.forEach((element, index) => {
      const text = element.textContent || ''
      for (const dayPattern of dayPatterns) {
        // Look for day name followed by colon (e.g., "Monday:" or "Mon:")
        const regex = new RegExp(`\\b${dayPattern}\\s*:`, 'i')
        if (regex.test(text)) {
          // Determine full day name
          let fullDayName: string
          if (days.includes(dayPattern)) {
            fullDayName = dayPattern
          } else {
            const abbrevIndex = dayAbbrevs.findIndex(abbr => 
              abbr.toLowerCase() === dayPattern.toLowerCase()
            )
            fullDayName = abbrevIndex >= 0 ? days[abbrevIndex] : dayPattern
          }
          
          // Only add if we haven't found this day yet (take first occurrence)
          if (!dayPositions.find(d => d.fullDay === fullDayName)) {
            dayPositions.push({ day: dayPattern, fullDay: fullDayName, index, element })
            console.log(`Found ${fullDayName} at element index ${index}`);
          }
        }
      }
    })
    
    console.log(`Found ${dayPositions.length} day labels in document`);
    
    // Now match each day to the image that appears after it (below, after the colon)
    dayPositions.forEach(({ fullDay, index: dayIndex }) => {
      interface ImageMatch {
        img: HTMLImageElement
        distance: number
      }
      
      let bestMatch: ImageMatch | null = null
      let bestDistance = Infinity
      
      // Find the image that appears AFTER the day (below it, after the colon)
      // Only look for images that come after the day index
      images.forEach((img) => {
        const imgIndex = allElements.indexOf(img)
        // Only consider images that come after the day
        if (imgIndex > dayIndex) {
          const distance = imgIndex - dayIndex
          // Take the closest image after the day
          if (distance < bestDistance) {
            bestDistance = distance
            bestMatch = { img, distance }
          }
        }
      })
      
      if (bestMatch !== null) {
        const match = bestMatch as ImageMatch
        const imgSrc = match.img.getAttribute('src') || ''
        if (imgSrc && !imagesByDay[fullDay]) {
          imagesByDay[fullDay] = imgSrc
          console.log(`Mapped ${fullDay} to image at distance ${match.distance} (after day)`);
        }
      }
    })
    
    // Fallback: If we have 7 images and some days are missing, assign images in order
    if (images.length === 7 && Object.keys(imagesByDay).length < 7) {
      console.log('Using fallback: assigning images in order to days');
      const missingDays = days.filter(day => !imagesByDay[day])
      const usedImages = new Set(Object.values(imagesByDay))
      const unusedImages = images.filter(img => {
        const src = img.getAttribute('src') || ''
        return !usedImages.has(src)
      })
      
      missingDays.forEach((day, index) => {
        if (unusedImages[index]) {
          const imgSrc = unusedImages[index].getAttribute('src') || ''
          if (imgSrc) {
            imagesByDay[day] = imgSrc
            console.log(`Fallback: Assigned ${day} to image ${index}`);
          }
        }
      })
    }
    
    console.log('Images by day:', imagesByDay);
    console.log(`Successfully mapped ${Object.keys(imagesByDay).length} days`);
    return imagesByDay
  } catch (error) {
    console.error('Error in getDocumentImagesByDay:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}
