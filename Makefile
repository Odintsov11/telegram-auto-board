.PHONY: setup dev build clean help

setup:
	chmod +x create-project.sh
	./create-project.sh

dev:
	npm run dev

build:
	npm run build

clean:
	docker-compose down
	docker system prune -f

install:
	npm install
	cd frontend && npm install
	cd backend && npm install

db-reset:
	cd backend && npx prisma migrate reset --force

help:
	@echo "Доступные команды:"
	@echo "  setup  - Первоначальная настройка"
	@echo "  dev    - Запуск разработки"
	@echo "  build  - Сборка для продакшена"
	@echo "  clean  - Очистка Docker"