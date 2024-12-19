import FrameSDK from '@farcaster/frame-sdk'
import { SwitchChainError, fromHex, getAddress, numberToHex } from 'viem'
import { ChainNotConfiguredError, Connector, createConnector } from '@wagmi/core'

farcasterFrame.type = 'farcasterFrame' as const

let accountsChanged: Connector['onAccountsChanged'] | undefined
let chainChanged: Connector['onChainChanged'] | undefined
let disconnect: Connector['onDisconnect'] | undefined

export function farcasterFrame() {
  let connected = true

  return createConnector<typeof FrameSDK.wallet.ethProvider>((config) => ({
    id: 'farcaster',
    name: 'Farcaster Frame',
    rdns: 'xyz.farcaster',
    icon: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/055c25d6-7fe7-4a49-abf9-49772021cf00/original',
    type: farcasterFrame.type,

    async setup() {
      this.connect({ chainId: config.chains[0].id })
    },
    async connect({ chainId } = {}) {
      const provider = await this.getProvider()
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      })

      if (!accountsChanged) {
        accountsChanged = this.onAccountsChanged.bind(this)
        // @ts-expect-error - provider type is stricter
        provider.on('accountsChanged', accountsChanged)
      }
      if (!chainChanged) {
        chainChanged = this.onChainChanged.bind(this)
        provider.on('chainChanged', chainChanged)
      }
      if (!disconnect) {
        disconnect = this.onDisconnect.bind(this)
        provider.on('disconnect', disconnect)
      }

      let currentChainId = await this.getChainId()
      if (chainId && currentChainId !== chainId) {
        const chain = await this.switchChain!({ chainId })
        currentChainId = chain.id
      }

      connected = true

      return {
        accounts: accounts.map((x) => getAddress(x)),
        chainId: currentChainId,
      }
    },
    async disconnect() {
      const provider = await this.getProvider()

      if (accountsChanged) {
        // @ts-expect-error - provider type is stricter
        provider.removeListener('accountsChanged', accountsChanged)
        accountsChanged = undefined
      }

      if (chainChanged) {
        provider.removeListener('chainChanged', chainChanged)
        chainChanged = undefined
      }

      if (disconnect) {
        provider.removeListener('disconnect', disconnect)
        disconnect = undefined
      }

      connected = false
    },
    async getAccounts() {
      if (!connected) {
        throw new Error('Not connected')
      }
      const provider = await this.getProvider()
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      })
      return accounts.map((x) => getAddress(x))
    },
    async getChainId() {
      const provider = await this.getProvider()
      const hexChainId = await provider.request({ method: 'eth_chainId' })
      return fromHex(hexChainId, 'number')
    },
    async isAuthorized() {
      if (!connected) {
        return false
      }

      const accounts = await this.getAccounts()
      return !!accounts.length
    },
    async switchChain({ chainId }) {
      const provider = await this.getProvider()
      const chain = config.chains.find((x) => x.id === chainId)
      if (!chain) {
        throw new SwitchChainError(new ChainNotConfiguredError())
      }

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: numberToHex(chainId) }],
      })

      // providers should start emitting these events - remove when hosts have upgraded
      //
      // explicitly emit this event as a workaround for ethereum provider not
      // emitting events, can remove once events are flowing
      config.emitter.emit('change', { chainId })

      return chain
    },
    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect()
      } else {
        config.emitter.emit('change', {
          accounts: accounts.map((x) => getAddress(x)),
        })
      }
    },
    onChainChanged(chain) {
      const chainId = Number(chain)
      config.emitter.emit('change', { chainId })
    },
    async onDisconnect() {
      config.emitter.emit('disconnect')
      connected = false
    },
    async getProvider() {
      return FrameSDK.wallet.ethProvider
    },
  }))
}
