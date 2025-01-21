import type {
  AddFrame,
  Context,
  FrameNotificationDetails,
  ReadyOptions,
  SetPrimaryButtonOptions,
  SignIn,
  ViewProfile,
} from '@farcaster/frame-core'
import type { EventEmitter } from 'eventemitter3'
import type { Provider } from 'ox'

declare global {
  interface Window {
    // Exposed by react-native-webview
    ReactNativeWebView: {
      postMessage: (message: string) => void
    }
  }
}

/** Combines members of an intersection into a readable type. */
// https://x.com/mattpocockuk/status/1622730173446557697?s=20&t=v01xkqU3KO0Mg
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

type SetPrimaryButton = (options: SetPrimaryButtonOptions) => Promise<void>

export type FrameSDK = {
  context: Promise<Context.FrameContext>
  actions: {
    ready: (options?: Partial<ReadyOptions>) => Promise<void>
    openUrl: (url: string) => Promise<void>
    close: () => Promise<void>
    setPrimaryButton: SetPrimaryButton
    addFrame: AddFrame.AddFrame
    signIn: SignIn.SignIn
    viewProfile: ViewProfile.ViewProfile
  }
  wallet: {
    ethProvider: Provider.Provider
  }
} & Emitter
