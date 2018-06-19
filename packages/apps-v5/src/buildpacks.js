'use strict'

const cli = require('heroku-cli-util')
const push = require('./push')

function BuildpackCommand (context, heroku, command, action) {
  this.app = context.app
  this.heroku = heroku

  if (context.flags && context.flags.index) {
    let index = parseInt(context.flags.index)
    if (isNaN(index) || index <= 0) {
      cli.exit(1, 'Invalid index. Must be greater than 0.')
    }
    this.index = index
  } else {
    this.index = null
  }

  this.url = context.args && context.args.url
  this.action = action
  this.command = command
  this.context = context
}

BuildpackCommand.prototype.mapBuildpackResponse = function (buildpacks) {
  return buildpacks.map(function (bp) {
    bp.buildpack.url = bp.buildpack.url.replace(/^urn:buildpack:/, '')
    return bp
  })
}

BuildpackCommand.prototype.get = function () {
  let buildpackCommand = this
  return this.heroku.request({
    path: `/apps/${this.app}/buildpack-installations`,
    headers: {Range: ''}
  }).then(function (buildpacks) {
    return buildpackCommand.mapBuildpackResponse(buildpacks)
  })
}

BuildpackCommand.prototype.put = function (buildpackUpdates) {
  let app = this.app
  let buildpackCommand = this
  return this.heroku.request({
    path: `/apps/${app}/buildpack-installations`,
    headers: {Range: ''},
    method: 'PUT',
    body: {updates: buildpackUpdates}
  }).then(function (buildpacks) {
    return buildpackCommand.mapBuildpackResponse(buildpacks)
  })
}

BuildpackCommand.prototype.clear = function * () {
  let res = yield {
    config: this.heroku.request({
      path: `/apps/${this.app}/config-vars`
    }),
    clear: this.put([])
  }

  let configVars = res.config
  let message = `Buildpack${this.command === 'clear' ? 's' : ''} ${this.action}.`
  if (configVars.hasOwnProperty('BUILDPACK_URL')) {
    cli.log(message)
    cli.warn('The BUILDPACK_URL config var is still set and will be used for the next release')
  } else if (configVars.hasOwnProperty('LANGUAGE_PACK_URL')) {
    cli.log(message)
    cli.warn('The LANGUAGE_PACK_URL config var is still set and will be used for the next release')
  } else {
    cli.log(`${message} Next release on ${this.app} will detect buildpack normally.`)
  }
}

BuildpackCommand.prototype.findIndex = function (buildpacks) {
  const {findIndex} = require('lodash')
  let index = this.index
  if (index) {
    return findIndex(buildpacks, function (b) {
      return b.ordinal + 1 === index
    })
  } else {
    return -1
  }
}

BuildpackCommand.prototype.findUrl = function findUrl (buildpacks) {
  const {findIndex} = require('lodash')
  let url = this.url
  let mappedUrl = this.url.replace(/^urn:buildpack:/, '').replace(/^https:\/\/codon-buildpacks\.s3\.amazonaws\.com\/buildpacks\/heroku\/(.*)\.tgz$/, 'heroku/$1')
  return findIndex(buildpacks, function (b) { return b.buildpack.url === url || b.buildpack.url === mappedUrl })
}

BuildpackCommand.prototype.display = function (buildpacks, indent) {
  if (buildpacks.length === 1) {
    cli.log(buildpacks[0].buildpack.url)
  } else {
    buildpacks.forEach(function (b, i) {
      cli.log(`${indent}${i + 1}. ${b.buildpack.url}`)
    })
  }
}

BuildpackCommand.prototype.displayUpdate = function (buildpacks) {
  if (buildpacks.length === 1) {
    cli.log(`Buildpack ${this.action}. Next release on ${this.app} will use ${buildpacks[0].buildpack.url}.`)
    cli.log(`Run ${cli.color.magenta(push(this.context.flags.remote))} to create a new release using this buildpack.`)
  } else {
    cli.log(`Buildpack ${this.action}. Next release on ${this.app} will use:`)
    this.display(buildpacks, '  ')
    cli.log(`Run ${cli.color.magenta(push(this.context.flags.remote))} to create a new release using these buildpacks.`)
  }
}

BuildpackCommand.prototype.mutate = function (buildpacksGet, spliceIndex) {
  let buildpackUpdates = buildpacksGet.map(function (b) {
    return {buildpack: b.buildpack.url}
  })

  let howmany = (this.command === 'add') ? 0 : 1
  let urls = (this.command === 'remove') ? [] : [{buildpack: this.url}]

  Array.prototype.splice.apply(buildpackUpdates, [spliceIndex, howmany].concat(urls))

  let bp = this
  return this.put(buildpackUpdates).then(function (buildpackPut) {
    bp.displayUpdate(buildpackPut)
  })
}

BuildpackCommand.prototype.validateUrlNotSet = function (buildpacks) {
  if (this.findUrl(buildpacks, this.url) !== -1) {
    cli.exit(1, `The buildpack ${this.url} is already set on your app.`)
  }
}

BuildpackCommand.prototype.validateUrlPassed = function () {
  if (this.url) {
    return this.url
  }
  cli.exit(1, `Usage: heroku buildpacks:${this.command} BUILDPACK_URL.
Must specify target buildpack URL.`)
}

BuildpackCommand.prototype.validateIndexInRange = function (buildpacks) {
  if (this.index < 0 || this.index > buildpacks.length) {
    if (buildpacks.length === 1) {
      cli.exit(1, 'Invalid index. Only valid value is 1.')
    } else {
      cli.exit(1, `Invalid index. Please choose a value between 1 and ${buildpacks.length}`)
    }
  }
}

module.exports = BuildpackCommand
