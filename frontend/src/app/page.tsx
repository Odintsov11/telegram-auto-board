'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { TelegramUser } from '@/types/telegram'

export default function HomePage() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      // Правильная обработка undefined
      setUser(tg.initDataUnsafe.user || null)
    }
  }, [])

  const handleCreateAd = () => {
    router.push('/create')
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <div className="mb-6">
         {user && (
          <p className="text-sm text-gray-500 mt-2">
            Привет, {user.first_name}! 👋
          </p>
        )}
        <h1 className="text-2xl font-bold mb-2">Добро пожаловать в АвтоМаркет!</h1>
        <p className="text-gray-600">
          Создавайте и управляйте объявлениями о продаже автомобилей.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">🚀 Возможности:</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span>Создание объявлений с фото</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span>Автоматическая публикация в канале</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500">✅</span>
            <span>Закрепление объявлений</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500">✅</span>
            <span>Статистика просмотров</span>
          </div>
        </div>
        
        <div className="space-y-3 mt-6">
          <Button 
            onClick={handleCreateAd}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            ➕ Подать объявление
          </Button>
          
          <Button 
            onClick={() => router.push('/history')}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            📋 Мои объявления
          </Button>
        </div>
      </div>
    </div>
  )
}