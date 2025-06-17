'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TelegramUser, TelegramWebApp } from '@/types/telegram'

interface PhotoData {
  file: File
  url: string
  name: string
  serverPath?: string
}

interface FormData {
  brand: string
  model: string
  modification: string
  year: string
  engine: string
  power: string
  transmission: string
  mileage: string
  drivetrain: string
  description: string
  city: string
  price: string
  photos: PhotoData[]
  phone: string
  telegram: string
  showPhone: boolean
  showTelegram: boolean
}

export default function CreateAdPage() {
  const router = useRouter()
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [formData, setFormData] = useState<FormData>({
    brand: '',
    model: '',
    modification: '',
    year: '',
    engine: '',
    power: '',
    mileage: '',
    drivetrain: '',
    description: '',
    transmission: '',
    city: '',
    price: '',
    photos: [],
    phone: '',
    telegram: '',
    showPhone: false,
    showTelegram: false
  })
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      const telegramUser = tg.initDataUnsafe.user
      setUser(telegramUser || null)

      // Автозаполнение данных из Telegram
      if (telegramUser) {
        setFormData(prev => ({
          ...prev,
          telegram: telegramUser.username || '',
          showTelegram: !!telegramUser.username // Автоматически ставим галочку если есть username
        }))
      }
    }

    // Проверяем, не редактируем ли мы существующее объявление
    const editData = localStorage.getItem('editAdData')
    if (editData) {
      const parsedData = JSON.parse(editData)
      setFormData(prev => ({
        ...prev,
        ...parsedData,
        photos: [] // Фото нужно загрузить заново
      }))
      localStorage.removeItem('editAdData')
    }
  }, [])

  const handleInputChange = (field: keyof FormData, value: string | boolean | File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Только цифры
    setFormData(prev => ({
      ...prev,
      mileage: value
    }))
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Только цифры
    setFormData(prev => ({
      ...prev,
      price: value
    }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '') // Только цифры
    
    // Форматирование номера телефона
    if (value.length > 0) {
      if (value.startsWith('8')) {
        value = '7' + value.slice(1)
      }
      if (!value.startsWith('7')) {
        value = '7' + value
      }
      
      // Форматируем: +7 (999) 123-45-67
      let formatted = '+7'
      if (value.length > 1) {
        formatted += ' (' + value.slice(1, 4)
        if (value.length > 4) {
          formatted += ') ' + value.slice(4, 7)
          if (value.length > 7) {
            formatted += '-' + value.slice(7, 9)
            if (value.length > 9) {
              formatted += '-' + value.slice(9, 11)
            }
          }
        }
      }
      
      setFormData(prev => ({
        ...prev,
        phone: formatted
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        phone: ''
      }))
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.photos.length > 10) {
      alert('Максимум 10 фотографий')
      return
    }

    setIsUploading(true)

    try {
      // Загружаем файлы на сервер
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('photos', file)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('Upload failed')
        }
        
        const result = await response.json()
        return {
          file: file,
          url: URL.createObjectURL(file),
          name: file.name,
          serverPath: result.files[0].path
        }
      })

      const uploadedPhotos = await Promise.all(uploadPromises)
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedPhotos]
      }))
    } catch (error) {
      console.error('Upload error:', error)
      alert('Ошибка загрузки фотографий')
    } finally {
      setIsUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    const photoToRemove = formData.photos[index]
    if (photoToRemove?.url) {
      URL.revokeObjectURL(photoToRemove.url)
    }

    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Валидация
    if (!formData.brand || !formData.model || !formData.year || !formData.price) {
      alert('Заполните все обязательные поля')
      return
    }

    if (!formData.showPhone && !formData.showTelegram) {
      alert('Выберите хотя бы один способ связи')
      return
    }

    if (formData.showPhone && !formData.phone) {
      alert('Введите номер телефона')
      return
    }

    if (formData.showTelegram && !formData.telegram) {
      alert('Введите Telegram username')
      return
    }

    // Переход на предпросмотр с данными
    const adData = {
      ...formData,
      mileageFormatted: `${formData.mileage} тыс.км`,
      priceFormatted: `${parseInt(formData.price).toLocaleString()} ₽`,
      photoUrls: formData.photos.map(p => p.url),
      photoFiles: formData.photos.map(p => ({
        path: p.serverPath || '',
        name: p.name
      }))
    }

    localStorage.setItem('adData', JSON.stringify(adData))
    router.push('/preview')
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <div className="mb-6">
        <button 
          onClick={() => router.back()}
          className="text-blue-500 text-sm mb-2"
        >
          ← Назад
        </button>
        <h1 className="text-xl font-bold">Создать объявление</h1>
        {user && (
          <p className="text-sm text-gray-500">
            Привет, {user.first_name}! 👋
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">🚗 Информация об автомобиле</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Марка *</label>
              <Input
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="BMW, Mercedes, Toyota..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Модель *</label>
              <Input
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="X5, E-Class, Camry..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Год *</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="2020"
                  min="1990"
                  max="2025"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Пробег *</label>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.mileage}
                    onChange={handleMileageChange}
                    placeholder="160"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    тыс.км
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Двигатель</label>
                <Input
                  value={formData.engine}
                  onChange={(e) => handleInputChange('engine', e.target.value)}
                  placeholder="2.0 Бензин"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Мощность</label>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.power}
                    onChange={(e) => handleInputChange('power', e.target.value)}
                    placeholder="150"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    л.с.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Коробка передач</label>
              <select
                value={formData.transmission}
                onChange={(e) => handleInputChange('transmission', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите тип</option>
                <option value="Автомат">Автомат</option>
                <option value="Механика">Механика</option>
                <option value="Вариатор">Вариатор</option>
                <option value="Робот">Робот</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Привод</label>
              <select
                value={formData.drivetrain}
                onChange={(e) => handleInputChange('drivetrain', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите привод</option>
                <option value="Передний">Передний</option>
                <option value="Задний">Задний</option>
                <option value="Полный">Полный</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Город</label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Москва, Санкт-Петербург..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Цена *</label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.price}
                  onChange={handlePriceChange}
                  placeholder="1500000"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  ₽
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Дополнительная информация об автомобиле..."
                className="w-full p-3 border rounded-lg resize-none h-24"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 символов
              </div>
            </div>
          </div>
        </div>

        {/* Фотографии */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">📸 Фотографии</h3>
          
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              disabled={isUploading}
              className="w-full p-2 border rounded-lg"
            />
            
            {isUploading && (
              <div className="text-center text-blue-500">
                Загрузка фотографий...
              </div>
            )}
            
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              Максимум 10 фотографий. Загружено: {formData.photos.length}/10
            </p>
          </div>
        </div>

        {/* Контактная информация */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">📞 Контактная информация</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Телефон</label>
              <Input
                type="tel"
                inputMode="numeric"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="+7 (999) 123-45-67"
              />
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.showPhone}
                  onChange={(e) => handleInputChange('showPhone', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Отображать телефон в объявлении</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telegram</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                <Input
                  value={formData.telegram}
                  onChange={(e) => handleInputChange('telegram', e.target.value)}
                  placeholder="username"
                  className="pl-8"
                />
              </div>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.showTelegram}
                  onChange={(e) => handleInputChange('showTelegram', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Отображать Telegram в объявлении</span>
              </label>
            </div>
          </div>
        </div>

        <Button 
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
        >
          {isUploading ? 'Загрузка фото...' : 'Далее: Предпросмотр'}
        </Button>
      </form>
    </div>
  )
}