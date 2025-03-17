import {
  type FrameHost,
  type JsonRpc,
  type Provider,
  Util,
} from '@farcaster/frame-core'
import { type Provider as EthProvider, RpcResponse } from 'ox'
import { useEffect } from 'react'
import * as Comlink from '../comlink'
import type { HostEndpoint } from '../types'
import { wrapProviderRequest } from './provider'
import { wrapHandlers } from './sdk'

const farcasterHostEventTypes = [
  'frameAdded',
  'frameAddRejected',
  'frameRemoved',
  'notificationsEnabled',
  'notificationsDisabled',
] as const

export function exposeProvider({
  endpoint,
  frameOrigin,
  frameProvider,
}: {
  endpoint: HostEndpoint
  frameOrigin: string
  frameProvider: Provider.Provider
}) {
  async function listener(ev: MessageEvent) {
    if (!ev || !ev.data) {
      return
    }

    if (!Util.isAllowedOrigin([frameOrigin], ev.origin)) {
      return
    }

    // TODO better runtime checks, share
    if (ev.data.source && ev.data.source === 'farcaster-mini-app-request') {
      const request = ev.data.payload as JsonRpc.Request

      const result = await (async () => {
        try {
          const result = await frameProvider.request(request)

          return {
            id: request.id,
            jsonrpc: request.jsonrpc,
            result,
          }
        } catch (e) {
          if (e instanceof RpcResponse.BaseError) {
            return {
              id: request.id,
              jsonrpc: request.jsonrpc,
              error: {
                code: e.code,
                message: e.message,
                data: e.data,
              },
            }
          }
        }
      })()

      endpoint.postMessage({
        source: 'farcaster-host-response',
        payload: result,
      })
    }
  }

  window.addEventListener('message', listener)

  const removeListeners = farcasterHostEventTypes.map((type) => {
    function handleEvent(event: any) {
      endpoint.postMessage({
        source: 'farcaster-host-event',
        payload: {
          type,
          ...event,
        },
      })
    }

    frameProvider.on(type, handleEvent)

    return () => {
      frameProvider.removeListener(type, handleEvent)
    }
  })

  return () => {
    window.removeEventListener('message', listener)
    for (const removeListener of removeListeners) {
      removeListener()
    }
  }
}

/**
 * @returns function to cleanup provider listeners
 */
export function exposeToEndpoint({
  endpoint,
  sdk,
  frameOrigin,
  ethProvider,
  debug = false,
}: {
  endpoint: HostEndpoint
  sdk: Omit<FrameHost, 'ethProviderRequestV2'>
  frameOrigin: string
  ethProvider?: EthProvider.Provider
  debug?: boolean
}) {
  const extendedSdk = wrapHandlers(sdk as FrameHost)

  if (ethProvider) {
    extendedSdk.ethProviderRequestV2 = wrapProviderRequest({
      provider: ethProvider,
      debug,
    })
  }

  return Comlink.expose(extendedSdk, endpoint, [frameOrigin])
}

export function useExposeToEndpoint({
  endpoint,
  sdk,
  frameOrigin,
  ethProvider,
  debug = false,
}: {
  endpoint: HostEndpoint | undefined
  sdk: Omit<FrameHost, 'ethProviderRequestV2'>
  frameOrigin: string
  ethProvider?: EthProvider.Provider
  debug?: boolean
}) {
  useEffect(() => {
    if (!endpoint) {
      return
    }

    const cleanup = exposeToEndpoint({
      endpoint,
      sdk,
      frameOrigin,
      ethProvider,
      debug,
    })

    return cleanup
  }, [endpoint, sdk, ethProvider, frameOrigin, debug])
}
