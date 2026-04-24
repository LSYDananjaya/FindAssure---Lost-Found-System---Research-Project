import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'findassure.website.themePreference'
const SYSTEM_QUERY = '(prefers-color-scheme: dark)'

function readStoredPreference() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const value = window.localStorage.getItem(STORAGE_KEY)

  if (value === 'light' || value === 'dark') {
    return value
  }

  return window.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light'
}

export function useThemeMode() {
  const [themePreference, setThemePreference] = useState(readStoredPreference)
  const activeTheme = useMemo(() => themePreference, [themePreference])

  useEffect(() => {
    document.documentElement.dataset.theme = activeTheme
    document.documentElement.dataset.themePreference = themePreference
    document.documentElement.style.colorScheme = activeTheme
    window.localStorage.setItem(STORAGE_KEY, themePreference)
  }, [activeTheme, themePreference])

  return {
    activeTheme,
    themePreference,
    setThemePreference,
  }
}
