import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { config } from './utils/config'
import { logger } from './utils/logger'
import { startBot } from './bot'
import { prisma } from './database/client'

const app = express()

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    config.WEBAPP_URL,
    /\.ngrok-free\.app$/,
    /\.onrender\.com$/,
    /\.vercel\.app$/
  ],
  credentials: true
}))
app.use(express.json())

// Логирование запросов
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// Публикация объявления
app.post('/api/ads/publish', async (req: Request, res: Response) => {
  try {
    const adData = req.body
    logger.info('Publishing ad:', { 
      id: adData.id, 
      brand: adData.brand, 
      model: adData.model,
      tariff: adData.tariff?.id 
    })

    // Валидация
    if (!adData.brand || !adData.model || !adData.year || !adData.price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      })
    }

    // Проверяем бота
    const { bot } = await import('./bot')

    // Сохраняем в базу данных
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(adData.userId || 777) }
    })

    if (!user) {
      // Создаем пользователя если не существует
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(adData.userId || 777),
          username: adData.userName || 'anonymous',
          firstName: adData.userName || 'Пользователь'
        }
      })
    }

    // Создаем объявление в БД
    const dbAd = await prisma.ad.create({
      data: {
        userId: user.id,
        carBrand: adData.brand,
        carModel: adData.model,
        carYear: adData.year,
        engineType: adData.engine || 'Не указан',
        engineVolume: 2.0, // Используем значение по умолчанию
        mileage: parseInt(String(adData.mileage).replace(/[^\d]/g, '')) || 0,
        transmission: adData.transmission || 'Не указана',
        drive: adData.drivetrain || 'Не указан',
        description: adData.description || '',
        city: adData.city || '',
        price: parseInt(String(adData.price).replace(/[^\d]/g, '')) || 0,
        contactPhone: adData.phone || '',
        contactUsername: adData.telegram || '',
        status: 'ACTIVE',
        publishedAt: new Date()
      }
    })

    // Формируем текст объявления
    let message = `🚙 **${adData.brand} ${adData.model}**\n\n`
    
    message += `**${adData.year}`
    if (adData.engine && adData.power) {
      message += ` • ${adData.engine} (${adData.power} л.с.)`
    }
    message += `**\n`

    message += `**${adData.mileage} тыс. км • ${adData.drivetrain || 'Не указан'} привод**\n\n`
    
    if (adData.description) {
      message += `📄 ${adData.description}\n\n`
    }
    
    if (adData.city) {
      message += `📍 ${adData.city}\n\n`
    }
    
    const priceNumber = parseInt(String(adData.price).replace(/[^\d]/g, '')) || 0
    message += `💰 **${priceNumber.toLocaleString('ru-RU')} ₽**\n\n`
    
    // Контакты
    if (adData.showPhone && adData.phone) {
      message += `📞 ${adData.phone}\n`
    }
    if (adData.showTelegram && adData.telegram) {
      message += `✈️ @${adData.telegram.replace('@', '')}\n`
    }

    // Публикуем в канал
    let sentMessage;
    
    if (adData.photo) {
      // Если есть фото - отправляем с фото
      sentMessage = await bot.api.sendPhoto(config.CHANNEL_ID, adData.photo, {
        caption: message.length > 1024 ? message.slice(0, 1020) + '...' : message,
        parse_mode: 'Markdown'
      })
    } else {
      // Если нет фото - отправляем текстовое сообщение
      sentMessage = await bot.api.sendMessage(config.CHANNEL_ID, message, {
        parse_mode: 'Markdown'
      })
    }

    // Сохраняем ID сообщения
    await prisma.ad.update({
      where: { id: dbAd.id },
      data: { channelMessageId: sentMessage.message_id }
    })

    res.json({
      success: true,
      adId: dbAd.id,
      messageId: sentMessage.message_id
    })
  } catch (error) {
    logger.error('Failed to publish ad:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to publish advertisement',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Получение объявлений пользователя
app.get('/api/ads/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId)
    
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(userId) }
    })

    if (!user) {
      return res.json({ ads: [] })
    }

    const ads = await prisma.ad.findMany({
      where: { userId: user.id },
      include: {
        photos: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ ads })
  } catch (error) {
    logger.error('Failed to get user ads:', error)
    res.status(500).json({ error: 'Failed to get ads' })
  }
})

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    config: {
      botToken: config.BOT_TOKEN ? 'Present' : 'Missing',
      channelId: config.CHANNEL_ID,
      webappUrl: config.WEBAPP_URL
    }
  })
})

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  })
})

async function startApp() {
  try {
    // Инициализируем базу данных
    await prisma.$connect()
    logger.info('Database connected')

    const port = process.env.PORT || config.API_PORT
    
    app.listen(port, () => {
      logger.info(`API server started on port ${port}`)
    })

    await startBot()
    
  } catch (error) {
    logger.error('Failed to start application:', error)
    process.exit(1)
  }
}

startApp()