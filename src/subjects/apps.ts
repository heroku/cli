import Subject from '../subject'

export class AppsSubject extends Subject {
  async commands() {
    return {
      list: '@apps/list'
    }
  }
}
