import React from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { ReduxProvider } from './redux/provider'

export const metadata: Metadata = {
  title: 'İlan Daddy',
  description: 'İlan yönetim sistemi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  )
} 