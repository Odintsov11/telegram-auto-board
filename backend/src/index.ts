import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import fs from 'fs'
import { InputFile } from 'grammy'
import { config } from './utils/config'
import { logger } from './utils/logger'
import { startBot } from './bot'
import { prisma } from './database/client'

interface TelegramUserInfo {
  id: number
  username?: string
  first_name?: string
}

function extractTelegramUser(data: any): TelegramUserInfo | null {
  let telegramId: number | undefined
  let username: string | undefined
  let first_name: string | undefined

  if (typeof data.userId === 'string') {
    const parsed = parseInt(data.userId, 10)
    if (!isNaN(parsed)) {
      telegramId = parsed
    }
  } else if (typeof data.userId === 'number') {
    telegramId = data.userId
  }

  if (!telegramId && typeof data.initData === 'string') {
    try {
      const params = new URLSearchParams(data.initData)
      const userParam = params.get('user')
      if (userParam) {
        const parsed = JSON.parse(userParam)
        telegramId = parsed.id
        username = parsed.username
        first_name = parsed.first_name
      }
    } catch (err) {
      logger.error('Failed to parse initData:', err)
    }
  }

  if (telegramId) {
    return { id: telegramId, username, first_name }
  }

  return null
}

const app = express()

// Directory for uploaded photos
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
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

// Upload photos
app.post('/api/upload', upload.array('photos', 10), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' })
    }
    const uploaded = files.map(f => ({ path: `/uploads/${f.filename}`, filename: f.originalname }))
    res.json({ success: true, files: uploaded })
  } catch (error) {
    logger.error('Upload error:', error)
    res.status(500).json({ success: false, error: 'Upload failed' })
  }
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

    // Определяем Telegram ID пользователя
    const parsedUser = extractTelegramUser(adData)
    const telegramId = parsedUser?.id

    if (!telegramId) {
      return res.status(400).json({ success: false, error: 'User ID is required' })
    }

    const telegramUser = parsedUser


    // Сохраняем в базу данных по Telegram ID

    let user = await prisma.user.findUnique({
       where: { telegramId: BigInt(telegramId) }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(telegramId),
          username: telegramUser?.username || adData.userName || 'anonymous',
          firstName: telegramUser?.first_name || adData.userName || 'Пользователь'
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

    if (Array.isArray(adData.photoFiles) && adData.photoFiles.length > 0) {
      const photoPromises = adData.photoFiles.map((p: any, index: number) =>
        prisma.adPhoto.create({
          data: {
            adId: dbAd.id,
            filePath: p.path,
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
    let sentMessage

    if (Array.isArray(adData.photoFiles) && adData.photoFiles.length > 0) {
      const localPath = path.join(uploadsDir, path.basename(adData.photoFiles[0].path))
      if (fs.existsSync(localPath)) {
        const inputFile = new InputFile(localPath)
        sentMessage = await bot.api.sendPhoto(config.CHANNEL_ID, inputFile, {
          caption: message.length > 1024 ? message.slice(0, 1020) + '...' : message,
          parse_mode: 'Markdown'
        })
      }
    }

    if (!sentMessage) {
      if (adData.photo) {
        sentMessage = await bot.api.sendPhoto(config.CHANNEL_ID, adData.photo, {
          caption: message.length > 1024 ? message.slice(0, 1020) + '...' : message,
          parse_mode: 'Markdown'
        })
      } else {
        sentMessage = await bot.api.sendMessage(config.CHANNEL_ID, message, {
          parse_mode: 'Markdown'
        })
      }
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