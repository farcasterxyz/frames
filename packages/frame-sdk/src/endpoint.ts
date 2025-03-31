import { type Channel, Util } from '@farcaster/frame-core'

const mockEndpoint: Channel.Endpoint = {
  postMessage() {
    // noop
  },
  addEventListener: () => {
    // noop
  },
  removeEventListener: () => {
    // noop
  },
}

function isWebview(window: Window) {
  return (
    typeof window !== 'undefined' &&
    !!window.ReactNativeWebView &&
    window.top === window
  )
}

export function webviewEndpoint(): Channel.Endpoint {
  return {
    postMessage: (message: unknown) => {
      window.ReactNativeWebView.postMessage(Util.stringify(message))
    },
    addEventListener: (_, listener, ...args) => {
      document.addEventListener('message', listener, ...args)
    },
    removeEventListener: (_, listener) => {
      document.removeEventListener('message', listener)
    },
  }
}

export function iframeEndpoint(
  options: Partial<{ targetOrigin: string }> = {},
): Channel.Endpoint {
  return {
    postMessage: (message: unknown) => {
      window.parent.postMessage(message, options.targetOrigin ?? '*')
    },
    addEventListener: (_, listener, ...args) => {
      window.addEventListener('message', listener, ...args)
    },
    removeEventListener: (_, listener) => {
      window.removeEventListener('message', listener)
    },
  }
}

export const endpoint = (() => {
  // Assume SSR, return a mock endpoint
  if (typeof window === 'undefined') return mockEndpoint
  if (isWebview(window)) return webviewEndpoint()

  return iframeEndpoint()
})()
