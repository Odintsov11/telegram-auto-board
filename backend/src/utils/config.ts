import dotenv from 'dotenv'

dotenv.config()

export const config = {
  BOT_TOKEN: process.env.BOT_TOKEN!,
  CHANNEL_ID: process.env.CHANNEL_ID!,
  WEBAPP_URL: process.env.WEBAPP_URL!,
  
  DATABASE_URL: process.env.DATABASE_URL!,
  
  API_PORT: parseInt(process.env.API_PORT || '3001'),
  
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
}

// Проверка обязательных переменных
const requiredVars = ['BOT_TOKEN', 'CHANNEL_ID', 'WEBAPP_URL']
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
}