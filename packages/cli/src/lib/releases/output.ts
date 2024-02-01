import * as net from 'net'

export const stream = function (url: string) {
  return new Promise(function (resolve, reject) {
    const stream = net.createConnection(url)
    stream.on('error', reject)
    stream.on('end', resolve)
    const piped = stream.pipe(process.stdout)
    piped.on('error', reject)
  })
}

