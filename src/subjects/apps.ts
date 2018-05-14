import Subject from '../subject'

export class AppsSubject extends Subject {
  async commands(): Promise<{[k: string]: string}> {
    if (this.path.length > 1) {
      return {
        info: '@apps/info'
      }
    } else {
      return {
        list: '@apps/list'
      }
    }
  }
}
