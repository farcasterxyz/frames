import { sdk } from '@farcaster/frame-sdk'
import { createStore } from 'mipd'

const store = createStore()

let providers = store.getProviders()
store.subscribe((providerDetails) => {
  providers = providerDetails
  console.debug('updated providers', providers)
})

setTimeout(() => {
  sdk.actions.ready()

  Promise.race([
    sdk.context,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('timed out waiting context'))
      }, 50)
    }),
  ])
    .then((ctx) => {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log(ctx)
    })
    .catch((e) => {
      console.warn(e.message)
    })

  document.querySelector<HTMLDivElement>('#sign')!.onclick = () => {
    sdk.wallet.ethProvider
      .request({ method: 'eth_requestAccounts' })
      .then((addresses) => {
        return sdk.wallet.ethProvider.request({
          method: 'personal_sign',
          params: [
            '0x48656c6c6f2066726f6d2056616e696c6c61204672616d65',
            addresses[0],
          ],
        })
      })
      .then((signature) => {
        alert('You signed:\n' + signature)
      })
  }

  document.querySelector<HTMLDivElement>('#close')!.onclick = () => {
    sdk.actions.close()
  }
}, 750)
