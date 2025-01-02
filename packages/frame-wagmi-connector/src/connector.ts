import FrameSDK from "@farcaster/frame-sdk";
import {
  ChainNotConfiguredError,
  type Connector,
  createConnector,
} from "@wagmi/core";
import { SwitchChainError, fromHex, getAddress, numberToHex } from "viem";

// Define the type constant for the connector
farcasterFrame.type = "farcasterFrame" as const;

let accountsChanged: Connector["onAccountsChanged"] | undefined;
let chainChanged: Connector["onChainChanged"] | undefined;
let disconnect: Connector["onDisconnect"] | undefined;

export function farcasterFrame() {
  let connected = false; // Ensure the initial state reflects disconnection

  return createConnector<typeof FrameSDK.wallet.ethProvider>((config) => ({
    id: "farcaster",
    name: "Farcaster Frame",
    rdns: "xyz.farcaster",
    icon: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/055c25d6-7fe7-4a49-abf9-49772021cf00/original",
    type: farcasterFrame.type,

    // Setup method to initialize the connection
    async setup() {
      await this.connect({ chainId: config.chains[0]?.id });
    },

    // Connect method with enhanced error handling
    async connect({ chainId } = {}) {
      const provider = await this.getProvider();

      try {
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });

        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this);
          provider.on("accountsChanged", accountsChanged);
        }

        if (!chainChanged) {
          chainChanged = this.onChainChanged.bind(this);
          provider.on("chainChanged", chainChanged);
        }

        if (!disconnect) {
          disconnect = this.onDisconnect.bind(this);
          provider.on("disconnect", disconnect);
        }

        let currentChainId = await this.getChainId();
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain!({ chainId });
          currentChainId = chain.id;
        }

        connected = true;

        return {
          accounts: accounts.map((x:any) => getAddress(x)),
          chainId: currentChainId,
        };
      } catch (error) {
        console.error("Error during connection:", error);
        throw new Error("Failed to connect to the provider.");
      }
    },

    // Disconnect method with reset logic
    async disconnect() {
      const provider = await this.getProvider();

      if (accountsChanged) {
        provider.removeListener("accountsChanged", accountsChanged);
        accountsChanged = undefined;
      }

      if (chainChanged) {
        provider.removeListener("chainChanged", chainChanged);
        chainChanged = undefined;
      }

      if (disconnect) {
        provider.removeListener("disconnect", disconnect);
        disconnect = undefined;
      }

      connected = false;
    },

    // Method to fetch accounts
    async getAccounts() {
      if (!connected) {
        throw new Error("Not connected");
      }

      const provider = await this.getProvider();
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      return accounts.map((x:any) => getAddress(x));
    },

    // Method to get the current chain ID
    async getChainId() {
      const provider = await this.getProvider();
      const hexChainId = await provider.request({ method: "eth_chainId" });
      return fromHex(hexChainId, "number");
    },

    // Check if the user is authorized
    async isAuthorized() {
      if (!connected) {
        return false;
      }

      const accounts = await this.getAccounts();
      return accounts.length > 0;
    },

    // Method to switch chains
    async switchChain({ chainId }) {
      const provider = await this.getProvider();
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) {
        throw new SwitchChainError(new ChainNotConfiguredError());
      }

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: numberToHex(chainId) }],
        });

        // Emit chain change event explicitly
        config.emitter.emit("change", { chainId });

        return chain;
      } catch (error) {
        console.error("Error during chain switch:", error);
        throw new Error("Failed to switch chains.");
      }
    },

    // Event handler for account changes
    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect();
      } else {
        config.emitter.emit("change", {
          accounts: accounts.map((x) => getAddress(x)),
        });
      }
    },

    // Event handler for chain changes
    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },

    // Event handler for disconnection
    async onDisconnect() {
      config.emitter.emit("disconnect");
      connected = false;
    },

    // Fetch the provider instance
    async getProvider() {
      if (!FrameSDK.wallet.ethProvider) {
        throw new Error(
          "Provider not initialized. Ensure FrameSDK is properly configured."
        );
      }
      return FrameSDK.wallet.ethProvider;
    },

    // Additional utility: validate chain support
    async validateChainSupport(chainId: any) {
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) {
        throw new ChainNotConfiguredError();
      }
      return chain;
    },
  }));
}
