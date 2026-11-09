# `--json` snapshot tests

`--json` output is a versioned contract. From v12.0.0, every command that opts into `--json` (`static enableJsonFlag = true`) ships snapshot tests that pin its document, so a change to the shape shows up as a failing test and a reviewed snapshot diff. See [Reviewing snapshot changes](#reviewing-snapshot-changes) for which changes are breaking.

The helpers live in [`json-snapshot.ts`](./json-snapshot.ts).

## Writing a test

Stub the SDK (or nock the API) exactly as in a normal unit test, then call `expectJsonSnapshot` from a mocha `function () {}` (not an arrow function, so `this` is the test context):

```ts
import type {Region} from '@heroku/types/3.sdk'

import {expectJsonSnapshot, runCommandJson} from '../../helpers/json-snapshot.js'

const regionData = [/* complete Region records */] satisfies Region[]

describe('--json', function () {
  it('returns the SDK region list in API order', async function () {
    fakePlatform.region.list.resolves(regionData)

    const {json} = await expectJsonSnapshot<Region[]>(this, Regions)   // or (this, Regions, ['--common'])
  })
})
```

`expectJsonSnapshot`:

1. runs the command through oclif's command lifecycle (`init → run → catch → finally → logJson`), so the returned value is serialized as users see it, `this.log` is suppressed, and errors render as JSON. The CLI's own `init`/`prerun`/`postrun`/`finally` hooks and command lookup are not run;
2. fails if stdout is anything other than a single JSON document (catches stray `ux.stdout`, `console.log`, or `hux.*` writes), if it is empty (oclif prints nothing when `run()` returns a falsy value such as `undefined`), or if it contains ANSI color codes;
3. fails if the command exited non-zero, so an error document is never stored as a snapshot;
4. runs the command twice, once with `--json` and once with `HEROKU_CONTENT_TYPE=json`, and fails if the two documents or exit codes differ. Stubs are therefore called twice, so don't combine it with `calledOnce` assertions;
5. compares the document to the stored snapshot for this test.

It returns `{json, stdout, stderr, exitCode}` for extra assertions; pass a type argument (`expectJsonSnapshot<Region[]>`) to type `json`.

`runCommandJson(Cmd, args, {activation: 'flag' | 'env'})` does steps 1–2 for a single activation path without a snapshot. Use it for error cases (assert on `exitCode` and `json.error.message`, under both activations) or anything nondeterministic. Error documents include every enumerable property of the error (HTTP response details, request IDs), so don't snapshot them.

To take more than one snapshot in a test, give each a `name`: `expectJsonSnapshot(this, Cmd, args, {name: 'common'})`. Reusing a key in one run fails the test.

## What to snapshot

- Type fixtures as the SDK type with every field filled in (`[...] satisfies Region[]`). For commands that return the SDK result unchanged, the snapshot then pins the shape users actually get, and a change to the SDK type fails type-checking in the test. A hand-written partial fixture only proves the command passed its input through.
- One snapshot per command at minimum, using a representative fixture response.
- Add cases for selection flags that change which records are returned (`--common`, `--filter`, …) and for the empty result (`[]` / `{}`).
- Fixtures must be deterministic: fixed timestamps and IDs, no live API calls, no current dates or machine paths in the document. If order matters, assert it explicitly as well.

The snapshot guards what the CLI does to the SDK result. It does not detect changes in the SDK's own types beyond what the typed fixtures catch at compile time.

## Updating snapshots

Snapshots live next to the test in `__snapshots__/<test file>.json`, keyed by the test's full title (plus `[name]` if given).

```sh
UPDATE_SNAPSHOTS=1 npm run test:file -- test/unit/commands/regions.unit.test.ts
```

- Locally, a test with no stored snapshot writes one on first run. With `CI` set (as in GitHub Actions), a missing snapshot fails the build and `UPDATE_SNAPSHOTS` is refused, so commit the generated file.
- Renaming a test changes its key. Delete the stale entry from the snapshot file; nothing detects stale entries automatically.

## Reviewing snapshot changes

A changed snapshot means a changed `--json` contract. Classify the change:

- **Breaking**: removing, renaming, or retyping a field; changing the top-level shape (for example, array to object, or wrapping the result); or changing the order of returned records. Mark the PR as breaking (`!` after the change type).
- **Minor**: adding a field to an existing document, adding a new command, or adding a test case.

Either way, a PR that modifies any `__snapshots__/*.json` file must describe the change in the PR summary and get explicit reviewer approval of the snapshot diff. For a breaking change, also tick the `--json` snapshot checkbox in the PR template.

## Why not a snapshot library

Existing mocha/chai snapshot libraries store snapshots in Jest's format, which wraps each document in a template string. Plain JSON files make the contract diff readable in review, and the helper needs CLI-specific checks (the single-document, ANSI, and `--json`/`HEROKU_CONTENT_TYPE` checks) that a generic library doesn't provide.
