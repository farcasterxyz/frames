import { type MessageChannel, Util } from '@farcaster/frame-core'
import { Provider, RpcResponse } from 'ox'
import type { HostEndpoint } from './types'

export function exposeProvider({
  endpoint,
  frameOrigin,
  provider: externalProvider,
}: {
  endpoint: HostEndpoint
  frameOrigin: string
  provider: any
}) {
  const provider = Provider.from(externalProvider)

  async function listener(ev: MessageEvent) {
    if (!ev || !ev.data) {
      return
    }

    if (!Util.isAllowedOrigin([frameOrigin], ev.origin)) {
      return
    }

    const message = ev.data as MessageChannel.MiniAppMessage
    if (message.source === 'farcaster-eth-provider-request') {
      const result = await (async () => {
        const request = message.payload

        try {
          // it's important to understand that this isn't a raw provider
          const result = await provider.request(message.payload)

          return {
            id: request.id,
            jsonrpc: request.jsonrpc,
            result,
          }
        } catch (e) {
          if (
            e instanceof RpcResponse.BaseError ||
            e instanceof Provider.ProviderRpcError
          ) {
            return {
              id: request.id,
              jsonrpc: request.jsonrpc,
              error: {
                code: e.code,
                message: e.message,
                data: 'data' in e ? e.data : undefined,
              },
            }
          }

          return {
            id: request.id,
            jsonrpc: request.jsonrpc,
            error: {
              code: RpcResponse.InternalError.code,
              message: `Internal error: ${e}`,
            },
          }
        }
      })()

      endpoint.postMessage({
        source: 'farcaster-eth-provider-response',
        payload: result,
      })
    }
  }

  window.addEventListener('message', listener)

  const accountsChanged: Provider.EventMap['accountsChanged'] = (accounts) => {
    endpoint.emitEthProvider('accountsChanged', [accounts])
  }
  const chainChanged: Provider.EventMap['chainChanged'] = (chainId) => {
    endpoint.emitEthProvider('chainChanged', [chainId])
  }
  const connect: Provider.EventMap['connect'] = (connectInfo) => {
    endpoint.emitEthProvider('connect', [connectInfo])
  }
  const disconnect: Provider.EventMap['disconnect'] = (providerRpcError) => {
    endpoint.emitEthProvider('disconnect', [providerRpcError])
  }
  const message: Provider.EventMap['message'] = (message) => {
    endpoint.emitEthProvider('message', [message])
  }

  externalProvider.on('accountsChanged', accountsChanged)
  externalProvider.on('chainChanged', chainChanged)
  externalProvider.on('connect', connect)
  externalProvider.on('disconnect', disconnect)
  externalProvider.on('message', message)

  return () => {
    window.removeEventListener('message', listener)
    externalProvider.removeListener('accountsChanged', accountsChanged)
    externalProvider.removeListener('chainChanged', chainChanged)
    externalProvider.removeListener('connect', connect)
    externalProvider.removeListener('disconnect', disconnect)
    externalProvider.removeListener('message', message)
  }
}
