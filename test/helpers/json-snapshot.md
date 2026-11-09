# `--json` snapshot tests

`--json` output is a versioned contract: from v12.0.0 a change to a command's JSON shape is a breaking change. Every command that opts into `--json` (`static enableJsonFlag = true`) ships snapshot tests that pin its document, so any change to the shape shows up as a failing test and a reviewed snapshot diff.

The helpers live in [`json-snapshot.ts`](./json-snapshot.ts).

## Writing a test

Stub the SDK (or nock the API) exactly as in a normal unit test, then call `expectJsonSnapshot` from a mocha `function () {}` (not an arrow function, so `this` is the test context):

```ts
import {expectJsonSnapshot, runCommandJson} from '../../helpers/json-snapshot.js'

describe('--json', function () {
  it('returns the SDK region list in API order', async function () {
    fakePlatform.region.list.resolves(regionData)

    await expectJsonSnapshot(this, Regions)            // or (this, Regions, ['--common'])
  })
})
```

`expectJsonSnapshot`:

1. runs the command through oclif's real lifecycle (the public static `Command.run`, which drives `init → run → catch → logJson`), so the returned value is serialized exactly as users see it, `this.log` is suppressed, and errors render as JSON;
2. fails if stdout is anything other than a single JSON document (catches stray `ux.stdout`, `console.log`, or `hux.*` writes);
3. runs it twice, once with `--json` and once with `HEROKU_CONTENT_TYPE=json`, and fails if the two documents or exit codes differ;
4. compares the document to the stored snapshot for this test.

It returns `{json, stdout, stderr, exitCode}` for any extra assertions.

`runCommandJson(Cmd, args, {activation: 'flag' | 'env'})` does steps 1–2 for a single activation path without a snapshot. Use it for error cases (assert on `exitCode` and `json.error.message`) or anything nondeterministic.

## What to snapshot

- One snapshot per command at minimum, using a representative fixture response.
- Add cases for selection flags that change which records are returned (`--common`, `--filter`, …) and for the empty result (`[]` / `{}`).
- Fixtures must be deterministic: no live API calls, no current dates, random IDs, or machine paths in the document.

## Updating snapshots

Snapshots live next to the test in `__snapshots__/<test file>.json`, keyed by the test's full title.

```sh
UPDATE_SNAPSHOTS=1 npm run test:file -- test/unit/commands/regions.unit.test.ts
```

- Locally, a test with no stored snapshot writes one on first run. With `CI` set (as in GitHub Actions), a missing snapshot fails the build, so commit the generated file.
- Renaming a test changes its key; delete the stale entry from the snapshot file.

## Reviewing snapshot changes

A changed snapshot means a changed `--json` contract. A PR that modifies any `__snapshots__/*.json` file must:

- tick the `--json` snapshot checkbox in the PR template,
- describe the change in the PR summary and mark the PR as breaking (`!` after the change type), and
- get explicit reviewer approval of the snapshot diff.

Purely additive changes (a new command or new test case) still need review but are not breaking.
