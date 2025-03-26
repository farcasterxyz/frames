import { createContext, useContext, useEffect, useState } from 'react'
import frameSDK from '@farcaster/frame-sdk'
import type { FrameContext, ReadyOptions } from '@farcaster/frame-core'

interface FrameProviderProps {
  children: React.ReactNode
  config?: ReadyOptions
}

const Context = createContext<FrameContext | undefined>(undefined)

export function FrameProvider({ children, config }: FrameProviderProps) {
  const [isFrameSDKLoaded, setIsFrameSDKLoaded] = useState(false)
  const [context, setContext] = useState<FrameContext>()

  useEffect(() => {
    const load = async () => {
      setContext(await frameSDK.context)
      frameSDK.actions.ready(config)
    }

    if (frameSDK && !isFrameSDKLoaded) {
      setIsFrameSDKLoaded(true)
      load()
    }
  }, [isFrameSDKLoaded])

  return <Context.Provider value={context}>{children}</Context.Provider>
}

export function useFrame() {
  return useContext(Context)
}
