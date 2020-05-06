const qq = require('qqjs')

module.exports = async () => {
  const pjson = await qq.readJSON('./package.json')
  if (process.env.CIRCLE_TAG && process.env.CIRCLE_TAG.startsWith('v')) {
    pjson.version = pjson.version.split('-')[0]
  } else if (process.env.CIRCLE_BRANCH === 'master') {
    pjson.version = pjson.version.split('-')[0] + '-beta'
  } else {
    pjson.version = pjson.version.split('-')[0] + '-dev'
  }
  await qq.writeJSON('./package.json', pjson)
}
