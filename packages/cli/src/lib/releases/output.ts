import got = require('got')

export const stream = function (url: string) {
  return new Promise(function (resolve, reject) {
    const stream = got.stream(url)
    stream.on('error', reject)
    stream.on('end', resolve)
    const piped = stream.pipe(process.stdout)
    piped.on('error', reject)
  })
}

