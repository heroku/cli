import {exec} from 'node:child_process'
import fs from 'node:fs'

for (const c of fs.readdirSync('.')
  .filter(f => f.startsWith('heroku-v') && f.endsWith('.exe'))
  .flatMap(f =>
    [process.env.STAMPY_UNSIGNED_BUCKET, process.env.STAMPY_SIGNED_BUCKET].map(b => `aws s3 rm ${b}/${f}`))) {
  exec(c, (error, stdout) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }

    console.log(stdout)
  })
}
