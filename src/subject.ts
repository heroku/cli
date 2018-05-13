import * as Config from '@oclif/config'
import * as Parser from '@oclif/parser'

export default abstract class Subject {
  constructor(protected readonly config: Config.IConfig, protected readonly path: string[], protected readonly argv: string[]) {}
  abstract commands(): Promise<{[k: string]: string}>

  parse() {
    return Parser.parse(this.argv, {context: this})
  }
}
