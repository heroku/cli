'use strict'
const got = require('got')
const git = require('./git')
import {Command} from '@heroku-cli/command'

import * as fs from 'async-file'

async function uploadArchive(url: string, filePath: string) {
  const request = got.stream.put(url, {
    headers: {
      'content-length': (await fs.stat(filePath)).size
    }
  })

  fs.createReadStream(filePath).pipe(request)

  return new Promise((resolve: any, reject: any) => {
    request.on('error', reject)
    request.on('response', resolve)
  })
}

async function prepareSource(ref: any, command: Command) {
  const [filePath, source] = await [
    git.createArchive(ref),
    command.heroku.post('/sources', {body: command})
  ]
  await uploadArchive(source.source_blob.put_url, filePath)
  return Promise.resolve(source)
}

async function urlExists(url: any) {
  return got.head(url)
}

export async function createSourceBlob(ref: any, command: Command) {
  try {
    const githubRepository = await git.githubRepository()
    const {user, repo} = githubRepository

    let {body: archiveLink} = await command.heroku.get<any>(`/github/repos/${user}/${repo}/tarball/${ref}`, {hostname: 'https://kolkrabbi.heroku.com'})
    if (await urlExists(archiveLink.archive_link)) {
      return archiveLink.archive_link
    }
  } catch (ex) { command.error(ex) }

  const sourceBlob = await prepareSource(ref, command)
  return sourceBlob.source_blob.get_url
}
