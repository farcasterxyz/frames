import { ImageResponse } from 'next/og'

export const alt = 'Farcaster Frames V2 Demo'
export const size = {
  width: 600,
  height: 400,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <div tw="h-full w-full flex flex-col justify-center items-center relative bg-white">
      <h1 tw="text-6xl">Frames v2 Demo</h1>
    </div>,
    {
      ...size,
    },
  )
}
