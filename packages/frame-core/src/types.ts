import type { Provider, RpcSchema } from "ox";
import { z } from "zod";

export type SetPrimaryButton = (options: {
  text: string;
  loading?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}) => void;

export type EthProviderRequest = Provider.RequestFn<RpcSchema.Default>;

export type AccountLocation = {
  placeId: string;
  /**
   * Human-readable string describing the location
   */
  description: string;
};

export type FrameContext = {
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    /**
     * Profile image URL
     */
    pfpUrl?: string;
  };
};

export const notificationDetailsSchema = z.object({
  url: z.string(),
  token: z.string(),
});
export type FrameNotificationDetails = z.infer<
  typeof notificationDetailsSchema
>;

export type AddFrameResult =
  | {
      added: true;
      notificationDetails?: FrameNotificationDetails;
    }
  | {
      added: false;
      reason: "invalid-domain-manifest" | "rejected-by-user";
    };

export type AddFrame = () => Promise<AddFrameResult>;

export type FrameHost = {
  context: FrameContext;
  close: () => void;
  ready: () => void;
  openUrl: (url: string) => void;
  setPrimaryButton: SetPrimaryButton;
  ethProviderRequest: EthProviderRequest;
  addFrame: AddFrame;
};

// Webhook event format (= JSON Farcaster Signature)

export const eventSchema = z.object({
  header: z.string(),
  payload: z.string(),
  signature: z.string(),
});
export type EventSchema = z.infer<typeof eventSchema>;

// JSON Farcaster Signature header after decoding

export const eventHeaderSchema = z.object({
  fid: z.number(),
  type: z.literal("app_key"),
  key: z.string().startsWith("0x"),
});
export type EventHeader = z.infer<typeof eventHeaderSchema>;

// Webhook event payload after decoding

export const eventFrameAddedPayloadSchema = z.object({
  event: z.literal("frame-added"),
  notificationDetails: notificationDetailsSchema.optional(),
});
export type EventFrameAddedPayload = z.infer<
  typeof eventFrameAddedPayloadSchema
>;

export const eventFrameRemovedPayloadSchema = z.object({
  event: z.literal("frame-removed"),
});
export type EventFrameRemovedPayload = z.infer<
  typeof eventFrameRemovedPayloadSchema
>;

export const eventNotificationsEnabledPayloadSchema = z.object({
  event: z.literal("notifications-enabled"),
  notificationDetails: notificationDetailsSchema.required(),
});
export type EventNotificationsEnabledPayload = z.infer<
  typeof eventNotificationsEnabledPayloadSchema
>;

export const notificationsDisabledPayloadSchema = z.object({
  event: z.literal("notifications-disabled"),
});
export type EventNotificationsDisabledPayload = z.infer<
  typeof notificationsDisabledPayloadSchema
>;

export const eventPayloadSchema = z.discriminatedUnion("event", [
  eventFrameAddedPayloadSchema,
  eventFrameRemovedPayloadSchema,
  eventNotificationsEnabledPayloadSchema,
  notificationsDisabledPayloadSchema,
]);
export type FrameEvent = z.infer<typeof eventPayloadSchema>;

// Notifications API request and response formats

export const sendNotificationRequestSchema = z.object({
  notificationId: z.string().uuid(),
  title: z.string().max(32),
  body: z.string().max(128),
  targetUrl: z.string().max(256),
  tokens: z.string().array().max(100),
});
export type SendNotificationRequest = z.infer<
  typeof sendNotificationRequestSchema
>;

export const sendNotificationResponseSchema = z.object({
  result: z.object({
    successfulTokens: z.array(z.string()),
    invalidTokens: z.array(z.string()),
    rateLimitedTokens: z.array(z.string()),
  }),
});
export type SendNotificationResponse = z.infer<
  typeof sendNotificationResponseSchema
>;
