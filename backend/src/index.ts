import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import fs from 'fs'
import { config } from './utils/config'
import { logger } from './utils/logger'
import { startBot } from './bot'
import { prisma } from './database/client'
import { InputFile } from 'grammy'

// Extend Express Request type to include files
interface MulterRequest extends Request {
  files?: Express.Multer.File[]
}

const app = express()

// Создаем папку для загрузок если не существует
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadsDir)
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

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
app.use('/uploads', express.static(uploadsDir))

// Логирование запросов
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// Загрузка фото
app.post(
  '/api/upload',
  upload.array('photos', 10),
  (req: Request, res: Response) => {
    try {
      // Приводим req.files к тому, что гарантирует multer.array
      const files = req.files as Express.Multer.File[]

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' })
      }

      const uploadedFiles = files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        // это поле вы отдаёте на фронт, можно назвать serverPath или просто path
        serverPath: `/uploads/${file.filename}`,  
        size: file.size
      }))

      res.json({
        success: true,
        files: uploadedFiles
      })
    } catch (error) {
      logger.error('Upload error:', error)
      res.status(500).json({ error: 'Upload failed' })
    }
  }
)

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
      where: { telegramId: BigInt(adData.userId || 0) }
    })

    if (!user && adData.userId) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(adData.userId),
          username: adData.userName || null,
          firstName: adData.userName || 'Пользователь'
        }
      })
    }

    // Создаем объявление в БД
    const dbAd = await prisma.ad.create({
      data: {
        userId: user?.id || 1,
        carBrand: adData.brand,
        carModel: adData.model,
        carYear: adData.year,
        engineType: adData.engine || 'Не указан',
        engineVolume: adData.power ? parseFloat(adData.power.replace(/[^\d.]/g, '')) : 2.0,
        mileage: parseInt(adData.mileage) || 0,
        transmission: adData.transmission || 'Не указана',
        drive: adData.drivetrain || 'Не указан',
        description: adData.description || '',
        city: adData.city || '',
        price: parseInt(adData.price.replace(/[^\d]/g, '')) || 0,
        contactPhone: adData.phone || '',
        contactUsername: adData.telegram || '',
        status: 'ACTIVE',
        publishedAt: new Date()
      }
    })

    // Сохраняем фотографии
    if (adData.photoFiles && adData.photoFiles.length > 0) {
      const photoPromises = adData.photoFiles.map((photo: any, index: number) => 
        prisma.adPhoto.create({
          data: {
            adId: dbAd.id,
            filePath: photo.path,
            orderIndex: index
          }
        })
      )
      await Promise.all(photoPromises)
    }

    // Формируем текст объявления
    let message = `🚙 **${adData.brand} ${adData.model}**\n\n`
    
    message += `**${adData.year}`
    if (adData.engine && adData.power) {
      message += ` • ${adData.engine} (${adData.power} л.с.)`
    }
    message += `**\n`

    message += `**${adData.mileage} тыс. км`
    if (adData.drivetrain) {
      message += ` • ${adData.drivetrain} привод`
    }
    message += `**\n\n`

    if (adData.description) {
      message += `📄 ${adData.description}\n\n`
    }

    if (adData.city) {
      message += `📍 ${adData.city}\n\n`
    }

    message += `💰 **${adData.priceFormatted || adData.price}**\n\n`

    // Контакты
    if (adData.showPhone && adData.phone) {
      message += `📞 ${adData.phone}\n`
    }
    if (adData.showTelegram && adData.telegram) {
      message += `📨 @${adData.telegram}\n`
    }

    if (adData.tariff?.id === 'vip') {
      message += `\n⭐ **VIP ОБЪЯВЛЕНИЕ** ⭐`
    }

    // Кнопка для подачи объявления
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📲 Подать объявление',
            url: 'https://t.me/myautoboard_bot/autoboard'
          }
        ]
      ]
    }

    let sentMessage

    // Публикуем с фото или без
    if (adData.photoFiles && adData.photoFiles.length > 0) {
      const photoPath = path.join(uploadsDir, path.basename(adData.photoFiles[0].path))
      if (fs.existsSync(photoPath)) {
        // Для Telegram API используем InputFile
        const inputFile = new InputFile(photoPath)
        sentMessage = await bot.api.sendPhoto(config.CHANNEL_ID, inputFile, {
          caption: message.length > 1024 ? message.slice(0, 1020) + '...' : message,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        })
      } else {
        // Если файл не найден, отправляем как обычное сообщение
        sentMessage = await bot.api.sendMessage(config.CHANNEL_ID, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        })
      }
    } else {
      sentMessage = await bot.api.sendMessage(config.CHANNEL_ID, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    }

    // Обновляем ID сообщения в БД
    await prisma.ad.update({
      where: { id: dbAd.id },
      data: { channelMessageId: sentMessage.message_id }
    })

    // Закрепляем для премиум тарифов
    if (adData.tariff?.id?.includes('premium') || adData.tariff?.id === 'vip') {
      try {
        await bot.api.pinChatMessage(config.CHANNEL_ID, sentMessage.message_id)
        
        // Планируем открепление для ограниченных тарифов
        if (adData.tariff.id === 'premium_1') {
          setTimeout(async () => {
            try {
              await bot.api.unpinChatMessage(config.CHANNEL_ID, sentMessage.message_id)
            } catch (err) {
              logger.warn('Failed to unpin message:', err)
            }
          }, 24 * 60 * 60 * 1000) // 24 часа
        } else if (adData.tariff.id === 'premium_3') {
          setTimeout(async () => {
            try {
              await bot.api.unpinChatMessage(config.CHANNEL_ID, sentMessage.message_id)
            } catch (err) {
              logger.warn('Failed to unpin message:', err)
            }
          }, 3 * 24 * 60 * 60 * 1000) // 3 дня
        } else if (adData.tariff.id === 'premium_7') {
          setTimeout(async () => {
            try {
              await bot.api.unpinChatMessage(config.CHANNEL_ID, sentMessage.message_id)
            } catch (err) {
              logger.warn('Failed to unpin message:', err)
            }
          }, 7 * 24 * 60 * 60 * 1000) // 7 дней
        }
      } catch (pinError) {
        logger.warn('Failed to pin message:', pinError)
      }
    }

    logger.info('Ad published successfully:', {
      dbId: dbAd.id,
      messageId: sentMessage.message_id
    })

    res.json({
      success: true,
      messageId: sentMessage.message_id,
      adId: dbAd.id,
      channelId: config.CHANNEL_ID
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

// Снятие с публикации / отметка как проданное
app.post('/api/ads/:id/status', async (req: Request, res: Response) => {
  try {
    const adId = parseInt(req.params.id)
    const { status } = req.body // 'INACTIVE', 'DELETED'

    const ad = await prisma.ad.findUnique({
      where: { id: adId }
    })

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' })
    }

    // Обновляем статус в БД
    await prisma.ad.update({
      where: { id: adId },
      data: { status }
    })

    // Если есть ID сообщения, обновляем сообщение в канале
    if (ad.channelMessageId) {
      const { bot } = await import('./bot')
      
      // Формируем обновленный текст
      let message = `🚙 **${ad.carBrand} ${ad.carModel}**\n\n`
      message += `**${ad.carYear} • ${ad.engineType}**\n`
      message += `**${ad.mileage} тыс. км • ${ad.drive} привод**\n\n`
      
      if (ad.description) {
        message += `📄 ${ad.description}\n\n`
      }
      
      if (ad.city) {
        message += `📍 ${ad.city}\n\n`
      }
      
      message += `💰 **${ad.price.toLocaleString()} ₽**\n\n`
      
      // Вместо контактов показываем статус
      if (status === 'INACTIVE') {
        message += `ℹ️ **Снято с публикации**`
      } else if (status === 'DELETED') {
        message += `✅ **Продано**`
      }

      try {
        await bot.api.editMessageText(
          config.CHANNEL_ID,
          ad.channelMessageId,
          message,
          { parse_mode: 'Markdown' }
        )
      } catch (editError) {
        logger.warn('Failed to edit message in channel:', editError)
      }
    }

    res.json({ success: true })
  } catch (error) {
    logger.error('Failed to update ad status:', error)
    res.status(500).json({ error: 'Failed to update status' })
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