#!/bin/bash

echo "🚀 Настройка проекта TG-AUTO..."

# Создание .env файла
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Создан .env файл"
    echo "⚠️  Обновите .env файл с вашими данными!"
fi

# Создание .env.local для фронтенда
if [ ! -f "frontend/.env.local" ]; then
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret
EOF
    echo "✅ Создан frontend/.env.local"
fi

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

cd frontend
npm install
cd ..

cd backend
npm install
npx prisma generate
cd ..

# Создание директорий
mkdir -p logs uploads

# Запуск PostgreSQL
echo "🐘 Запуск PostgreSQL..."
docker-compose up -d postgres redis

echo "⏳ Ожидание готовности базы данных..."
sleep 10

# Применение миграций
echo "🗄️ Применение миграций..."
cd backend
npx prisma migrate dev --name init
cd ..

echo "✅ Настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Обновите .env файл с токеном бота"
echo "2. Запустите: npm run dev"
echo "3. Frontend: http://localhost:3000"
echo "4. Backend: http://localhost:3001"