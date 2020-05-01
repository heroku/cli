const qq = require('qqjs')

module.exports = async () => {
  let { version } = require('../../packages/cli/package.json')
  if (version.includes('-')) {
    let channel = version.split('-')[1].split('.')[0]
    let sha = await qq.x.stdout('git', ['rev-parse', '--short', 'HEAD'])
    version = `${version.split('-')[0]}-${channel}.${sha}`
  }
  return version
}
