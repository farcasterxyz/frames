import {
  AddFrame,
  JsonRpc,
  type MessageChannel,
  Provider,
  SignIn,
} from '@farcaster/frame-core'
import type { EIP1193Provider } from 'mipd'
import { endpoint } from './endpoint'
import { announceProvider } from './ethProvider'
import * as EthProvider from './ethProvider'
import { frameHost } from './frameHost'
import type { FrameSDK } from './types'

const emitter = Provider.createEmitter()

const pendingRequestCallbacks: Record<string, (response: never) => void> = {}

const transport = JsonRpc.createTransport({
  async request(request) {
    return new Promise((resolve, reject) => {
      pendingRequestCallbacks[request.id] = (response) => {
        try {
          resolve(response)
        } catch (e) {
          reject(e)
        }
      }

      endpoint.postMessage({
        source: 'farcaster-mini-app-request',
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
    if (message.source === 'farcaster-host-response') {
      const response = message.payload

      const callback = pendingRequestCallbacks[response.id]
      if (callback) {
        delete pendingRequestCallbacks[response.id]
        return callback(response as never)
      }
    }

    if (message.source === 'farcaster-host-event') {
      const payload = message.payload

      if (payload.event === 'eip6963:announceProvider') {
        announceProvider({
          info: payload.info,
          provider: EthProvider.provider as EIP1193Provider,
        })
        return
      }

      const { event, ...data } = payload
      emitter.emit(event, data as never)
      return
    }

    if (message.source === 'farcaster-eth-provider-event') {
      const event = message.payload
      emitter.emit(event.event as never, ...(event.params as never))
      return
    }
  }
}

endpoint.addEventListener('message', listener)

export const sdk: FrameSDK = {
  ...emitter,
  get context() {
    return transport.request({ method: 'app_context' })
  },
  actions: {
    add() {
      return transport.request({ method: 'app_add' })
    },
    async ready() {
      return await transport.request({ method: 'app_ready' })
    },
    setPrimaryButton: frameHost.setPrimaryButton.bind(frameHost),
    close: frameHost.close.bind(frameHost),
    viewProfile: frameHost.viewProfile.bind(frameHost),
    viewToken: frameHost.viewToken.bind(frameHost),
    swap: frameHost.swap.bind(frameHost),
    signIn: async (options) => {
      const response = await frameHost.signIn(options)
      if (response.result) {
        return response.result
      }

      if (response.error.type === 'rejected_by_user') {
        throw new SignIn.RejectedByUser()
      }

      throw new Error('Unreachable')
    },
    openUrl: (url: string) => {
      return frameHost.openUrl(url.trim())
    },
    addFrame: async () => {
      const response = await frameHost.addFrame()
      if (response.result) {
        return response.result
      }

      if (response.error.type === 'invalid_domain_manifest') {
        throw new AddFrame.InvalidDomainManifest()
      }

      if (response.error.type === 'rejected_by_user') {
        throw new AddFrame.RejectedByUser()
      }

      throw new Error('Unreachable')
    },
  },
  wallet: {
    ethProvider: EthProvider.provider,
  },
}
