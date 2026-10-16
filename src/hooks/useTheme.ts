'use client'

import { useState, useEffect, useCallback } from 'react'
import { Theme } from '@/types/memo'
import { localStorageUtils } from '@/utils/localStorage'

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light')

  // 초기 테마 동기화 (layout의 초기 스크립트가 이미 html 클래스를 설정함)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    localStorageUtils.saveTheme(next)
    setTheme(next)
  }, [theme])

  return { theme, toggleTheme }
}
