let nock = require('nock')

nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
