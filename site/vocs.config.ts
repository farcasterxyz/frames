import { defineConfig } from 'vocs'

const PRODUCTION_URL = 'https://deodad-frames.vercel.app'

export default defineConfig({
  baseUrl: process.env.VERCEL_URL ?? PRODUCTION_URL,
  font: {
    google: 'Inter',
  },
  rootDir: '.',
  title: 'Farcaster Mini Apps',
  titleTemplate: '%s · Farcaster Mini Apps',
  // editLink: {
  //   pattern: 'https://github.com/farcasterxyz/frames/edit/main/site/pages/:path',
  //   text: 'Edit on GitHub'
  // },
  logoUrl: {
    light: '/logo-light.svg',
    dark: '/logo-dark.svg',
  },
  ogImageUrl:
    'https://og-five-eta.vercel.app/api/og?logo=https://%logo&title=%title&description=%description',
  theme: {
    accentColor: '#8a63d2',
  },
  topNav: [
    {
      text: 'Examples',
      link: 'https://github.com/farcasterxyz/frames/tree/main/examples',
    },
    { text: 'Rewards', link: 'https://warpcast.com/~/developers/rewards' },
  ],
  sidebar: {
    '/': [
      {
        text: 'Introduction',
        items: [
          {
            text: 'Why Mini Apps?',
            link: '/',
          },
          {
            text: 'Getting Started',
            link: '/docs/getting-started',
          },
          {
            text: 'LLMs',
            link: '/docs/llms',
          },
        ],
      },
      {
        text: 'Guides',
        items: [
          {
            text: 'Publishing your app',
            link: '/docs/guides/publishing',
          },
          {
            text: 'Sharing your app',
            link: '/docs/guides/sharing',
          },
          {
            text: 'Interacting with wallets',
            link: '/docs/guides/wallets',
          },
          {
            text: 'Sending notifications',
            link: '/docs/guides/notifications',
          },
          {
            text: 'Authenticating users',
            link: '/docs/guides/embeds',
          },
        ],
      },
      {
        text: 'API',
        items: [
          {
            text: 'Context',
            link: '/docs/context',
          },
          {
            text: 'Wallet',
            link: '/docs/wallet',
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
            text: 'Events',
            link: '/docs/events',
          },
        ],
      },
      {
        text: 'Reference',
        collapsed: true,
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
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/farcasterxyz/frames',
    },
    {
      icon: 'x',
      link: 'https://x.com/farcaster_xyz',
    },
  ],
})
