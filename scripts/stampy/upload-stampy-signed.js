const fs = require('fs')
const exec = require('child_process').exec

fs.readdirSync('.')
  .filter(f => f.startsWith('heroku-v') && f.endsWith('.exe'))
  .map(f => ({
    filename: f,
    cli: f.split('-')[0],
    // do it from the end to account for the possibility of the version having a hyphen in it like 2.2.2-beta.0
    sha: f.split('-').at(-2),
  }))
  .map(f => ({...f, shaIndex: f.filename.split('-').indexOf(f.sha)}))
  // version is the part between the cli and the sha
  .map(f => ({...f, version: f.filename.split('-').slice(1, f.shaIndex).join('-').replace('v', '')}))
  .map(
    f =>
      `aws s3 cp ${f.filename} s3://heroku-cli-assets/versions/${f.version}/${f.sha}/${f.filename}`,
  )
  .map(f => {
    exec(f, (error, stdout) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }

      console.log(stdout)
    })
  })
