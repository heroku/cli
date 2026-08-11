import cliProgress from 'cli-progress'
import fs from 'fs-extra'
import {HttpsProxyAgent} from 'https-proxy-agent'
import https from 'node:https'
import Path from 'node:path'

type downloadOptions = {
  progress: boolean
}

export default function download(url: string, path: string, opts: downloadOptions) {
  const tty = process.stderr.isTTY && process.env.TERM !== 'dumb'

  function showProgress(rsp: any) {
    const bar = new cliProgress.SingleBar({
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      format: `Downloading ${path}... |{bar}| {percentage}% | ETA: {eta}s | {value}/{total} bytes`,
    })
    bar.start(Number.parseInt(rsp.headers['content-length'], 10), 0)
    let total = 0
    rsp.on('data', (chunk: string) => {
      total += chunk.length
      bar.update(total)
    })
    rsp.on('end', () => {
      bar.stop()
    })
  }

  return new Promise((resolve, reject) => {
    fs.mkdirSync(Path.dirname(path), {recursive: true})
    const file = fs.createWriteStream(path)
    const proxy = process.env.https_proxy || process.env.HTTPS_PROXY
    const options: https.RequestOptions = proxy ? {agent: new HttpsProxyAgent(proxy)} : {}
    https.get(url, options, (rsp: any) => {
      if (tty && opts.progress) showProgress(rsp)
      rsp.pipe(file)
        .on('error', reject)
        .on('close', resolve)
    })
  })
}
