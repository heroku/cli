declare module '@heroku/eventsource' {
  export default class EventSource {
    constructor(url: string, options?: any);
    close(): void;
    addEventListener(type: string, listener: (event: any) => void): void;
  }
}
