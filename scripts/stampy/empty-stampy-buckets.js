const fs = require('fs')
const exec = require('child_process').exec

fs.readdirSync('.')
  .filter(f => f.startsWith('heroku-v') && f.endsWith('.exe'))
  .flatMap(f =>
    [process.env.STAMPY_UNSIGNED_BUCKET, process.env.STAMPY_SIGNED_BUCKET].map(b => `aws s3 rm ${b}/${f}`),
  )
  .forEach(c => {
    exec(c, (error, stdout) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }

      console.log(stdout)
    })
  })
