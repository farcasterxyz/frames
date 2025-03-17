import type { JsonRpc, WireFrameHost, FrameHost } from '@farcaster/frame-core'
import { RpcResponse, type Provider } from 'ox'
import { exposeToEndpoint, listenToEndpoint } from './helpers/endpoint'
import type { HostEndpoint } from './types'
import { wrapHandlers } from './helpers/sdk'
import { forwardProviderEvents, wrapProviderRequest } from './helpers/provider'
import { createHandleRequest } from './host'

/**
 * An endpoint of communicating with an iFrame
 */
export function createIframeEndpoint({
  iframe,
  targetOrigin,
  debug = true,
}: {
  iframe: HTMLIFrameElement
  targetOrigin: string
  debug?: boolean
}): HostEndpoint {
  return {
    postMessage: (msg: unknown) => {
      iframe.contentWindow?.postMessage(msg, targetOrigin)
    },
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    emit: (event) => {
      if (debug) {
        console.debug('frameEvent', event)
      }

      const wireEvent = {
        type: 'frameEvent',
        event,
      }

      // v0 path
      iframe.contentWindow?.postMessage(wireEvent, targetOrigin)

      // v1 path
      iframe.contentWindow?.postMessage(
        {
          source: 'farcaster-mini-app-host-event',
          payload: event,
        },
        targetOrigin,
      )
    },
    emitEthProvider: (event, params) => {
      if (debug) {
        console.debug('fc:emitEthProvider', event, params)
      }

      const wireEvent = {
        type: 'frameEthProviderEvent',
        event,
        params,
      }

      iframe.contentWindow?.postMessage(wireEvent, targetOrigin)
    },
  }
}

export function exposeToIframe({
  iframe,
  sdk,
  ethProvider,
  frameOrigin,
  debug = false,
}: {
  iframe: HTMLIFrameElement
  sdk: Omit<FrameHost, 'ethProviderRequestV2'>
  frameOrigin: string
  ethProvider?: Provider.Provider
  debug?: boolean
}) {
  const endpoint = createIframeEndpoint({
    iframe,
    targetOrigin: frameOrigin,
    debug,
  })

  const comlinkCleanup = exposeToEndpoint({
    endpoint,
    sdk,
    ethProvider,
    frameOrigin,
    debug,
  })

  const extendedSdk = wrapHandlers(sdk as FrameHost)
  if (ethProvider) {
    extendedSdk.ethProviderRequestV2 = wrapProviderRequest({
      provider: ethProvider,
      debug,
    })
  }

  const providerCleanup = (() => {
    if (ethProvider) {
      return forwardProviderEvents({ provider: ethProvider, endpoint })
    }
  })()

  const handleRequest = createHandleRequest({
    sdk: extendedSdk,
  })

  const disconnect = listenToEndpoint({
    endpoint,
    frameOrigin,
    handleRequest,
  })

  return {
    endpoint,
    cleanup: () => {
      disconnect()
      comlinkCleanup()
      providerCleanup?.()
    },
  }
}
