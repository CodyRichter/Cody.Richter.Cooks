// Environment configuration - keep it simple and maintainable
const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }
  
  return process.env.NODE_ENV === 'production' 
    ? 'https://api.cooking.cody.richter.codes'
    : 'http://localhost:8000'
}

export const apiBaseUrl = getApiBaseUrl()
export const tokenStorageKey = 'cooking_app_access_token'
export const refreshTokenStorageKey = 'cooking_app_refresh_token'