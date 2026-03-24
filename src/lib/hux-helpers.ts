import * as hux from '@heroku/heroku-cli-util/hux'

export class HuxHelpers {
  static confirm(message: string): Promise<boolean> {
    return hux.confirm(message)
  }

  static prompt(message: string, options?: any): Promise<string> {
    return hux.prompt(message, options)
  }

  static wait(ms: number): Promise<void> {
    return hux.wait(ms)
  }

  static styledHeader(header: string): void {
    return hux.styledHeader(header)
  }

  static table(data: any[], options?: any): void {
    hux.table(data, options)
  }

  static styledObject(obj: any, keys?: string[]): void {
    hux.styledObject(obj, keys)
  }
}
