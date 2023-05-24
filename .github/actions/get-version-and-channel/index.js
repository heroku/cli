/* !IMPORTANT: You must run `npm run build` in this directory after all changes. Look to ./package.json */

const core = require('@actions/core')
const {readFile} = require('fs/promises')

async function run() {
  try {
    const buffer = await readFile(core.getInput('path'))
    const fileString = buffer.toString()
    console.log('fileString: ', fileString)
    const pjson = JSON.parse(fileString)
    if (pjson?.version) {
      const {version} = pjson
      const distTag = version.split('-')[1] || ''
      // strip build: 'beta.5' => 'beta'
      const channel = distTag.split('.')[0]

      core.setOutput('channel', channel)
      core.setOutput('version', version)
    }
    core.setFailed('no version found :(')
  } catch (err) {
    if (err instanceof Error) {
      core.setFailed(err.message)
      return
    }
    core.setFailed('unknown error')
  }
}

run()
