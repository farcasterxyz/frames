import type { EmitEthProvider, FrameClientEvent } from '@farcaster/frame-core'
import type { Endpoint } from './comlink'

export type HostEndpoint = Endpoint & {
  /**
   * @deprecated
   */
  emit: (event: FrameClientEvent) => void
  /**
   * @deprecated
   */
  emitEthProvider: EmitEthProvider
}
