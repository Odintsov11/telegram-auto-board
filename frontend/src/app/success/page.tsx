'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [adId, setAdId] = useState<string | null>(null)
  const [ad, setAd] = useState<any>(null)

  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) {
      router.push('/')
      return
    }

    setAdId(id)

    // Получаем данные объявления
    const userAds = JSON.parse(localStorage.getItem('userAds') || '[]')
    const foundAd = userAds.find((ad: any) => ad.id === id)
    if (foundAd) {
      setAd(foundAd)
    }
  }, [searchParams, router])

  const handleViewAd = () => {
    // Переход к просмотру объявления в канале (заглушка)
    alert('Переход к просмотру объявления в канале')
  }

  const handleMyAds = () => {
    router.push('/history')
  }

  const handleCreateNew = () => {
    router.push('/create')
  }

  if (!ad) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      {/* Успешная публикация */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-white">✓</span>
        </div>
        
        <h1 className="text-2xl font-bold text-green-600 mb-2">
          Объявление опубликовано!
        </h1>
        
        <p className="text-gray-600">
          Ваше объявление успешно размещено в канале и уже доступно для просмотра
        </p>
      </div>

      {/* Информация об объявлении */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-3">Детали публикации</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Автомобиль:</span>
            <span className="font-medium">
              {ad.brand} {ad.model}, {ad.year}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Тариф:</span>
            <span className="font-medium">{ad.tariff.name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Статус:</span>
            <span className="text-green-600 font-medium">Опубликовано</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Время публикации:</span>
            <span className="font-medium">
              {new Date(ad.publishedAt).toLocaleString('ru-RU')}
            </span>
          </div>

          {ad.expiresAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Действует до:</span>
              <span className="font-medium">
                {new Date(ad.expiresAt).toLocaleString('ru-RU')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-3">Статистика</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-blue-600">Просмотров</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-blue-600">Контактов</div>
          </div>
        </div>
        
        <p className="text-xs text-blue-600 mt-3 text-center">
          Статистика обновляется каждые 15 минут
        </p>
      </div>

      {/* Действия */}
      <div className="space-y-3">
        <Button
          onClick={handleViewAd}
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Посмотреть в канале
        </Button>
        
        <Button
          onClick={handleMyAds}
          className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Мои объявления
        </Button>
        
        <Button
          onClick={handleCreateNew}
          className="w-full border border-blue-500 text-blue-500 py-3 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Создать новое объявление
        </Button>
      </div>

      {/* Дополнительная информация */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">💡 Полезные советы</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Отвечайте быстро на сообщения покупателей</li>
          <li>• Обновляйте статус объявления при продаже</li>
          <li>• Используйте продвижение для большей видимости</li>
          <li>• Добавляйте качественные фотографии</li>
        </ul>
      </div>

      {/* Поддержка */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 mb-2">
          Нужна помощь с объявлением?
        </p>
        <button className="text-blue-500 text-sm underline">
          Связаться с поддержкой
        </button>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="text-center">Загрузка...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}