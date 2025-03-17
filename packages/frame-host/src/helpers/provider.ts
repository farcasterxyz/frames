import { Provider, type RpcRequest, RpcResponse } from 'ox'
import type { HostEndpoint } from '../types'
import { Util, type MessageChannel } from '@farcaster/frame-core'

export function forwardProviderEvents({
  provider,
  endpoint,
}: {
  provider: Provider.Provider
  endpoint: HostEndpoint
}) {
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

  provider.on('accountsChanged', accountsChanged)
  provider.on('chainChanged', chainChanged)
  provider.on('connect', connect)
  provider.on('disconnect', disconnect)
  provider.on('message', message)

  return () => {
    provider.removeListener('accountsChanged', accountsChanged)
    provider.removeListener('chainChanged', chainChanged)
    provider.removeListener('connect', connect)
    provider.removeListener('disconnect', disconnect)
    provider.removeListener('message', message)
  }
}

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
          console.log('thrown', e)
          if (
            e instanceof RpcResponse.BaseError ||
            e instanceof Provider.ProviderRpcError
          ) {
            console.log('provider errro', e)
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

          console.log('THIS IS CACUGHT', e)

          // TODO actually just return unknown
          throw e
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

/**
 * Wraps a provider's request function with a result format that can transfer
 * errors across scripting boundaries.
 */
export const wrapProviderRequest =
  ({
    provider,
    debug = false,
  }: {
    provider: Provider.Provider
    debug?: boolean
  }) =>
  async (request: RpcRequest.RpcRequest) => {
    try {
      if (debug) {
        console.debug('[frame-host] eth provider req: ', request)
      }
      const result = await provider.request(request)
      const response = RpcResponse.from({ result }, { request })

      if (debug) {
        console.debug('[frame-host] eth provider res: ', response)
      }

      return response
    } catch (e) {
      if (debug) {
        console.error('provider request error', e)
      }
      if (e instanceof Provider.ProviderRpcError) {
        return RpcResponse.from(
          {
            error: {
              message: e.message,
              code: e.code,
              details: e.details,
            },
          },
          { request },
        )
      }

      if (
        e !== null &&
        typeof e === 'object' &&
        'message' in e &&
        typeof e.message === 'string' &&
        'code' in e &&
        typeof e.code === 'number'
      ) {
        return RpcResponse.from(
          {
            error: {
              message: e.message,
              code: e.code,
              details:
                'details' in e && typeof e.details === 'string'
                  ? e.details
                  : undefined,
            },
          },
          { request },
        )
      }

      const errorMessage = e instanceof Error ? e.message : 'Unknown'
      return RpcResponse.from(
        {
          error: {
            message: errorMessage,
            code: 1000,
          },
        },
        { request },
      )
    }
  }
