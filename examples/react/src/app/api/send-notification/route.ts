import { notificationDetailsSchema } from '@farcaster/frame-sdk'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { setUserNotificationDetails } from '~/lib/kv'
import { sendFrameNotification } from '~/lib/notifs'

const requestSchema = z.object({
  fid: z.number(),
  notificationDetails: notificationDetailsSchema,
})

export async function POST(request: NextRequest) {
  const requestJson = await request.json()
  const requestBody = requestSchema.safeParse(requestJson)

  if (requestBody.success === false) {
    return Response.json(
      { success: false, errors: requestBody.error.errors },
      { status: 400 },
    )
  }

  await setUserNotificationDetails(
    requestBody.data.fid,
    requestBody.data.notificationDetails,
  )

  const sendResult = await sendFrameNotification({
    fid: requestBody.data.fid,
    title: 'Test notification',
    body: 'Sent at ' + new Date().toISOString(),
  })

  if (sendResult.state === 'error') {
    return Response.json(
      { success: false, error: sendResult.error },
      { status: 500 },
    )
  }
  if (sendResult.state === 'rate_limit') {
    return Response.json(
      { success: false, error: 'Rate limited' },
      { status: 429 },
    )
  }

  return Response.json({ success: true })
}
