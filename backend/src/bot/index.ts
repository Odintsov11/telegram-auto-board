import { Bot } from 'grammy'
import { config } from '../utils/config'
import { logger } from '../utils/logger'

// Создание бота
const bot = new Bot(config.BOT_TOKEN)

// Команда /start
bot.command('start', async (ctx) => {
  try {
    const user = ctx.from
    if (!user) return

    logger.info(`User started bot: ${user.id} (${user.username})`)

    const keyboard = {
      inline_keyboard: [[
        {
          text: '🚗 Создать объявление',
          web_app: { url: config.WEBAPP_URL }
        }
      ]]
    }

    await ctx.reply(
      '🚗 *Добро пожаловать в Авто Доску!*\n\n' +
      'Создавайте и управляйте объявлениями о продаже автомобилей\\.\n\n' +
      '✨ *Возможности:*\n' +
      '• Создание объявлений с фото\n' +
      '• Автоматическая публикация в канале\n' +
      '• Закрепление объявлений\n' +
      '• Статистика просмотров',
      {
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard
      }
    )
  } catch (error) {
    logger.error('Start command error:', error)
    await ctx.reply('Произошла ошибка. Попробуйте позже.')
  }
})

// Обработка данных из WebApp
bot.on('message:web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.message.web_app_data.data)
    logger.info('Received WebApp data:', data)

    // Здесь будет обработка данных из Mini App
    await ctx.reply('✅ Данные получены! Обработка...')
  } catch (error) {
    logger.error('WebApp data error:', error)
    await ctx.reply('❌ Ошибка при обработке данных')
  }
})

// Обработка ошибок
bot.catch((err) => {
  logger.error('Bot error:', err)
})

// Запуск бота
async function startBot() {
  try {
    logger.info('Starting Telegram bot...')
    
    // Устанавливаем команды бота
    await bot.api.setMyCommands([
      { command: 'start', description: 'Запустить бота' }
    ])

    // Запускаем polling
    await bot.start()
    logger.info('Bot started successfully')
  } catch (error) {
    logger.error('Failed to start bot:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  logger.info('Received SIGINT, stopping bot...')
  bot.stop()
})

process.once('SIGTERM', () => {
  logger.info('Received SIGTERM, stopping bot...')
  bot.stop()
})

startBot()