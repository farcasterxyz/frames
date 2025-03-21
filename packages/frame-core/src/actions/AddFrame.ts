import * as Errors from '../errors'
import type { OneOf } from '../internal/types'
import type { FrameNotificationDetails } from '../schemas'

export type AddFrameResult = {
  notificationDetails?: FrameNotificationDetails
}

export type AddFrame = () => Promise<AddFrameResult>

type InvalidDomainManifestJsonError = {
  type: 'invalid_domain_manifest'
}

type RejectedByUserJsonError = {
  type: 'rejected_by_user'
}

export type AddFrameJsonError =
  | InvalidDomainManifestJsonError
  | RejectedByUserJsonError

export type AddFrameRejectedReason = AddFrameJsonError['type']

export type AddFrameJsonResult = OneOf<
  { result: AddFrameResult } | { error: AddFrameJsonError }
>

export type WireAddFrame = () => Promise<AddFrameJsonResult>

/**
 * Thrown when the frame does not have a valid domain manifest.
 */
export class InvalidDomainManifest extends Errors.BaseError {
  override readonly name = 'AddFrame.InvalidDomainManifest'

  constructor() {
    super('Invalid domain manifest')
  }
}

/**
 * Thrown when add frame action was rejected by the user.
 */
export class RejectedByUser extends Errors.BaseError {
  override readonly name = 'AddFrame.RejectedByUser'

  constructor() {
    super('Add frame rejected by user')
  }
}
