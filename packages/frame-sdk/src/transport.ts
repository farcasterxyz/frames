import { type MessageChannel, Util } from '@farcaster/frame-core'

const mockEndpoint: MessageChannel.MessageChannel = {
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
  return !!window.ReactNativeWebView && window.top === window
}

export function webviewTransport(): MessageChannel.MessageChannel {
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

export function iframeTransport(
  options: Partial<{ targetOrigin: string }> = {},
): MessageChannel.MessageChannel {
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

export const transport = (() => {
  // Assume SSR, return a mock endpoint
  if (typeof window === 'undefined') return mockEndpoint
  if (isWebview(window)) return webviewTransport()

  return iframeTransport()
})()
