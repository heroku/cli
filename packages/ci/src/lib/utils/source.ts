'use strict'
const got = require('got')
const api = require('./heroku-api')
const git = require('./git')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

import {Command, APIClient} from '@heroku-cli/command'

import * as Heroku from '@heroku-cli/schema'

import * as Kolkrabbi from '../../interfaces/kolkrabbi'

async function uploadArchive(url: string, filePath: string) {
  const request = got.stream.put(url, {
    headers: {
      'content-length': (await fs.statAsync(filePath)).size
    }
  })

  fs.createReadStream(filePath).pipe(request)

  return new Promise((resolve: any, reject: any) => {
    request.on('error', reject)
    request.on('response', resolve)
  })
}

async function prepareSource(ref: any, heroku: Command) {
  const [filePath, source] = await [
    git.createArchive(ref),
    api.createSource(heroku)
  ]
  await uploadArchive(source.source_blob.put_url, filePath)
  return Promise.resolve(source)
}

async function urlExists(url: any) {
  return got.head(url)
}

export async function createSourceBlob(ref: any, api: APIClient) {
  try {
    const githubRepository = await git.githubRepository()
    const {user, repo} = githubRepository

    // TODO: We could probably pull this from elsewhere
    const archiveLink = await api.get(`/github/repos/${user}/${repo}/tarball/${ref}`, {hostname: 'https://kolkrabbi.heroku.com'})
    if (await urlExists(archiveLink.archive_link!)) {
      return archiveLink.archive_link
    }
  } catch (ex) { heroku.error(ex) }

  const sourceBlob = await prepareSource(ref, heroku)
  return sourceBlob.source_blob.get_url
}