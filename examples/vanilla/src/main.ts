import { type FrameHost, exposeToIframe } from '@farcaster/frame-host'
import './style.css'

declare global {
  interface Window {
    ethereum: any
  }
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="container">
    <div id="splash"></div>
    <iframe src="/frame/" id="iframe" height="695" width="424" style="border:none;" />
  </div>
`

const announceProvider = () => {
  endpoint.emit({
    event: 'eip6963:announceProvider',
    info: {
      name: 'Vanilla Frame',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
      rdns: 'com.example.VanillaFrameHost',
      uuid: '1395b549-854c-48c4-96af-5a58012196e5',
    },
  })
}

const frameHost: FrameHost = {
  ready: (_options) => {
    document.querySelector<HTMLDivElement>('#splash')!.hidden = true
  },
  context: {
    user: {
      fid: 0,
    },
  },
  eip6963RequestProvider: () => {
    announceProvider()
  },
} as FrameHost

const { endpoint } = exposeToIframe({
  iframe: document.querySelector<HTMLIFrameElement>('#iframe')!,
  sdk: frameHost,
  ethProvider: window.ethereum,
  frameOrigin: window.origin,
  debug: true,
})
