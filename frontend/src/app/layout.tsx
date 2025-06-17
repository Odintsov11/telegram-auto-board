import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Авто Доска - Telegram Mini App',
  description: 'Создавайте и управляйте объявлениями о продаже автомобилей',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}
