'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface Ad {
  id: string
  brand: string
  model: string
  year: string
  price: string
  priceFormatted: string
  mileageFormatted: string
  photoUrls: string[]
  tariff: {
    id: string
    name: string
    price: number
  }
  status: 'published' | 'expired' | 'sold' | 'removed'
  publishedAt: string
  expiresAt?: string
  views: number
  contacts: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [ads, setAds] = useState<Ad[]>([])
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    const userAds = JSON.parse(localStorage.getItem('userAds') || '[]')
    setAds(userAds.sort((a: Ad, b: Ad) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ))
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100'
      case 'expired': return 'text-yellow-600 bg-yellow-100'
      case 'sold': return 'text-blue-600 bg-blue-100'
      case 'removed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Опубликовано'
      case 'expired': return 'Истекло'
      case 'sold': return 'Продано'
      case 'removed': return 'Снято'
      default: return 'Неизвестно'
    }
  }

  const handleAdAction = (ad: Ad, action: string) => {
    setSelectedAd(ad)
    
    switch (action) {
      case 'promote':
        handlePromote(ad)
        break
      case 'republish':
        handleRepublish(ad)
        break
      case 'remove':
        handleRemove(ad)
        break
      case 'mark_sold':
        handleMarkSold(ad)
        break
      case 'view_stats':
        handleViewStats(ad)
        break
    }
    
    setShowActions(false)
  }

  const handlePromote = (ad: Ad) => {
    // Сохраняем данные для продвижения
    const promoteData = {
      adId: ad.id,
      adData: ad,
      isPromotion: true
    }
    localStorage.setItem('promoteData', JSON.stringify(promoteData))
    router.push('/preview?promote=true')
  }

  const handleRepublish = (ad: Ad) => {
    // Подготавливаем данные для переопубликации
    const republishData = {
      ...ad,
      photoUrls: [] // Фото нужно будет загрузить заново
    }
    localStorage.setItem('adData', JSON.stringify(republishData))
    router.push('/preview?republish=true')
  }

  const handleRemove = (ad: Ad) => {
    if (confirm('Вы уверены, что хотите снять объявление с публикации?')) {
      const updatedAds = ads.map(a => 
        a.id === ad.id ? { ...a, status: 'removed' as const } : a
      )
      setAds(updatedAds)
      localStorage.setItem('userAds', JSON.stringify(updatedAds))
    }
  }

  const handleMarkSold = (ad: Ad) => {
    if (confirm('Отметить автомобиль как проданный?')) {
      const updatedAds = ads.map(a => 
        a.id === ad.id ? { ...a, status: 'sold' as const } : a
      )
      setAds(updatedAds)
      localStorage.setItem('userAds', JSON.stringify(updatedAds))
    }
  }

  const handleViewStats = (ad: Ad) => {
    alert(`Статистика объявления:\n\nПросмотры: ${ad.views}\nКонтакты: ${ad.contacts}\nПубликация: ${new Date(ad.publishedAt).toLocaleString('ru-RU')}`)
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <div className="mb-6">
        <button 
          onClick={() => router.push('/')}
          className="text-blue-500 text-sm mb-2"
        >
          ← На главную
        </button>
        <h1 className="text-xl font-bold">Мои объявления</h1>
        <p className="text-sm text-gray-500">
          Управляйте своими объявлениями
        </p>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-semibold mb-2">Пока нет объявлений</h3>
          <p className="text-gray-600 mb-6">
            Создайте первое объявление для продажи автомобиля
          </p>
          <Button
            onClick={() => router.push('/create')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Создать объявление
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">
                    {ad.brand} {ad.model}, {ad.year}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {ad.mileageFormatted} • {ad.priceFormatted}
                  </p>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                  {getStatusText(ad.status)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-blue-600">{ad.views}</div>
                  <div className="text-xs text-gray-500">Просмотров</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">{ad.contacts || 0}</div>
                  <div className="text-xs text-gray-500">Контактов</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-purple-600">{ad.tariff.name}</div>
                  <div className="text-xs text-gray-500">Тариф</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Опубликовано: {new Date(ad.publishedAt).toLocaleString('ru-RU')}
                {ad.expiresAt && (
                  <div>
                    Действует до: {new Date(ad.expiresAt).toLocaleString('ru-RU')}
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {ad.status === 'published' && (
                  <>
                    <button
                      onClick={() => handleAdAction(ad, 'promote')}
                      className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full hover:bg-yellow-200"
                    >
                      🚀 Продвинуть
                    </button>
                    <button
                      onClick={() => handleAdAction(ad, 'mark_sold')}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200"
                    >
                      ✅ Продано
                    </button>
                    <button
                      onClick={() => handleAdAction(ad, 'remove')}
                      className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200"
                    >
                      🗑 Снять
                    </button>
                  </>
                )}
                
                {(ad.status === 'expired' || ad.status === 'removed') && (
                  <button
                    onClick={() => handleAdAction(ad, 'republish')}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                  >
                    🔄 Переопубликовать
                  </button>
                )}

                <button
                  onClick={() => handleAdAction(ad, 'view_stats')}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200"
                >
                  📊 Статистика
                </button>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <Button
              onClick={() => router.push('/create')}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
            >
              + Создать новое объявление
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}