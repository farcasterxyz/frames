import {
  AddFrame,
  type FrameClientEvent,
  type JsonRpc,
  SignIn,
} from '@farcaster/frame-core'
import { EventEmitter } from 'eventemitter3'
import { frameHost } from './frameHost'
import { provider } from './provider'
import type { Emitter, EventMap, FrameSDK } from './types'
import { transport } from './transport'
import { RpcRequest, type RpcSchema } from 'ox'

export function createEmitter(): Emitter {
  const emitter = new EventEmitter<EventMap>()

  return {
    get eventNames() {
      return emitter.eventNames.bind(emitter)
    },
    get listenerCount() {
      return emitter.listenerCount.bind(emitter)
    },
    get listeners() {
      return emitter.listeners.bind(emitter)
    },
    addListener: emitter.addListener.bind(emitter),
    emit: emitter.emit.bind(emitter),
    off: emitter.off.bind(emitter),
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
  }
}

const emitter = createEmitter()

const pendingRequestCallbacks: Record<
  string,
  (response: JsonRpc.Response) => void
> = {}

const store = RpcRequest.createStore<JsonRpc.Schema>()

export const request = <
  methodName extends RpcSchema.ExtractMethodName<JsonRpc.Schema>,
>(
  parameters: RpcSchema.ExtractRequest<JsonRpc.Schema, methodName>,
): Promise<RpcSchema.ExtractReturnType<JsonRpc.Schema, methodName>> => {
  return new Promise((resolve, reject) => {
    // @ts-expect-error
    const request = store.prepare<methodName>(parameters)
    transport.postMessage(request)

    const handleResponse = (response: JsonRpc.Response) => {
      try {
        resolve(
          // @ts-expect-error
          RpcResponse.parse<JsonRpc.Response, unknown, true>(response, {
            request,
          }),
        )
      } catch (e) {
        reject(e)
      }
    }

    pendingRequestCallbacks[request.id] = handleResponse
  })
}

function listener(ev: MessageEvent) {
  if (!ev || !ev.data || typeof ev.data === 'string') {
    return
  }

  // // TODO: we may want a way to restrict origins
  // // TODO: runtime type check for event types

  if (ev.data.source) {
    if (ev.data.source === 'farcaster-mini-app-response') {
      const response = ev.data.payload as JsonRpc.Response
      console.log('received frame host response: ', response)

      const callback = pendingRequestCallbacks[response.id]
      if (callback) {
        delete pendingRequestCallbacks[response.id]
        return callback(response)
      }
    }

    if (ev.data.source === 'farcaster-mini-app-host-event') {
      const frameEvent = ev.data.payload as FrameClientEvent
      console.log('received frame host event: ', frameEvent)
      if (frameEvent.event === 'primary_button_clicked') {
        emitter.emit('primaryButtonClicked')
      } else if (frameEvent.event === 'frame_added') {
        emitter.emit('frameAdded', {
          notificationDetails: frameEvent.notificationDetails,
        })
      } else if (frameEvent.event === 'frame_add_rejected') {
        emitter.emit('frameAddRejected', { reason: frameEvent.reason })
      } else if (frameEvent.event === 'frame_removed') {
        emitter.emit('frameRemoved')
      } else if (frameEvent.event === 'notifications_enabled') {
        emitter.emit('notificationsEnabled', {
          notificationDetails: frameEvent.notificationDetails,
        })
      } else if (frameEvent.event === 'notifications_disabled') {
        emitter.emit('notificationsDisabled')
      }
    }
  }
}

// @ts-expect-error
transport.addEventListener('', listener)

export const sdk: FrameSDK = {
  ...emitter,
  get context() {
    return request({ method: 'app_context' })
  },
  actions: {
    async ready() {
      return await request({ method: 'app_ready' })
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
    ethProvider: provider,
  },
}
