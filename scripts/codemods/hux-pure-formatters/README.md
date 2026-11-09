# hux pure-formatters codemod

Migrates call sites to `@heroku/heroku-cli-util` v11 (W-23478608). In v11, `hux.styledHeader`,
`hux.styledObject`, and `hux.table` return the rendered string instead of printing it, and
`hux.styledJSON` is removed. A call site that is not migrated still compiles but prints nothing.

## Usage

```bash
# Preview (prints counts, writes nothing)
npx tsx scripts/codemods/hux-pure-formatters/migrate.ts --dry-run src

# Apply, then sort any imports it added
npx tsx scripts/codemods/hux-pure-formatters/migrate.ts src
npx eslint --fix $(git diff --name-only -- src)
```

It is idempotent: already-wrapped calls are left alone, so re-running after merging `main` into
the v12 branch only migrates call sites that came in with the merge.

## What it does

Only bare call statements are rewritten (`hux.table(...)` on its own line). Output is
byte-for-byte unchanged.

| Call site | `styledHeader` / `styledObject` / `table` | `styledJSON(x)` |
|---|---|---|
| Instance method of a `*Command` class (including arrow functions inside it) | `this.log(hux.X(...))` | `this.logJson(x)` |
| Anywhere else (helper functions, `src/lib`, object-literal methods) | `ux.stdout(hux.X(...))` | `ux.stdout(ux.colorizeJson(x))` |

Outside a command there is no `this.log`. Those helpers already print their other lines with
`ux.stdout`, so the codemod matches them; routing them through the command's logger is part of the
direct-stdout cleanup.

`this.logJson(x)` prints the same bytes as `hux.styledJSON(x)`, except that it applies a user's
`~/.config/heroku/theme.json` JSON colors if they have one.

It also adds a `ux` import where needed and removes `hux` imports that are no longer used.

## What it flags (does not auto-fix)

`hux.styledJSON` is only converted when an enclosing `if` or ternary condition mentions `json`
(e.g. `if (flags.json)`). Anywhere else the JSON may be human-readable output, so the codemod adds
a `// TODO(hux-pure-formatters)` comment above the call and exits non-zero. Fix it by hand:

- human-readable output: `this.log(ux.colorizeJson(x))`
- `--json` output: `this.logJson(x)`

These need a manual pass too (TypeScript reports them after the dependency bump):

- `hux.table(..., {printLine})`: the option is removed. Use the returned string.
- Tests that stub these helpers must return a string (`stub(hux, 'table').returns('')`).

The `no-restricted-syntax` rule in `eslint.config.js` rejects any bare `hux.styledHeader`,
`hux.styledObject`, or `hux.table` call left behind.
