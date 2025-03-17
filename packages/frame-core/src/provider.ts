import { EventEmitter } from 'eventemitter3'
import type { AddFrame } from './actions'
import type { FrameNotificationDetails } from './schemas'
import type { Schema } from './jsonRpc'
import type { RpcSchema } from 'ox'

// https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=v01xkqU3KO0Mg
type Compute<type> = { [key in keyof type]: type[key] } & unknown

export type EventMap = {
  primaryButtonClicked: () => void
  frameAdded: ({
    notificationDetails,
  }: {
    notificationDetails?: FrameNotificationDetails
  }) => void
  frameAddRejected: ({
    reason,
  }: { reason: AddFrame.AddFrameRejectedReason }) => void
  frameRemoved: () => void
  notificationsEnabled: ({
    notificationDetails,
  }: {
    notificationDetails: FrameNotificationDetails
  }) => void
  notificationsDisabled: () => void
}

export type Emitter = Compute<EventEmitter<EventMap>>

export type EventListenerFn = <event extends keyof EventMap>(
  event: event,
  listener: EventMap[event],
) => void

export type RequestFn = <
  methodName extends RpcSchema.ExtractMethodName<Schema>,
>(
  parameters: RpcSchema.ExtractRequest<Schema, methodName>,
) => Promise<RpcSchema.ExtractReturnType<Schema, methodName>>

export type Provider = Compute<{
  request: RequestFn
  on: EventListenerFn
  removeListener: EventListenerFn
}>

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
