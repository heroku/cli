import cliProgress from 'cli-progress'
import fs from 'fs-extra'
import * as https from 'https'
import * as Path from 'path'

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
    https.get(url, (rsp: any) => {
      if (tty && opts.progress) showProgress(rsp)
      rsp.pipe(file)
        .on('error', reject)
        .on('close', resolve)
    })
  })
}
