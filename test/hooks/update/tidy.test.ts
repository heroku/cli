// import * as fs from 'fs-extra'
// import * as path from 'path'

// import Config from '../../__test__/config'

// import Tidy from './tidy'

// let config: Config
// let tidy: Tidy

// beforeEach(() => {
//   config = new Config()
//   tidy = new Tidy(config)
// })

// test('cleans up configDir', async () => {
//   let foo = path.join(config.configDir, 'foo')
//   fs.mkdirpSync(foo)
//   await tidy.run()
//   expect(fs.existsSync(foo)).toEqual(false)
// })

// test('does not modify dataDir when equal to configDir', async () => {
//   process.env.HEROKU_CONFIG_DIR = config.dataDir
//   config = new Config()
//   tidy = new Tidy(config)
//   let bar = path.join(config.configDir, 'foo/bar')
//   fs.mkdirpSync(bar)
//   await tidy.run()
//   expect(fs.existsSync(bar)).toEqual(true)
// })

// test('does not empty dirs with files in them', async () => {
//   let bar = path.join(config.configDir, 'foo/bar')
//   fs.outputFileSync(bar, 'bar')
//   await tidy.run()
//   expect(fs.existsSync(bar)).toEqual(true)
// })

// test('cleans up dataDir/tmp', async () => {
//   let foo = path.join(config.dataDir, 'tmp/foo')
//   fs.mkdirpSync(foo)
//   await tidy.run()
//   expect(fs.existsSync(foo)).toEqual(false)
// })

describe.skip('tidy', () => {
  it('works', () => {
  })
})
