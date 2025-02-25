import {
  type ParseWebhookEvent,
  type ParseWebhookEventResult,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from '@farcaster/frame-node'
import type { NextRequest } from 'next/server'
import {
  deleteUserNotificationDetails,
  setUserNotificationDetails,
} from '~/lib/kv'
import { sendFrameNotification } from '~/lib/notifs'

export async function POST(request: NextRequest) {
  const requestJson = await request.json()

  let data: ParseWebhookEventResult | undefined
  try {
    data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar)
  } catch (e: unknown) {
    const error = e as ParseWebhookEvent.ErrorType

    switch (error.name) {
      case 'VerifyJsonFarcasterSignature.InvalidDataError':
      case 'VerifyJsonFarcasterSignature.InvalidEventDataError':
        // The request data is invalid
        return Response.json(
          { success: false, error: error.message },
          { status: 400 },
        )
      case 'VerifyJsonFarcasterSignature.InvalidAppKeyError':
        // The app key is invalid
        return Response.json(
          { success: false, error: error.message },
          { status: 401 },
        )
      case 'VerifyJsonFarcasterSignature.VerifyAppKeyError':
        // Internal error verifying the app key (caller may want to try again)
        return Response.json(
          { success: false, error: error.message },
          { status: 500 },
        )
    }
  }

  const fid = data.fid
  const event = data.event

  switch (event.event) {
    case 'frame_added':
      if (event.notificationDetails) {
        await setUserNotificationDetails(fid, event.notificationDetails)
        await sendFrameNotification({
          fid,
          title: 'Welcome to Frames v2',
          body: 'Frame is now added to your client',
        })
      } else {
        await deleteUserNotificationDetails(fid)
      }

      break
    case 'frame_removed':
      await deleteUserNotificationDetails(fid)

      break
    case 'notifications_enabled':
      await setUserNotificationDetails(fid, event.notificationDetails)
      await sendFrameNotification({
        fid,
        title: 'Ding ding ding',
        body: 'Notifications are now enabled',
      })

      break
    case 'notifications_disabled':
      await deleteUserNotificationDetails(fid)

      break
  }

  return Response.json({ success: true })
}
