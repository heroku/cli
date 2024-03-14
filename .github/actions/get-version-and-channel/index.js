const core = require('@actions/core')
const {readFileSync} = require('fs')

function run() {
  /* !IMPORTANT: You must run `npm run build` in this directory after all changes. Look to ./package.json */

  try {
    const buffer = readFileSync(core.getInput('path'))
    const pjson = JSON.parse(buffer.toString())
    if (pjson?.version) {
      const {version} = pjson
      const distTag = version.split('-')[1] || ''
      // strip build: 'beta.5' => 'beta'
      const channel = distTag.split('.')[0]

      core.setOutput('channel', channel)
      core.setOutput('version', version)
    } else {
      core.setFailed('no version found :(')
    }
  } catch (err) {
    if (err instanceof Error) {
      core.setFailed(err.message)
      return
    }
    core.setFailed('unknown error')
  }
}

run()
