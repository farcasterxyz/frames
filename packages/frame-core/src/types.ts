import type {
  AddFrame,
  Ready,
  SignIn,
  Swap,
  ViewProfile,
  ViewToken,
} from './actions'
import type { FrameContext } from './context'
import type {
  EventFrameAdded,
  EventFrameRemoved,
  EventNotificationsDisabled,
  EventNotificationsEnabled,
} from './schemas'
import type { Ethereum } from './wallet'

export type SetPrimaryButtonOptions = {
  text: string
  loading?: boolean
  disabled?: boolean
  hidden?: boolean
}

// start backwards compat, remove in 1.0
export * from './wallet/ethereum'
export { DEFAULT_READY_OPTIONS, ReadyOptions } from './actions/Ready'
export type SignInOptions = SignIn.SignInOptions
// end backwards compat

export type SetPrimaryButton = (options: SetPrimaryButtonOptions) => void

export type WireFrameHost = {
  context: FrameContext
  close: () => void
  ready: Ready.Ready
  openUrl: (url: string) => void
  signIn: SignIn.WireSignIn
  setPrimaryButton: SetPrimaryButton
  ethProviderRequest: Ethereum.EthProvideRequest
  ethProviderRequestV2: Ethereum.RpcTransport
  eip6963RequestProvider: () => void
  addFrame: AddFrame.WireAddFrame
  viewProfile: ViewProfile.ViewProfile
  viewToken: ViewToken.ViewToken
  swap: Swap.Swap
}

export type FrameHost = {
  context: FrameContext
  close: () => void
  ready: Ready.Ready
  openUrl: (url: string) => void
  signIn: SignIn.SignIn
  setPrimaryButton: SetPrimaryButton
  ethProviderRequest: Ethereum.EthProvideRequest
  ethProviderRequestV2: Ethereum.RpcTransport
  /**
   * Receive forwarded eip6963:requestProvider events from the frame document.
   * Hosts must emit an EventEip6963AnnounceProvider in response.
   */
  eip6963RequestProvider: () => void
  addFrame: AddFrame.AddFrame
  viewProfile: ViewProfile.ViewProfile
  viewToken: ViewToken.ViewToken
  swap: Swap.Swap
}

export type EventFrameAddRejected = {
  event: 'frameAddRejected'
  reason: AddFrame.AddFrameRejectedReason
}

export type EventPrimaryButtonClicked = {
  event: 'primaryButtonClicked'
}

export type FrameClientEvent =
  | EventFrameAdded
  | EventFrameAddRejected
  | EventFrameRemoved
  | EventNotificationsEnabled
  | EventNotificationsDisabled
  | EventPrimaryButtonClicked
  | Ethereum.EventEip6963AnnounceProvider

export type FrameHostEventMessage = {
  source: 'frame-host-event'
  payload: FrameClientEvent
}
