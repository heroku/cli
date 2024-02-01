const cli = require('heroku-cli-util')

export const stream = function (url: string) {
  return new Promise(function (resolve, reject) {
    // todo: remove this heroku-cli-util usage. The time to do so appears significant.
    const stream = cli.got.stream(url)
    stream.on('error', reject)
    stream.on('end', resolve)
    const piped = stream.pipe(process.stdout)
    piped.on('error', reject)
  })
}

