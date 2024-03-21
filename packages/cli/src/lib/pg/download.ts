
import * as fs from 'fs-extra'
import * as Path from 'path'
const https = require('https')
const bytes = require('bytes')
const progress = require('smooth-progress')

type downloadOptions = {
  progress: boolean
}

export default function download(url: string, path: string, opts: downloadOptions) {
  const tty = process.stderr.isTTY && process.env.TERM !== 'dumb'

  function showProgress(rsp: any) {
    const bar = progress({
      tmpl: `Downloading ${path}... :bar :percent :eta :data`,
      width: 25,
      total: Number.parseInt(rsp.headers['content-length'], 10),
    })
    let total = 0
    rsp.on('data', function (chunk: string) {
      total += chunk.length
      bar.tick(chunk.length, {data: bytes(total, {decimalPlaces: 2, fixedDecimals: 2})})
    })
  }

  return new Promise(function (resolve, reject) {
    fs.mkdirSync(Path.dirname(path), {recursive: true})
    const file = fs.createWriteStream(path)
    https.get(url, function (rsp: any) {
      if (tty && opts.progress) showProgress(rsp)
      rsp.pipe(file)
        .on('error', reject)
        .on('close', resolve)
    })
  })
}
