import type {
  AddFrame,
  Context,
  Ready,
  SetPrimaryButtonOptions,
  SignIn,
  Swap,
  ViewProfile,
  ViewToken,
  Provider,
} from '@farcaster/frame-core'
import type { Provider as EthProvider } from 'ox'

declare global {
  interface Window {
    // Exposed by react-native-webview
    ReactNativeWebView: {
      postMessage: (message: string) => void
    }
  }
}

type SetPrimaryButton = (options: SetPrimaryButtonOptions) => Promise<void>

export type FrameSDK = {
  context: Promise<Context.FrameContext>
  actions: {
    ready: (options?: Partial<Ready.ReadyOptions>) => Promise<void>
    openUrl: (url: string) => Promise<void>
    close: () => Promise<void>
    setPrimaryButton: SetPrimaryButton
    addFrame: AddFrame.AddFrame
    signIn: SignIn.SignIn
    viewProfile: ViewProfile.ViewProfile
    viewToken: ViewToken.ViewToken
    swap: Swap.Swap
  }
  wallet: {
    ethProvider: EthProvider.Provider
  }
} & Provider.Emitter
