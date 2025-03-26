# Frame React

A React context provider and hook that make it easier to build Farcaster frames.

## Install

Install using your favorite package manager:

```bash
npm install @farcaster/frame-react @farcaster/frame-sdk
```

## Usage

Basic implementation in a Next.js app (assumes you've already added [@farcaster/frame-wagmi-connector](https://www.npmjs.com/package/@farcaster/frame-wagmi-connector) to `wagmiConfig`):

```tsx
// ClientProviders.tsx
'use client'

import { FrameProvider } from '@farcaster/frame-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

import { wagmiConfig } from '@/lib/web3'

const queryClient = new QueryClient()

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FrameProvider>{children}</FrameProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

Wrap the entire app (`layout.tsx`), or just the frame routes, in our new provider:

```tsx
import type { Metadata } from 'next'

import { ClientProviders } from '@/components/ClientProviders'

export const metadata: Metadata = {
  title: 'Farcaster Frames v2 Demo',
  description: 'A Farcaster Frames v2 demo app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
```

Then from any client component:

```tsx
// page.tsx
'use client'

import { useFrame } from '@farcaster/frame-react'

export default function Page() {
  const frameContext = useFrame()

  return <div>Hello {frameContext?.user.username}</div>
}
```
