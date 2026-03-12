import os from 'os'

const runtest = (os.platform() === 'windows' || os.platform() === 'win32')
  ? (msg, cbk) => console.log('skipping on windows')
  : (msg, cbk) => describe(msg, cbk)

export default runtest
