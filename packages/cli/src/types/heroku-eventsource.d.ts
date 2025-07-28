declare module '@heroku/eventsource' {
  interface EventSourceOptions {
    proxy?: string
    headers?: Record<string, string>
  }

  class EventSource {
    constructor(url: string, options?: EventSourceOptions)
    addEventListener(type: string, listener: (event: any) => void): void
    close(): void
  }

  export = EventSource
}
