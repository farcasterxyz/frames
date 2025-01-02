import { z } from 'zod'
import {
  buttonTitleSchema,
  encodedJsonFarcasterSignatureSchema,
  frameNameSchema,
  hexColorSchema,
  secureUrlSchema,
} from './shared'

export const domainFrameConfigSchema = z.object({
  // 0.0.0 and 0.0.1 are not technically part of the spec but kept for
  // backwards compatibility. next should always resolve to the most recent
  // schema version.
  version: z.union([
    z.literal('0.0.0'),
    z.literal('0.0.1'),
    z.literal('1'),
    z.literal('next'),
  ]),
  name: frameNameSchema,
  iconUrl: secureUrlSchema,
  homeUrl: secureUrlSchema,
  imageUrl: secureUrlSchema.optional(),
  buttonTitle: buttonTitleSchema.optional(),
  splashImageUrl: secureUrlSchema.optional(),
  splashBackgroundColor: hexColorSchema.optional(),
  webhookUrl: secureUrlSchema.optional(),
})

export const domainManifestSchema = z.object({
  accountAssociation: encodedJsonFarcasterSignatureSchema,
  frame: domainFrameConfigSchema.optional(),
})
