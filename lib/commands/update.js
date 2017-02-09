'use strict'

const {Command} = require('heroku-cli-command')

class Update extends Command {
  async run () {
    this.got = require('got')
    this.branch = 'v6'
    this.action('heroku-cli: Updating CLI')
    this.manifest = await this.fetchManifest()
    this.action(`heroku-cli: Updating CLI to ${this.color.green(this.manifest.version)}${this.branch === 'stable' ? '' : ' (' + this.color.yellow(this.branch) + ')'}`)
    await this.update()
  }

  async fetchManifest () {
    let url = `https://cli-assets.heroku.com/branches/${this.branch}/${process.platform}-${process.arch}`
    let {body: manifest} = await this.got(url, {json: true})
    return manifest
  }

  async update () {
    const zlib = require('zlib')
    const tar = require('tar-stream')
    const fs = require('fs')
    let url = `https://cli-assets.heroku.com/branches/${this.branch}/${this.base}.tar.gz`
    let stream = await this.got.stream(url)
    return new Promise((resolve, reject) => {
      let extract = tar.extract()
      extract.on('entry', (header, stream, next) => {
        this.debug(header.name)
        switch (header.type) {
          case 'directory':
            fs.mkdirSync(header.name, {mode: header.mode})
            next()
            break
          case 'file':
            stream.pipe(fs.createWriteStream(header.name, {mode: header.mode}))
            break
          case 'symlink': // ignore symlinks
            next()
            break
          default:
            throw new Error(header.type)
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
}

Update.topic = 'update'

module.exports = Update
