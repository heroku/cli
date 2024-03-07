import * as fs from 'node:fs/promises'
import type {PathLike} from 'node:fs'

export async function getCertAndKey(args: {CRT: PathLike, KEY: PathLike}) {
  return {
    crt: await fs.readFile(args.CRT, {encoding: 'utf-8'}),
    key: await fs.readFile(args.KEY, {encoding: 'utf-8'}),
  }
}
