'use client'

import { AuthProvider } from "@/hooks/use-auth"
import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

export function AuthProviderGlobal({ children }: { children: ReactNode }) {
  return <SessionProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </SessionProvider>
} 