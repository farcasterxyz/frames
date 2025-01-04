import { AddFrame, type FrameClientEvent, SignIn } from "@farcaster/frame-core";
import { EventEmitter } from "eventemitter3";
import { frameHost } from "./frameHost";
import { provider } from "./provider";
import type { Emitter, EventMap, FrameSDK } from "./types";

export function createEmitter(): Emitter {
  const emitter = new EventEmitter<EventMap>();

  return {
    get eventNames() {
      return emitter.eventNames.bind(emitter);
    },
    get listenerCount() {
      return emitter.listenerCount.bind(emitter);
    },
    get listeners() {
      return emitter.listeners.bind(emitter);
    },
    addListener: emitter.addListener.bind(emitter),
    emit: emitter.emit.bind(emitter),
    off: emitter.off.bind(emitter),
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
  };
}

const emitter = createEmitter();

export const sdk: FrameSDK = {
  ...emitter,
  context: frameHost.context,
  actions: {
    setPrimaryButton: frameHost.setPrimaryButton.bind(frameHost),
    ready: frameHost.ready.bind(frameHost),
    close: frameHost.close.bind(frameHost),
    signIn: async (options) => {
      const response = await frameHost.signIn(options);
      if (response.result) {
        return response.result;
      }

      if (response.error?.type === "rejected_by_user") {
        throw new SignIn.RejectedByUser();
      }

      throw new Error("Unreachable");
    },
    openUrl: (url: string) => {
      return frameHost.openUrl(url.trim());
    },
    addFrame: async () => {
      const response = await frameHost.addFrame();
      if (response.added) {
        return response.notificationDetails; // Assuming this is what you want to return
      }

      switch (response.reason) {
        case "invalid_domain_manifest":
          throw new AddFrame.InvalidDomainManifest();
        case "rejected_by_user":
          throw new AddFrame.RejectedByUser();
        default:
          throw new Error("Unreachable");
      }
    },
  },
  wallet: {
    ethProvider: provider,
  },
};

// Required to pass SSR
if (typeof document !== "undefined") {
  // react native webview events
  document.addEventListener("FarcasterFrameEvent", (event) => {
    if (event instanceof MessageEvent) {
      const frameEvent = event.data as FrameClientEvent;
      if (frameEvent.event === "primary_button_clicked") {
        emitter.emit("primaryButtonClicked");
      } else if (frameEvent.event === "frame_added") {
        emitter.emit("frameAdded", {
          notificationDetails: frameEvent.notificationDetails,
        });
      } else if (frameEvent.event === "frame_add_rejected") {
        emitter.emit("frameAddRejected", { reason: frameEvent.reason });
      } else if (frameEvent.event === "frame_removed") {
        emitter.emit("frameRemoved");
      } else if (frameEvent.event === "notifications_enabled") {
        emitter.emit("notificationsEnabled", {
          notificationDetails: frameEvent.notificationDetails,
        });
      } else if (frameEvent.event === "notifications_disabled") {
        emitter.emit("notificationsDisabled");
      }
    }
  });
}

// Required to pass SSR
if (typeof window !== "undefined") {
  // web events
  window.addEventListener("message", (event) => {
    if (event instanceof MessageEvent) {
      if (event.data.type === "frameEvent") {
        const frameEvent = event.data.event as FrameClientEvent;
        if (frameEvent.event === "primary_button_clicked") {
          emitter.emit("primaryButtonClicked");
        } else if (frameEvent.event === "frame_added") {
          emitter.emit("frameAdded", {
            notificationDetails: frameEvent.notificationDetails,
          });
        } else if (frameEvent.event === "frame_add_rejected") {
          emitter.emit("frameAddRejected", { reason: frameEvent.reason });
        } else if (frameEvent.event === "frame_removed") {
          emitter.emit("frameRemoved");
        } else if (frameEvent.event === "notifications_enabled") {
          emitter.emit("notificationsEnabled", {
            notificationDetails: frameEvent.notificationDetails,
          });
        } else if (frameEvent.event === "notifications_disabled") {
          emitter.emit("notificationsDisabled");
        }
      }
    }
  });
}
