// API configuration utility to handle different environments

/**
 * Get the base API URL based on the current environment
 * Handles both local development and production scenarios
 */
export const getApiUrl = () => {
  // For local development
  if (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1') {
    // Always use HTTP for local backend
    return 'http://localhost:8000'
  }

  // For accessing via IP address or hostname (like from iPad)
  // Use HTTP since backend doesn't support HTTPS yet
  // Note: This will cause mixed content warnings on HTTPS
  return `http://${window.location.hostname}:8000`
}

/**
 * Build a full API endpoint URL
 * @param {string} endpoint - The API endpoint path (e.g., '/api/voice-chat')
 * @returns {string} The full URL
 */
export const buildApiUrl = (endpoint) => {
  const baseUrl = getApiUrl()
  return `${baseUrl}${endpoint}`
}

/**
 * Check if we're in a secure context (HTTPS)
 * and trying to access insecure backend (HTTP)
 */
export const isMixedContent = () => {
  return window.location.protocol === 'https:' &&
         getApiUrl().startsWith('http:')
}

/**
 * Get a message about mixed content issues
 */
export const getMixedContentMessage = () => {
  if (isMixedContent()) {
    return 'Warning: You are accessing the site via HTTPS but the backend is on HTTP. ' +
           'Some features may not work. Try accessing the site via HTTP instead, or ' +
           'ensure your browser allows mixed content for this site.'
  }
  return null
}