import type {PathLike} from 'node:fs'

import * as fs from 'node:fs/promises'

export class CertAndKeyManager {
  async getCertAndKey(args: {CRT: PathLike, KEY: PathLike}) {
    return {
      crt: await fs.readFile(args.CRT, {encoding: 'utf8'}),
      key: await fs.readFile(args.KEY, {encoding: 'utf8'}),
    }
  }
}
