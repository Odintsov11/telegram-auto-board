// 📄 backend/src/index.ts (версия для деплоя на Render)
import express from 'express'
import cors from 'cors'
import { config } from './utils/config'
import { logger } from './utils/logger'
import { startBot } from './bot'

const app = express()

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    config.WEBAPP_URL,
    /\.ngrok-free\.app$/, // разрешаем любые ngrok адреса
    /\.onrender\.com$/ // разрешаем Render домены
  ],
  credentials: true
}))
app.use(express.json())

// Логирование всех запросов
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    body: req.body,
    headers: req.headers
  })
  next()
})

// Простой API для публикации (встроенный)
app.post('/api/ads/publish', async (req, res) => {
  try {
    const adData = req.body
    logger.info('Publishing ad:', { 
      id: adData.id, 
      brand: adData.brand, 
      model: adData.model,
      tariff: adData.tariff?.id 
    })

    // Проверяем наличие обязательных данных
    if (!adData.brand || !adData.model || !adData.year || !adData.price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['brand', 'model', 'year', 'price']
      })
    }

    // Проверяем конфигурацию
    if (!config.BOT_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'Bot token not configured'
      })
    }

    if (!config.CHANNEL_ID) {
      return res.status(500).json({
        success: false,
        error: 'Channel ID not configured'
      })
    }

    // Импортируем бота динамически
    const { bot } = await import('./bot')

    // Формируем текст объявления
    let message = `🚗 **${adData.brand} ${adData.model}`
    
    if (adData.modification) {
      message += ` ${adData.modification}`
    }
    
    message += `**\n**${adData.year}**\n`

    if (adData.engine && adData.power) {
      message += `**${adData.engine} (${adData.power} л.с.)**\n`
    }

    message += `**${adData.mileage} тыс. км**\n`

    if (adData.drivetrain) {
      message += `**${adData.drivetrain}**\n`
    }

    if (adData.description) {
      message += `**${adData.description}**\n`
    }

    if (adData.city) {
      message += `${adData.city}\n`
    }

    message += `💰 **${adData.priceFormatted || adData.price}**\n`

    // Добавляем контакты
    if (adData.showPhone && adData.phone) {
      message += `📞 **${adData.phone}**\n`
    }

    if (adData.showTelegram && adData.telegram) {
      message += `📨 **@${adData.telegram}**\n`
    }

    // VIP объявление
    if (adData.tariff?.id === 'vip') {
      message += `\n⭐ **VIP ОБЪЯВЛЕНИЕ** ⭐`
    }

    logger.info('Sending message to channel:', {
      channelId: config.CHANNEL_ID,
      messageLength: message.length
    })

    // Публикуем в канал
    const sentMessage = await bot.api.sendMessage(config.CHANNEL_ID, message, {
      parse_mode: 'Markdown'
    })

    logger.info('Message sent successfully:', {
      messageId: sentMessage.message_id
    })

    // Закрепляем для премиум тарифов
    if (adData.tariff?.id?.includes('premium') || adData.tariff?.id === 'vip') {
      try {
        await bot.api.pinChatMessage(config.CHANNEL_ID, sentMessage.message_id)
        logger.info('Message pinned successfully')
      } catch (pinError) {
        logger.warn('Failed to pin message (might not have permissions):', pinError)
      }
    }

    res.json({
      success: true,
      messageId: sentMessage.message_id,
      channelId: config.CHANNEL_ID,
      message: 'Advertisement published successfully'
    })

  } catch (error) {
    logger.error('Failed to publish ad:', error)
    
    // Детализированная обработка ошибок
    let errorMessage = 'Failed to publish advertisement'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('chat not found')) {
        errorMessage = 'Channel not found or bot not added to channel'
        statusCode = 400
      } else if (error.message.includes('not enough rights')) {
        errorMessage = 'Bot does not have permission to post in channel'
        statusCode = 403
      } else if (error.message.includes('Bad Request')) {
        errorMessage = 'Invalid message format'
        statusCode = 400
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
      config: {
        hasToken: !!config.BOT_TOKEN,
        hasChannelId: !!config.CHANNEL_ID,
        channelId: config.CHANNEL_ID
      }
    })
  }
})

// Health check
app.get('/health', (req, res) => {
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

// Test API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' })
})

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  })
})

// Start server and bot - ЗАМЕНЯЕМ НА НОВУЮ ВЕРСИЮ
async function startApp() {
  try {
    // Используем PORT от Render или API_PORT
    const port = process.env.PORT || config.API_PORT
    
    // Запускаем API сервер
    app.listen(port, () => {
      logger.info(`API server started on port ${port}`)
    })

    // Запускаем бота
    await startBot()
    
  } catch (error) {
    logger.error('Failed to start application:', error)
    process.exit(1)
  }
}

startApp()