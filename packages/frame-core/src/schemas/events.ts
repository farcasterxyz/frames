import { z } from 'zod'
import { notificationDetailsSchema } from './notifications'

export const eventFrameAddedSchema = z.object({
  event: z.literal('frameAdded'),
  notificationDetails: notificationDetailsSchema.optional(),
})

export type EventFrameAdded = z.infer<typeof eventFrameAddedSchema>

export const eventFrameRemovedSchema = z.object({
  event: z.literal('frameRemoved'),
})

export type EventFrameRemoved = z.infer<typeof eventFrameRemovedSchema>

export const eventNotificationsEnabledSchema = z.object({
  event: z.literal('notificationsEnabled'),
  notificationDetails: notificationDetailsSchema.required(),
})

export type EventNotificationsEnabled = z.infer<
  typeof eventNotificationsEnabledSchema
>

export const notificationsDisabledSchema = z.object({
  event: z.literal('notificationsDisabled'),
})

export type EventNotificationsDisabled = z.infer<
  typeof notificationsDisabledSchema
>

export const serverEventSchema = z.discriminatedUnion('event', [
  eventFrameAddedSchema,
  eventFrameRemovedSchema,
  eventNotificationsEnabledSchema,
  notificationsDisabledSchema,
])

export type FrameServerEvent = z.infer<typeof serverEventSchema>
