const os = require('os')

exports.default = (os.platform()) === 'windows' || os.platform() === 'win32' ? () => console.log('skipping on windows') : (msg, cbk) => describe(msg, cbk)
