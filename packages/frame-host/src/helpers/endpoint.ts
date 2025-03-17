import { Util, type FrameHost, type JsonRpc } from '@farcaster/frame-core'
import type { Provider, RpcRequest, RpcResponse } from 'ox'
import { useEffect } from 'react'
import * as Comlink from '../comlink'
import type { HostEndpoint } from '../types'
import { wrapProviderRequest } from './provider'
import { wrapHandlers } from './sdk'

export function listenToEndpoint({
  endpoint,
  frameOrigin,
  handleRequest,
}: {
  endpoint: HostEndpoint
  frameOrigin: string
  handleRequest: (
    request: RpcRequest.RpcRequest,
  ) => Promise<RpcResponse.RpcResponse>
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
      endpoint.postMessage({
        source: 'farcaster-mini-app-response',
        payload: await handleRequest(ev.data.payload as JsonRpc.Request),
      })
    }
  }

  window.addEventListener('message', listener)

  return () => {
    window.removeEventListener('message', listener)
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
  ethProvider?: Provider.Provider
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
  ethProvider?: Provider.Provider
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
