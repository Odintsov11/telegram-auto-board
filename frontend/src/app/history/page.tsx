'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useTelegram } from '@/hooks/useTelegram'

interface Ad {
  id: number
  carBrand: string
  carModel: string
  carYear: string
  price: number
  mileage: number
  engineType: string
  transmission: string
  drive: string
  description: string
  city: string
  contactPhone: string
  contactUsername: string
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED'
  viewsCount: number
  channelMessageId?: number
  createdAt: string
  publishedAt?: string
  photos: Array<{
    id: number
    filePath: string
    orderIndex: number
  }>
}

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useTelegram()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadUserAds()
    }
  }, [user])

  const loadUserAds = async () => {
    try {
      const response = await fetch(`/api/ads/user/${user?.id}`)
      const data = await response.json()
      setAds(data.ads || [])
    } catch (error) {
      console.error('Failed to load ads:', error)
      // Fallback to localStorage for compatibility
      const localAds = JSON.parse(localStorage.getItem('userAds') || '[]')
      setAds(localAds)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100'
      case 'INACTIVE': return 'text-yellow-600 bg-yellow-100'
      case 'DELETED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Опубликовано'
      case 'INACTIVE': return 'Снято с публикации'
      case 'DELETED': return 'Продано'
      default: return 'Неизвестно'
    }
  }

  const handleAdAction = async (ad: Ad, action: string) => {
    switch (action) {
      case 'promote':
        handlePromote(ad)
        break
      case 'republish':
        handleRepublish(ad)
        break
      case 'remove':
        await handleRemove(ad)
        break
      case 'mark_sold':
        await handleMarkSold(ad)
        break
      case 'edit':
        handleEdit(ad)
        break
      case 'view_stats':
        handleViewStats(ad)
        break
    }
  }

  const handlePromote = (ad: Ad) => {
    // Подготавливаем данные для продвижения
    const promoteData = {
      ...ad,
      brand: ad.carBrand,
      model: ad.carModel,
      year: ad.carYear,
      mileage: ad.mileage.toString(),
      price: ad.price.toString(),
      engine: ad.engineType,
      drivetrain: ad.drive,
      phone: ad.contactPhone,
      telegram: ad.contactUsername,
      showPhone: !!ad.contactPhone,
      showTelegram: !!ad.contactUsername
    }
    localStorage.setItem('promoteData', JSON.stringify(promoteData))
    router.push('/preview?promote=true')
  }

  const handleRepublish = (ad: Ad) => {
    // Подготавливаем данные для переопубликации
    const republishData = {
      brand: ad.carBrand,
      model: ad.carModel,
      year: ad.carYear,
      mileage: ad.mileage.toString(),
      price: ad.price.toString(),
      engine: ad.engineType,
      transmission: ad.transmission,
      drivetrain: ad.drive,
      description: ad.description,
      city: ad.city,
      phone: ad.contactPhone,
      telegram: ad.contactUsername,
      showPhone: !!ad.contactPhone,
      showTelegram: !!ad.contactUsername,
      photos: []
    }
    localStorage.setItem('editAdData', JSON.stringify(republishData))
    router.push('/create')
  }

  const handleEdit = (ad: Ad) => {
    // Подготавливаем данные для редактирования
    const editData = {
      brand: ad.carBrand,
      model: ad.carModel,
      year: ad.carYear,
      mileage: ad.mileage.toString(),
      price: ad.price.toString(),
      engine: ad.engineType,
      transmission: ad.transmission,
      drivetrain: ad.drive,
      description: ad.description,
      city: ad.city,
      phone: ad.contactPhone,
      telegram: ad.contactUsername,
      showPhone: !!ad.contactPhone,
      showTelegram: !!ad.contactUsername,
      photos: []
    }
    localStorage.setItem('editAdData', JSON.stringify(editData))
    router.push('/create')
  }

  const handleRemove = async (ad: Ad) => {
    if (confirm('Вы уверены, что хотите снять объявление с публикации?')) {
      try {
        const response = await fetch(`/api/ads/${ad.id}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'INACTIVE' })
        })

        if (response.ok) {
          await loadUserAds() // Перезагружаем список
        } else {
          alert('Ошибка при снятии объявления')
        }
      } catch (error) {
        console.error('Remove error:', error)
        alert('Ошибка при снятии объявления')
      }
    }
  }

  const handleMarkSold = async (ad: Ad) => {
    if (confirm('Отметить автомобиль как проданный?')) {
      try {
        const response = await fetch(`/api/ads/${ad.id}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'DELETED' })
        })

        if (response.ok) {
          await loadUserAds() // Перезагружаем список
        } else {
          alert('Ошибка при обновлении статуса')
        }
      } catch (error) {
        console.error('Mark sold error:', error)
        alert('Ошибка при обновлении статуса')
      }
    }
  }

  const handleViewStats = (ad: Ad) => {
    alert(`Статистика объявления:\n\nПросмотры: ${ad.viewsCount || 0}\nПубликация: ${new Date(ad.createdAt).toLocaleString('ru-RU')}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="text-center">Загрузка...</div>
      </div>
    )
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
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {ad.photos && ad.photos.length > 0 && (
                      <img
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${ad.photos[0].filePath}`}
                        alt="Car"
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {ad.carBrand} {ad.carModel}, {ad.carYear}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {ad.mileage} тыс.км • {ad.price.toLocaleString()} ₽
                      </p>
                    </div>
                  </div>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                  {getStatusText(ad.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-blue-600">{ad.viewsCount || 0}</div>
                  <div className="text-xs text-gray-500">Просмотров</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">0</div>
                  <div className="text-xs text-gray-500">Контактов</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Создано: {new Date(ad.createdAt).toLocaleString('ru-RU')}
                {ad.publishedAt && (
                  <div>
                    Опубликовано: {new Date(ad.publishedAt).toLocaleString('ru-RU')}
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {ad.status === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => handleAdAction(ad, 'promote')}
                      className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full hover:bg-yellow-200"
                    >
                      🚀 Продвинуть
                    </button>
                    <button
                      onClick={() => handleAdAction(ad, 'edit')}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                    >
                      ✏️ Редактировать
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
                      📦 Снять
                    </button>
                  </>
                )}
                
                {(ad.status === 'INACTIVE' || ad.status === 'DELETED') && (
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