import { Theme } from '@/types/memo'

export const THEME_STORAGE_KEY = 'memo-app-theme'

export const localStorageUtils = {
  // 저장된 테마 가져오기
  getTheme: (): Theme | null => {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      return stored === 'light' || stored === 'dark' ? stored : null
    } catch (error) {
      console.error('Error loading theme from localStorage:', error)
      return null
    }
  },

  // 테마 저장하기
  saveTheme: (theme: Theme): void => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (error) {
      console.error('Error saving theme to localStorage:', error)
    }
  },
}
