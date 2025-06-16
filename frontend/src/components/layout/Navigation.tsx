'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, History, Settings } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()

  const items = [
    { href: '/', label: 'Главная', icon: Home },
    { href: '/create', label: 'Создать', icon: Plus },
    { href: '/history', label: 'История', icon: History },
    { href: '/settings', label: 'Настройки', icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}