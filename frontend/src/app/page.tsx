'use client'

import { useEffect, useState } from 'react'

interface TelegramWebApp {
  ready(): void
  expand(): void
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      username?: string
    }
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      setUser(tg.initDataUnsafe.user)
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">🚗 Авто Доска</h1>
        <p className="text-gray-600">
          Создавайте объявления о продаже автомобилей
        </p>
        {user && (
          <p className="text-sm text-gray-500 mt-2">
            Привет, {user.first_name}! 👋
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">🚀 Проект готов!</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span>Frontend настроен</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span>Telegram WebApp подключен</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500">⏳</span>
            <span>Настройте бота и БД</span>
          </div>
        </div>
        
        <button className="w-full mt-6 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
          Создать объявление
        </button>
      </div>
    </div>
  )
}
