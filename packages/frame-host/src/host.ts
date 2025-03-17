import { type RpcRequest, RpcResponse } from 'ox'
import type { WireFrameHost } from '@farcaster/frame-core'

export function createHandleRequest({
  sdk,
}: {
  sdk: WireFrameHost
}) {
  return async function handleRequest(
    request: RpcRequest.RpcRequest,
  ): Promise<RpcResponse.RpcResponse> {
    try {
      const result = await (async () => {
        try {
          switch (request.method) {
            case 'app_context':
              return sdk.context
            case 'app_ready':
              return sdk.ready() ?? undefined
            default:
              throw new RpcResponse.MethodNotSupportedError()
          }
        } catch (e) {
          if (e instanceof RpcResponse.BaseError) {
            throw e
          }

          throw new RpcResponse.InternalError()
        }
      })()

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

      throw e
    }
  }
}

// SDK to wire functions
