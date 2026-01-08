import fs from 'fs-extra'
import * as Path from 'path'
import * as https from 'https'
import cliProgress from 'cli-progress'

type downloadOptions = {
  progress: boolean
}

export default function download(url: string, path: string, opts: downloadOptions) {
  const tty = process.stderr.isTTY && process.env.TERM !== 'dumb'

  function showProgress(rsp: any) {
    const bar = new cliProgress.SingleBar({
      format: `Downloading ${path}... |{bar}| {percentage}% | ETA: {eta}s | {value}/{total} bytes`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    })
    bar.start(Number.parseInt(rsp.headers['content-length'], 10), 0)
    let total = 0
    rsp.on('data', function (chunk: string) {
      total += chunk.length
      bar.update(total)
    })
    rsp.on('end', () => {
      bar.stop()
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
