import { defineConfig } from 'vocs'

export default defineConfig({
  baseUrl: process.env.VERCEL_URL,
  rootDir: '.',
  title: 'Farcaster Frames',
  topNav: [
    { text: 'Docs', link: '/docs', match: '/docs' },
    {
      text: 'Examples',
      link: 'https://github.com/farcasterxyz/frames/tree/main/examples',
    },
    { text: 'Rewards', link: 'https://warpcast.com/~/developers/rewards' },
  ],
  sidebar: {
    '/docs': [
      {
        text: 'Introduction',
        items: [
          {
            text: 'Why Frames?',
            link: '/docs',
          },
          {
            text: 'Getting Started',
            link: '/docs/getting-started',
          },
        ],
      },
      {
        text: 'Guides',
        items: [
          {
            text: 'Manifest',
            link: '/docs/manifest',
          },
          {
            text: 'Embeds',
            link: '/docs/embeds',
          },
          {
            text: 'Context',
            link: '/docs/context',
          },
          {
            text: 'Wallet',
            link: '/docs/wallet',
          },
          {
            text: 'Auth',
            link: '/docs/auth',
          },
          {
            text: 'Notifications',
            link: '/docs/notifications',
          },
          {
            text: 'Events',
            link: '/docs/events',
          },
        ],
      },
      {
        text: 'Actions',
        collapsed: true,
        items: [
          {
            text: 'ready',
            link: '/docs/actions/ready',
          },
          {
            text: 'addFrame',
            link: '/docs/actions/add-frame',
          },
          {
            text: 'signIn',
            link: '/docs/actions/sign-in',
          },
          {
            text: 'openUrl',
            link: '/docs/actions/open-url',
          },
          {
            text: 'viewProfile',
            link: '/docs/actions/view-profile',
          },
          {
            text: 'close',
            link: '/docs/actions/close',
          },
        ],
      },
      {
        text: 'Reference',
        items: [
          {
            text: 'Specification',
            link: '/docs/specification',
          },
          {
            text: 'Warpcast Intents',
            link: 'https://docs.farcaster.xyz/reference/warpcast/cast-composer-intents',
          },
        ],
      },
    ],
  },
})
