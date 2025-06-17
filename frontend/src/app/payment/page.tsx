'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface PaymentData {
  adData: any
  tariff: {
    id: string
    name: string
    price: number
    duration: string
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sbp'>('card')

  useEffect(() => {
    const savedData = localStorage.getItem('paymentData')
    if (!savedData) {
      router.push('/create')
      return
    }
    setPaymentData(JSON.parse(savedData))
  }, [router])

  const handlePayment = async () => {
    if (!paymentData) return

    setIsProcessing(true)

    try {
      // Здесь будет интеграция с Яндекс.Кассой
      // Пока имитируем успешную оплату
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Получаем данные пользователя из Telegram
      const tg = window.Telegram?.WebApp
      const tgUser = tg?.initDataUnsafe?.user

      // Подготавливаем данные для публикации
      const adId = Date.now().toString()
      const publishData = {
        id: adId,
        ...paymentData.adData,
        tariff: paymentData.tariff,
        userId: tgUser?.id,
        userName: tgUser?.first_name || 'Пользователь',
        initData: tg?.initData || ''
      }

      // Публикуем объявление в канал через Next.js API route
      console.log('Publishing ad with data:', publishData)
      
      const response = await fetch('/api/ads/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishData)
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response result:', result)

      if (!result.success) {
        throw new Error(result.error || result.details || 'Failed to publish ad')
      }

      // Сохраняем объявление в историю пользователя с ID сообщения
      const existingAds = JSON.parse(localStorage.getItem('userAds') || '[]')
      const newAd = {
        id: adId,
        ...paymentData.adData,
        tariff: paymentData.tariff,
        status: 'published',
        publishedAt: new Date().toISOString(),
        messageId: result.messageId, // ID сообщения в канале
        views: 0,
        contacts: 0,
        expiresAt: calculateExpirationDate(paymentData.tariff.id)
      }
      
      existingAds.push(newAd)
      localStorage.setItem('userAds', JSON.stringify(existingAds))

      // Очищаем временные данные
      localStorage.removeItem('adData')
      localStorage.removeItem('paymentData')

      // Переходим к успешной публикации
      router.push(`/success?id=${adId}`)

    } catch (error) {
      console.error('Payment/Publication error:', error)
      alert('Ошибка при публикации объявления. Попробуйте еще раз.')
      setIsProcessing(false)
    }
  }

  const calculateExpirationDate = (tariffId: string): string => {
    const now = new Date()
    switch (tariffId) {
      case 'premium_1':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      case 'premium_3':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
      case 'premium_7':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'vip':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  if (!paymentData) {
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
          disabled={isProcessing}
        >
          ← Назад
        </button>
        <h1 className="text-xl font-bold">Оплата объявления</h1>
      </div>

      {/* Детали заказа */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-3">Детали заказа</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span>Автомобиль:</span>
            <span className="font-medium">
              {paymentData.adData.brand} {paymentData.adData.model}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Тариф:</span>
            <span className="font-medium">{paymentData.tariff.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Длительность:</span>
            <span>{paymentData.tariff.duration}</span>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Итого к оплате:</span>
            <span className="text-blue-600">
              {paymentData.tariff.price.toLocaleString()} ₽
            </span>
          </div>
        </div>
      </div>

      {/* Способы оплаты */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-4">Способ оплаты</h3>
        
        <div className="space-y-3">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value as 'card')}
              className="mr-3"
            />
            <div className="flex items-center">
              <span className="text-2xl mr-3">💳</span>
              <div>
                <div className="font-medium">Банковская карта</div>
                <div className="text-sm text-gray-500">Visa, MasterCard, МИР</div>
              </div>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="sbp"
              checked={paymentMethod === 'sbp'}
              onChange={(e) => setPaymentMethod(e.target.value as 'sbp')}
              className="mr-3"
            />
            <div className="flex items-center">
              <span className="text-2xl mr-3">📱</span>
              <div>
                <div className="font-medium">Система быстрых платежей</div>
                <div className="text-sm text-gray-500">Оплата через СБП</div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Безопасность */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <span className="text-green-500 text-xl mr-2">🔒</span>
          <span className="font-medium text-green-800">Безопасная оплата</span>
        </div>
        <p className="text-sm text-green-700">
          Оплата проходит через защищенное соединение Яндекс.Кассы. 
          Ваши данные карты не сохраняются на наших серверах.
        </p>
      </div>

      {/* Кнопка оплаты */}
      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full py-3 rounded-lg text-lg font-semibold transition-colors ${
          isProcessing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Обработка платежа...
          </div>
        ) : (
          `Оплатить ${paymentData.tariff.price.toLocaleString()} ₽`
        )}
      </Button>

      {/* Условия */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Нажимая "Оплатить", вы соглашаетесь с{' '}
          <a href="#" className="text-blue-500 underline">условиями использования</a>
          {' '}и{' '}
          <a href="#" className="text-blue-500 underline">политикой конфиденциальности</a>
        </p>
      </div>

      {/* Информация о публикации */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-blue-500 text-xl mr-2">ℹ️</span>
          <span className="font-medium text-blue-800">Что происходит после оплаты?</span>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Объявление автоматически публикуется в канале</li>
          <li>• Начинается отсчет времени действия выбранного тарифа</li>
          <li>• Вы получите уведомление о успешной публикации</li>
          <li>• Объявление появится в разделе "Мои объявления"</li>
        </ul>
      </div>
    </div>
  )
}