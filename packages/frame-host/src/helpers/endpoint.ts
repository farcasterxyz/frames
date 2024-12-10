import * as Comlink from "../comlink";
import { FrameHost } from "@farcaster/frame-core";
import { Provider } from "ox";
import { forwardProviderEvents, wrapProviderRequest } from "./provider";
import { HostEndpoint } from "../types";

/**
  * @returns function to clean up provider listeners
  */
export function exposeToEndpoint({ 
  endpoint,
  sdk, 
  frameOrigin,
  ethProvider, 
  debug = false
}: {
  endpoint: HostEndpoint,
  sdk: Omit<FrameHost, 'ethProviderRequestV2'>,
  frameOrigin: string;
  ethProvider?: Provider.Provider,
  debug?: boolean
}) {
  const extendedSdk = sdk as FrameHost;

  let cleanup: () => void | undefined;
  if (ethProvider) {
    extendedSdk.ethProviderRequestV2 = wrapProviderRequest({ provider: ethProvider, debug });
    cleanup = forwardProviderEvents({ provider: ethProvider, endpoint });
  }

  const unexpose = Comlink.expose(extendedSdk, endpoint, [frameOrigin]);

  return () => {
    cleanup?.();
    unexpose();
  }
}
