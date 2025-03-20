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
    <html lang="tr" >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"></meta>
      </head>
      <body>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  )
} 