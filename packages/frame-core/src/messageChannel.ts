import { RpcRequest, RpcResponse } from 'ox'
import type { EthProviderWireEvent, FrameClientEvent, JsonRpc } from '.'

export interface EventSource {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: {},
  ): void

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: {},
  ): void
}

export interface MessageChannel extends EventSource {
  postMessage(message: any): void
}

export type HostResponseMessage = {
  source: 'farcaster-host-response'
  payload: RpcResponse.RpcResponse
}

export type HostEventMessage = {
  source: 'farcaster-host-event'
  payload: FrameClientEvent
}

export type MiniAppRequestMessage = {
  source: 'farcaster-mini-app-request'
  payload: RpcRequest.RpcRequest
}

export type EthProviderRequestMessage = {
  source: 'farcaster-eth-provider-request'
  payload: RpcRequest.RpcRequest
}

export type EthProviderResponseMessage = {
  source: 'farcaster-eth-provider-response'
  payload: RpcResponse.RpcResponse
}

export type EthProviderEvent = {
  source: 'farcaster-eth-provider-event'
  payload: EthProviderWireEvent
}

export type HostMessage =
  | HostResponseMessage
  | HostEventMessage
  | EthProviderResponseMessage
  | EthProviderEvent

export type MiniAppMessage = MiniAppRequestMessage | EthProviderRequestMessage
