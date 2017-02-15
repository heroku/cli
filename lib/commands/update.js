'use strict'

const {Command} = require('heroku-cli-command')
const path = require('path')
const dirs = require('../dirs')
const version = require('../version')
const lock = require('rwlockfile')

class Update extends Command {
  async run () {
    this.fs = require('fs-extra')
    this.got = require('got')
    this.branch = 'v6'
    this.action('heroku-cli: Updating CLI')
    this.manifest = await this.fetchManifest()
    if (this.flags.force || version !== this.manifest.version) {
      this.action(`heroku-cli: Updating CLI to ${this.color.green(this.manifest.version)}${this.branch === 'stable' ? '' : ' (' + this.color.yellow(this.branch) + ')'}`)
      await this.update()
      this.action.done()
    } else this.action.done(`already on latest version: ${version}`)
    this.action('heroku-cli: Updating plugins')
  }

  async fetchManifest () {
    let url = `https://cli-assets.heroku.com/branches/${this.branch}/${process.platform}-${process.arch}`
    let {body: manifest} = await this.got(url, {json: true})
    return manifest
  }

  async update () {
    await lock.write(dirs.updatelockfile, {skipOwnPid: true})
    let url = `https://cli-assets.heroku.com/branches/${this.branch}/${this.base}.tar.gz`
    let stream = await this.got.stream(url)
    let dir = path.join(dirs.data, 'jscli')
    let tmp = path.join(dirs.data, 'jscli_tmp')
    await this.extract(stream, tmp)
    this.fs.removeSync(dir)
    this.fs.renameSync(path.join(tmp, this.base), dir)
  }

  extract (stream, dir) {
    const zlib = require('zlib')
    const tar = require('tar-stream')

    return new Promise(resolve => {
      this.fs.removeSync(dir)
      let extract = tar.extract()
      extract.on('entry', (header, stream, next) => {
        let p = path.join(dir, header.name)
        let opts = {mode: header.mode}
        this.debug(p)
        switch (header.type) {
          case 'directory':
            this.fs.mkdirpSync(p, opts)
            next()
            break
          case 'file':
            stream.pipe(this.fs.createWriteStream(p, opts))
            break
          case 'symlink':
            // ignore symlinks since they will not work on windows
            next()
            break
          default: throw new Error(header.type)
        }
        stream.resume()
        stream.on('end', next)
      })
      extract.on('finish', resolve)
      stream
      .pipe(zlib.createGunzip())
      .pipe(extract)
    })
  }

  get base () {
    return `heroku-v${this.manifest.version}-${process.platform}-${process.arch}`
  }

  static async checkIfUpdating () {
    const lock = require('rwlockfile')
    if (await lock.hasWriter(dirs.updatelockfile)) {
      console.error('heroku-cli: warning: update in process')
      await lock.read(dirs.updatelockfile)
      const {spawnSync} = require('child_process')
      const {status} = spawnSync('heroku', process.argv.slice(2), {stdio: 'inherit', shell: true})
      process.exit(status)
    } else {
      await lock.read(dirs.updatelockfile)
    }
  }
}

Update.topic = 'update'
Update.flags = [
  {name: 'force', char: 'f', hidden: true}
]

module.exports = Update
