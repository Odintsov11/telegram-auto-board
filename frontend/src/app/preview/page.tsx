'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface AdData {
  brand: string
  model: string
  year: string
  mileage: string
  mileageFormatted: string
  price: string
  priceFormatted: string
  description: string
  photoUrls: string[]
  phone: string
  telegram: string
  showPhone: boolean
  showTelegram: boolean
}

interface TariffPlan {
  id: string
  name: string
  price: number
  duration: string
  features: string[]
  popular?: boolean
  color: string
}

const tariffPlans: TariffPlan[] = [
  {
    id: 'standard',
    name: 'Стандарт',
    price: 99,
    duration: 'Навсегда',
    features: [
      '✅ Размещение в Telegram-канале',
      '♾️ Объявление остаётся навсегда в ленте',
    ],
    color: 'border-gray-300 bg-white'
  },
  {
    id: 'premium_12',
    name: 'Премиум 12ч',
    price: 600,
    duration: '12 часов закрепа',
    features: [
      '🚀 Публикация с приоритетом',
      '📌 Закрепление на 12 часов',
      '📣 Уведомление подписчиков',
      '✨ Лёгкое выделение в ленте'
    ],
    color: 'border-indigo-400 bg-indigo-50'
  },
  {
    id: 'premium_24',
    name: 'Премиум 24ч',
    price: 1200,
    duration: '24 часа закрепа',
    features: [
      '🚀 Публикация с приоритетом',
      '📌 Закрепление на 1 день',
      '📣 Уведомление подписчиков',
      '🎯 Выделение цветом + смайлы'
    ],
    popular: true,
    color: 'border-blue-500 bg-blue-50'
  },
  {
    id: 'premium_7',
    name: 'Премиум 7 дней',
    price: 4500,
    duration: '7 дней закрепа',
    features: [
      '🚀 Публикация с приоритетом',
      '📌 Закрепление на 7 дней',
      '📊 Статистика просмотров',
      '📣 Еженедельное поднятие',
      '🔥 Яркое оформление + иконки'
    ],
    color: 'border-purple-500 bg-purple-50'
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 8000,
    duration: '30 дней активности',
    features: [
      '👑 Постоянное закрепление (30 дней)',
      '🔁 Автоперепубликация каждую неделю',
      '🚨 Максимальный приоритет в ленте',
      '📈 Подробная статистика',
      '🧑‍💼 Персональный менеджер',
      '🌟 Эксклюзивный дизайн поста'
    ],
    color: 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50'
  }
]


export default function PreviewPage() {
  const router = useRouter()
  const [adData, setAdData] = useState<AdData | null>(null)
  const [selectedTariff, setSelectedTariff] = useState<string>('premium_1')

  useEffect(() => {
    const savedData = localStorage.getItem('adData')
    if (!savedData) {
      router.push('/create')
      return
    }
    setAdData(JSON.parse(savedData))
  }, [router])

  const handlePayment = () => {
    const selectedPlan = tariffPlans.find(plan => plan.id === selectedTariff)
    if (!selectedPlan || !adData) return

    // Сохраняем данные для оплаты
    const paymentData = {
      adData,
      tariff: selectedPlan
    }
    localStorage.setItem('paymentData', JSON.stringify(paymentData))
    router.push('/payment')
  }

  if (!adData) {
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
          onClick={() => router.back()}
          className="text-blue-500 text-sm mb-2"
        >
          ← Назад к редактированию
        </button>
        <h1 className="text-xl font-bold">Предпросмотр объявления</h1>
      </div>

      {/* Предпросмотр объявления */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="mb-4">
          {adData.photoUrls && adData.photoUrls.length > 0 && (
            <div className="relative mb-4">
              <img
                src={adData.photoUrls[0]}
                alt="Основное фото"
                className="w-full h-48 object-cover rounded-lg"
              />
              {adData.photoUrls.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  +{adData.photoUrls.length - 1} фото
                </div>
              )}
            </div>
          )}
          
          <h2 className="text-lg font-bold">
            {adData.brand} {adData.model}, {adData.year}
          </h2>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-bold text-blue-600">
              {adData.priceFormatted}
            </span>
            <span className="text-gray-600">
              {adData.mileageFormatted}
            </span>
          </div>
        </div>

        {adData.description && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Описание:</h3>
            <p className="text-gray-700 text-sm">{adData.description}</p>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Контакты:</h3>
          <div className="space-y-1">
            {adData.showPhone && adData.phone && (
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">📞</span>
                <span>{adData.phone}</span>
              </div>
            )}
            {adData.showTelegram && adData.telegram && (
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">✈️</span>
                <span>@{adData.telegram}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Выбор тарифа */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-4">Выберите тариф публикации</h2>
        <div className="space-y-3">
          {tariffPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedTariff === plan.id
                  ? plan.color.replace('border-', 'border-2 border-').replace('bg-', 'bg-')
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedTariff(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-2 left-4">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Популярный
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.duration}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{plan.price.toLocaleString()} ₽</div>
                  <input
                    type="radio"
                    name="tariff"
                    checked={selectedTariff === plan.id}
                    onChange={() => setSelectedTariff(plan.id)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <ul className="space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Итого и кнопка оплаты */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span>Выбранный тариф:</span>
          <span className="font-semibold">
            {tariffPlans.find(p => p.id === selectedTariff)?.name}
          </span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold">
          <span>К оплате:</span>
          <span className="text-blue-600">
            {tariffPlans.find(p => p.id === selectedTariff)?.price.toLocaleString()} ₽
          </span>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold"
      >
        Перейти к оплате
      </Button>

      <p className="text-xs text-gray-500 text-center mt-4">
        После оплаты объявление будет автоматически опубликовано в канале
      </p>
    </div>
  )
}