'use client'

import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import dynamic from 'next/dynamic'

const WagmiProvider = dynamic(
  () => import('~/components/providers/WagmiProvider'),
  {
    ssr: false,
  },
)

export function Providers({
  session,
  children,
}: { session: Session | null; children: React.ReactNode }) {
  return (
    <SessionProvider session={session}>
      <WagmiProvider>{children}</WagmiProvider>
    </SessionProvider>
  )
}
