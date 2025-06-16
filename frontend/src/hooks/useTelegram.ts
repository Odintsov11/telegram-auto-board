// 📄 frontend/src/hooks/useTelegram.ts (исправленная версия)
import { useEffect, useState } from 'react'
import { TelegramWebApp, TelegramUser } from '@/types/telegram'

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      setWebApp(tg)
      setUser(tg.initDataUnsafe.user || null)
      
      tg.ready()
      tg.expand()
    }
  }, [])

  return {
    webApp,
    user,
    isReady: !!webApp
  }
}