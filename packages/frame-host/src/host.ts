import { type WireFrameHost, Provider } from '@farcaster/frame-core'
import { RpcResponse } from 'ox'

export function fromSDK({
  sdk,
}: {
  sdk: WireFrameHost
}): Provider.Provider {
  const emitter = Provider.createEmitter()

  // @ts-expect-error
  return {
    ...emitter,
    async request({ method }) {
      try {
        switch (method) {
          case 'app_context':
            return sdk.context as never
          case 'app_ready':
            return sdk.ready() as never
          default:
            throw new RpcResponse.MethodNotSupportedError()
        }
      } catch (e) {
        if (e instanceof RpcResponse.BaseError) {
          throw e
        }

        // TODO message?
        throw new RpcResponse.InternalError()
      }
    },
  }
}

// // SDK to wire functions
// export function handleJsonRpc({ request }) {
//         const request = ev.data.payload as JsonRpc.Request

//       const result = await (async () => {
//         try {
//           const result = await frameProvider.request(request)

//           return {
//             id: request.id,
//             jsonrpc: request.jsonrpc,
//             result,
//           }
//         } catch (e) {
//           if (e instanceof RpcResponse.BaseError) {
//             return {
//               id: request.id,
//               jsonrpc: request.jsonrpc,
//               error: {
//                 code: e.code,
//                 message: e.message,
//                 data: e.data,
//               },
//             }
//           }
//         }
//       })()
// }
