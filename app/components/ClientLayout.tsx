'use client'

import React from 'react'
import { Toaster } from '@/components/ui/toaster'
import { AdminAuthProvider } from '@/hooks/use-admin-auth'
import { SidebarProvider } from '@/components/ui/sidebar'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Header } from '@/components/ui/header'
import { MobileNav } from '@/components/ui/mobile-nav'
import { AuthProviderGlobal } from '../providers/auth-provider'
import { Footer } from '@/components/ui/footer'
export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderGlobal>
          <SidebarProvider>
            <Header />
            <div className="pt-16 pb-16 md:pb-0">
              <div className="mx-auto">
                {children}
              </div>
            </div>
            <MobileNav />
            <Toaster />
            <Footer />
          </SidebarProvider>
      </AuthProviderGlobal>
    </QueryClientProvider>
  )
} 