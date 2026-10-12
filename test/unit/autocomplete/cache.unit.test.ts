import {expect} from 'chai'
import {
  mkdtempSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'

import {cachedValues} from '../../../src/lib/autocomplete/cache.js'

describe('autocomplete completion cache', function () {
  let dir: string

  beforeEach(function () {
    dir = mkdtempSync(path.join(tmpdir(), 'heroku-ac-cache-'))
  })

  afterEach(function () {
    rmSync(dir, {force: true, recursive: true})
  })

  it('computes and returns values on a cold miss', async function () {
    let calls = 0
    const values = await cachedValues(dir, 'app', 60, async () => {
      calls++
      return ['a', 'b']
    })
    expect(values).to.deep.equal(['a', 'b'])
    expect(calls).to.equal(1)
  })

  it('reuses the cached values within the TTL without recomputing', async function () {
    let calls = 0
    const compute = async () => {
      calls++
      return [`run-${calls}`]
    }

    const first = await cachedValues(dir, 'app', 60, compute)
    const second = await cachedValues(dir, 'app', 60, compute)
    expect(first).to.deep.equal(['run-1'])
    expect(second).to.deep.equal(['run-1'])
    expect(calls, 'second call should hit the cache').to.equal(1)
  })

  it('recomputes once the entry has expired', async function () {
    let calls = 0
    const compute = async () => {
      calls++
      return [`run-${calls}`]
    }

    await cachedValues(dir, 'app', 0, compute) // ttl 0 => already expired on next read
    const second = await cachedValues(dir, 'app', 0, compute)
    expect(second).to.deep.equal(['run-2'])
    expect(calls).to.equal(2)
  })

  it('scopes entries by key', async function () {
    await cachedValues(dir, 'app@prod', 60, async () => ['prod-app'])
    const staging = await cachedValues(dir, 'app@staging', 60, async () => ['staging-app'])
    expect(staging).to.deep.equal(['staging-app'])
  })

  it('treats a corrupt cache file as a miss', async function () {
    const values = ['x']
    // Prime the cache, then clobber the file with junk.
    await cachedValues(dir, 'app', 60, async () => values)
    const file = findEntryFile(dir)
    writeFileSync(file, 'not json{')

    let recomputed = false
    const result = await cachedValues(dir, 'app', 60, async () => {
      recomputed = true
      return ['fresh']
    })
    expect(recomputed, 'corrupt entry should force a recompute').to.be.true
    expect(result).to.deep.equal(['fresh'])
  })
})

function findEntryFile(dir: string): string {
  const completions = path.join(dir, 'autocomplete', 'completions')
  const [name] = readdirSync(completions)
  return path.join(completions, name)
}
