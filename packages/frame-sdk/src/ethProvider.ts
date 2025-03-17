import type {
  EthProviderWireEvent,
  FrameClientEvent,
  MessageChannel,
} from '@farcaster/frame-core'
import type {
  AnnounceProviderParameters,
  AnnounceProviderReturnType,
  EIP1193Provider,
  EIP6963ProviderDetail,
} from 'mipd'
import { Provider, RpcRequest, RpcResponse } from 'ox'
import { frameHost } from './frameHost'
import { transport } from './transport'

const emitter = Provider.createEmitter()
const store = RpcRequest.createStore()

const pendingRequestCallbacks: Record<
  string,
  (response: RpcResponse.RpcResponse) => void
> = {}

export const provider: Provider.Provider = Provider.from({
  ...emitter,
  async request(parameters) {
    return new Promise((resolve, reject) => {
      const request = store.prepare(parameters as never)

      pendingRequestCallbacks[request.id] = (
        response: RpcResponse.RpcResponse,
      ) => {
        try {
          resolve(
            // @ts-expect-error
            RpcResponse.parse(response, {
              request,
            }),
          )
        } catch (error) {
          reject(Provider.parseError(error))
        }
      }

      transport.postMessage({
        source: 'farcaster-eth-provider-request',
        payload: request,
      })
    })
  },
})

function listener(ev: Event) {
  if (!(ev instanceof MessageEvent) || typeof ev.data === 'string') {
    return
  }

  // // TODO: we may want a way to restrict origins
  // // TODO: runtime type check for event types

  if (ev.data.source) {
    const message = ev.data as MessageChannel.HostMessage
    if (message.source === 'farcaster-eth-provider-response') {
      console.log('received eth provider response: ', message.payload)
      const response = message.payload

      const callback = pendingRequestCallbacks[response.id]
      if (callback) {
        delete pendingRequestCallbacks[response.id]
        return callback(response)
      }
    }

    if (message.source === 'farcaster-eth-provider-event') {
      console.log('received eth provider event: ', message.payload)
      const event = message.payload
      emitter.emit(event.event, ...(event.params as never))
      return
    }
  }
}

transport.addEventListener('message', listener)

export function announceProvider(
  detail: AnnounceProviderParameters,
): AnnounceProviderReturnType {
  const event: CustomEvent<EIP6963ProviderDetail> = new CustomEvent(
    'eip6963:announceProvider',
    { detail: Object.freeze(detail) },
  )

  function handler() {
    window.dispatchEvent(event)
  }

  window.dispatchEvent(event)
  window.addEventListener('eip6963:requestProvider', handler)

  return () => {
    window.removeEventListener('eip6963:requestProvider', handler)
  }
}

// Required to pass SSR
if (typeof document !== 'undefined') {
  // forward eip6963:requestProvider events to the host
  document.addEventListener('eip6963:requestProvider', () => {
    frameHost.eip6963RequestProvider()
  })

  // v0 path
  // react native webview events
  document.addEventListener('FarcasterFrameEthProviderEvent', (event) => {
    if (event instanceof MessageEvent) {
      const ethProviderEvent = event.data as EthProviderWireEvent
      // @ts-expect-error
      emitter.emit(ethProviderEvent.event, ...ethProviderEvent.params)
    }
  })

  // v0 path
  document.addEventListener('FarcasterFrameEvent', (event) => {
    if (event instanceof MessageEvent) {
      const frameEvent = event.data as FrameClientEvent
      if (frameEvent.event === 'eip6963:announceProvider') {
        announceProvider({
          info: frameEvent.info,
          provider: provider as EIP1193Provider,
        })
      }
    }
  })
}

// Required to pass SSR
if (typeof window !== 'undefined') {
  // forward eip6963:requestProvider events to the host
  window.addEventListener('eip6963:requestProvider', () => {
    frameHost.eip6963RequestProvider()
  })

  // v0 path
  // web events
  window.addEventListener('message', (event) => {
    if (event instanceof MessageEvent) {
      if (event.data.type === 'frameEthProviderEvent') {
        const ethProviderEvent = event.data as EthProviderWireEvent
        // @ts-expect-error
        emitter.emit(ethProviderEvent.event, ...ethProviderEvent.params)
      }
    }
  })

  // v0 path
  window.addEventListener('message', (event) => {
    if (event instanceof MessageEvent) {
      if (event.data.type === 'frameEvent') {
        const frameEvent = event.data.event as FrameClientEvent
        if (frameEvent.event === 'eip6963:announceProvider') {
          announceProvider({
            info: frameEvent.info,
            provider: provider as EIP1193Provider,
          })
        }
      }
    }
  })
}
