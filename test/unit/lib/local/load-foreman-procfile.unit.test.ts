import {expect} from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {loadProc} from '../../../../src/lib/local/load-foreman-procfile.js'

describe('load-foreman-procfile', function () {
  let tempDir: string

  beforeEach(function () {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'heroku-local-procfile-'))
  })

  afterEach(function () {
    fs.rmSync(tempDir, {force: true, recursive: true})
  })

  it('ignores top-level comment lines', function () {
    const procfilePath = path.join(tempDir, 'Procfile')
    fs.writeFileSync(procfilePath, [
      '# Example Procfile for tests',
      'web: npm run start',
      'worker: npm run worker',
      '',
    ].join('\n'))

    const procHash = loadProc(procfilePath)
    expect(procHash).to.deep.equal({
      web: 'npm run start',
      worker: 'npm run worker',
    })
  })

  it('ignores indented comment lines', function () {
    const procfilePath = path.join(tempDir, 'Procfile')
    fs.writeFileSync(procfilePath, [
      '  # process descriptions',
      'web: npm run start',
      '',
    ].join('\n'))

    const procHash = loadProc(procfilePath)
    expect(procHash).to.deep.equal({
      web: 'npm run start',
    })
  })

  it('retains existing parse errors for malformed lines', function () {
    const procfilePath = path.join(tempDir, 'Procfile')
    fs.writeFileSync(procfilePath, [
      'web: npm run start',
      'not a valid procfile line',
      '',
    ].join('\n'))

    expect(() => loadProc(procfilePath)).to.throw('line 2 parse error: not a valid procfile line')
  })

  it('supports additional colons in process commands', function () {
    const procfilePath = path.join(tempDir, 'Procfile')
    fs.writeFileSync(procfilePath, [
      'web: node server.js --url=http://localhost:3000',
      '',
    ].join('\n'))

    const procHash = loadProc(procfilePath)
    expect(procHash.web).to.equal('node server.js --url=http://localhost:3000')
  })
})
