const qq = require('qqjs')

module.exports = async () => {
  let {version} = require('../../package.json')
  if (version.includes('-')) {
    let channel = version.split('-')[1].split('.')[0]
    let sha = await qq.x.stdout('git', ['rev-parse', '--short', 'HEAD'])
    version = `${version}-${channel}.${sha}`
  }
  return version
}
