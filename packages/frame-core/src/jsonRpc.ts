import type { RpcRequest, RpcResponse, RpcSchema } from 'ox'
import type { Ready } from './actions'
import type { FrameContext } from './context'

export type Schema = RpcSchema.From<
  | {
      Request: {
        method: 'app_context'
        params?: undefined
      }
      ReturnType: FrameContext
    }
  | {
      Request: {
        method: 'app_ready'
        params?: Ready.ReadyOptions
      }
      ReturnType: undefined
    }
>

export type Request = RpcRequest.RpcRequest<Schema>
export type Response = RpcResponse.RpcResponse<Schema>

export type RequestFn = <
  methodName extends RpcSchema.ExtractMethodName<Schema>,
>(
  parameters: RpcSchema.ExtractRequest<Schema, methodName>,
) => Promise<RpcSchema.ExtractReturnType<Schema, methodName>>

export type Transport = {
  request: RequestFn
}

export type RequestHandler = (request: Request) => Promise<Response>
