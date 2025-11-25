// API configuration utility

/**
 * Get the base API URL for local development
 */
export const getApiUrl = () => {
  // For local development
  return 'http://localhost:8000'
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