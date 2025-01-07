async function call(url: string, out: NodeJS.WriteStream, retries: number) {
  const http = require('@heroku/http-call').HTTP
  const maxRetries = 30
  try {
    const {response} = await http.stream(url)
    response.on('data', function (d: string) {
      out.write(d)
    })
    return await new Promise(function (resolve, reject) {
      response.on('error', reject)
      response.on('end', resolve)
    })
  } catch (error: any) {
    if (error.statusCode === 404 && retries <= maxRetries) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          call(url, out, retries + 1).then(resolve, reject)
        }, 1000)
      })
    }

    throw error
  }
}

export const streamer = function (url: string, out: NodeJS.WriteStream) {
  return call(url, out, 0)
}
