export interface EventSource {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: {},
  ): void

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: {},
  ): void
}

export interface Endpoint extends EventSource {
  postMessage(message: any): void
}
