#!/bin/bash

echo "🔧 Исправление зависимостей проекта TG-AUTO..."

# Переходим в корень проекта
cd "$(dirname "$0")"

echo "📦 Установка корневых зависимостей..."
npm install turbo --save-dev

echo "📦 Установка зависимостей frontend..."
cd frontend
npm install next@14.0.0 react@18.2.0 react-dom@18.2.0 
npm install --save-dev typescript @types/node @types/react @types/react-dom
npm install --save-dev tailwindcss autoprefixer postcss eslint eslint-config-next

# Создание недостающих файлов
echo "📄 Создание next-env.d.ts..."
cat > next-env.d.ts << 'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

echo "📄 Создание postcss.config.js..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo "📦 Установка зависимостей backend..."
cd ../backend
npm install grammy@1.18.1 @grammyjs/runner@2.0.3
npm install express@4.18.2 cors@2.8.5 helmet@7.0.0
npm install dotenv@16.3.1 winston@3.10.0 sharp@0.32.4
npm install node-cron@3.0.2 zod@3.21.4
npm install @prisma/client@5.1.1 prisma@5.1.1

npm install --save-dev typescript @types/node @types/express @types/cors
npm install --save-dev tsx@3.12.7

echo "🗄️ Генерация Prisma клиента..."
npx prisma generate

echo "📄 Исправление turbo.json..."
cd ..
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {}
  }
}
EOF

echo "📄 Создание .env файла..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# Telegram Bot Configuration
BOT_TOKEN=your_bot_token_here
CHANNEL_ID=@your_channel_username
WEBAPP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://auto_board_user:auto_board_password@localhost:5432/auto_board"

# API Configuration  
API_PORT=3001
FRONTEND_PORT=3000

# Security
JWT_SECRET=your-jwt-secret-key

# Development
NODE_ENV=development
LOG_LEVEL=info
EOF
    echo "✅ Создан .env файл"
fi

echo "📄 Создание frontend/.env.local..."
if [ ! -f "frontend/.env.local" ]; then
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret
EOF
    echo "✅ Создан frontend/.env.local"
fi

echo "📁 Создание директорий..."
mkdir -p logs uploads

echo "🐘 Запуск PostgreSQL..."
docker-compose up -d postgres

echo "⏳ Ожидание готовности базы данных..."
sleep 15

echo "🗄️ Применение миграций..."
cd backend
npx prisma migrate dev --name init --skip-generate
cd ..

echo "✅ Все исправлено!"
echo ""
echo "🚀 Теперь можете запустить:"
echo "npm run dev"
echo ""
echo "📋 URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"