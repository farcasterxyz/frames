import type { FrameHost, MessageChannel } from '@farcaster/frame-core'
import type { Provider } from 'ox'
import { exposeProvider } from './appProvider'
import { exposeProvider as exposeEthProvider } from './ethProvider'
import { fromHost } from './host'
import type { HostEndpoint } from './types'
import { exposeToEndpoint } from './v0/endpoint'
import { wrapProviderRequest } from './v0/provider'
import { wrapHandlers } from './v0/sdk'

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
          source: 'farcaster-host-event',
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

      // v0 path
      iframe.contentWindow?.postMessage(wireEvent, targetOrigin)

      // v1 path
      iframe.contentWindow?.postMessage(
        {
          source: 'farcaster-eth-provider-event',
          payload: {
            event,
            params,
          },
        },
        targetOrigin,
      )
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

  endpoint.addEventListener('message', (ev) => {
    if (
      !(ev instanceof MessageEvent) ||
      typeof ev.data !== 'object' ||
      !('source' in ev.data)
    ) {
      return
    }

    const message = ev.data as MessageChannel.MiniAppMessage
    if (message.source === 'farcaster-mini-app-request') {
      return
    }

    if (message.source === 'farcaster-eth-provider-request') {
      return
    }
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

  const unexposeEthProvider = (() => {
    if (ethProvider) {
      return exposeEthProvider({
        endpoint,
        frameOrigin,
        provider: ethProvider,
      })
    }
  })()

  const frameProvider = fromHost({
    host: extendedSdk,
  })

  const unexposeProvider = exposeProvider({
    endpoint,
    frameOrigin,
    frameProvider,
  })

  return {
    endpoint,
    cleanup: () => {
      unexposeProvider()
      unexposeEthProvider?.()
      comlinkCleanup()
    },
  }
}
