// 📄 backend/src/api/routes/ads.ts
import { Router } from 'express'
import { bot } from '../../bot'
import { config } from '../../utils/config'
import { logger } from '../../utils/logger'

const router = Router()

interface AdData {
  id: string
  brand: string
  model: string
  modification?: string
  year: string
  engine?: string
  power?: string
  mileage: string
  drivetrain?: string
  description: string
  city?: string
  price: string
  phone?: string
  telegram?: string
  showPhone: boolean
  showTelegram: boolean
  photo: string
  tariff: {
    id: string
    name: string
    price: number
  }
  userId: number
  userName?: string
}

// Публикация объявления в канал
router.post('/publish', async (req, res) => {
  try {
    const adData: AdData = req.body

    // Формируем текст объявления по шаблону
    const messageText = formatAdMessage(adData)

    // Публикуем в канал
    const message = await bot.api.sendPhoto(config.CHANNEL_ID, adData.photo, {
      caption: messageText.length > 1024 ? messageText.slice(0, 1020) + '...' : messageText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📲 Подать объявление',
              url: 'https://t.me/myautoboard_bot/autoboard'
            }
          ]
        ]
      }
    })




    // Если премиум тариф - закрепляем сообщение
    if (adData.tariff.id.includes('premium') || adData.tariff.id === 'vip') {
      await bot.api.pinChatMessage(config.CHANNEL_ID, message.message_id)
    }

    logger.info(`Ad published to channel: ${adData.id}`, {
      adId: adData.id,
      messageId: message.message_id,
      tariff: adData.tariff.id
    })

    res.json({
      success: true,
      messageId: message.message_id,
      channelId: config.CHANNEL_ID
    })

  } catch (error) {
    logger.error('Failed to publish ad:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to publish advertisement'
    })
  }
})

// Удаление объявления из канала
router.post('/remove', async (req, res) => {
  try {
    const { messageId } = req.body

    await bot.api.deleteMessage(config.CHANNEL_ID, messageId)

    res.json({ success: true })
  } catch (error) {
    logger.error('Failed to remove ad:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to remove advertisement'
    })
  }
})

// Форматирование текста объявления
function formatAdMessage(ad: AdData): string {
  let message = `🚗 **${ad.brand} ${ad.model}`
  
  if (ad.modification) {
    message += ` ${ad.modification}`
  }
  
  message += `**\n**${ad.year}**\n`

  if (ad.engine && ad.power) {
    message += `**${ad.engine} (${ad.power} л.с.)**\n`
  }

  message += `**${ad.mileage} тыс. км**\n`

  if (ad.drivetrain) {
    message += `**${ad.drivetrain}**\n`
  }

  if (ad.description) {
    message += `**${ad.description}**\n`
  }

  if (ad.city) {
    message += `${ad.city}\n`
  }

  message += `💰 **${ad.price}**\n`

  // Добавляем контакты только если они должны отображаться
  if (ad.showPhone && ad.phone) {
    message += `📞 **${ad.phone}**\n`
  }

  if (ad.showTelegram && ad.telegram) {
    message += `📨 **@${ad.telegram}**\n`
  }

  // Добавляем информацию о тарифе для VIP
  if (ad.tariff.id === 'vip') {
    message += `\n⭐ **VIP ОБЪЯВЛЕНИЕ** ⭐`
  }

  return message
}

export default router