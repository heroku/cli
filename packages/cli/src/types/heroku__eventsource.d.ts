declare module '@heroku/eventsource' {
  export default class EventSource {
    constructor(url: string, options?: {proxy?: string; headers?: Record<string, string>})
    addEventListener(type: 'error', listener: (event: {status?: number; message?: string | null}) => void): void
    addEventListener(type: 'message', listener: (event: {data: string}) => void): void
    close(): void
  }
}
