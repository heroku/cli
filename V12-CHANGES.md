# Heroku CLI v12 - User-Facing Changes

## Resolver changes

Many commands now resolve add-ons, add-on attachments, and Postgres databases through `@heroku/sdk` instead of the CLI's local resolvers or `heroku-cli-util`. These behavior changes apply broadly, wherever the new resolvers are used:

- **No global fallback.** An add-on identifier scoped to `--app` that isn't found on that app no longer retries as a global lookup — it fails immediately with a not-found error. Previously, an add-on that existed but wasn't attached to the specified app would still be found via a global retry in the CLI addons/resolve.ts lib file. Exception: `pg:links:create` resolves its remote argument scoped to the app first and then globally, so a remote owned by another app resolves by its add-on name (see the Pg commands section).
- **Specific wrong-service message.** When a database identifier matches an attachment that isn't on the configured Postgres add-on service, the SDK's Postgres database resolver now returns a specific message (`<name> is not a <service> database on <app>. Valid options are: <list>`) instead of the unformatted `Couldn't find that addon.` that `heroku-cli-util` returned.
- **App name added to the "unknown database" message.** When a database identifier doesn't match any attachment at all, `heroku-cli-util`'s fallback already returned `Unknown database: <name>. Valid options are: <list>`; the SDK's Postgres database resolver now returns the same message with the app name added: `Unknown database: <name> on <app>. Valid options are: <list>`.
- **Specific "app not found" message during database resolution.** When a database identifier fails to resolve because the app itself doesn't exist, the SDK's Postgres database resolver now returns `Couldn't find that app: <app>` instead of `heroku-cli-util`'s generic app-not-found error.
- **No color on identifiers in resolver errors.** `heroku-cli-util` colorized the app name in its "no databases" error. The SDK's resolver errors are plain text, so that identifier is no longer colorized.
- **Service name included in the "no databases" error.** The SDK's "no databases" error now names the add-on service it was looking for (`<app> has no <service> databases`), instead of `heroku-cli-util`'s generic `<app> has no databases`.
- **Ambiguous-match wording.** The SDK's ambiguous-identifier error says `multiple matching add-on attachments found: <names>.`, instead of `heroku-cli-util`'s `multiple matching add-ons found: <names>.`
- **Internal error class name in the message prefix.** The SDK's resolver error classes (e.g. `PgDatabaseNotFoundError`, `AddonAttachmentAmbiguousError`) set `name` to their class name, so an uncaught resolver error prints as `<ClassName>: <message>` (e.g. `PgDatabaseNotFoundError: Unknown database: ...`). `heroku-cli-util`'s equivalent errors didn't override `name`, so those showed a plain `Error: <message>`.
- **Extra "Caused by:" line for not-found errors.** The SDK's `PgDatabaseNotFoundError` is constructed with the original resolution error as its `cause`. oclif prints that as an additional `Caused by: <InternalClassName>: <message>` line below the main message.

## Output changes

Commands now render tables, headers, and objects with `@heroku/heroku-cli-util` v11, whose helpers return the rendered text instead of printing it. Output is otherwise byte-for-byte unchanged, except:

- **`--json` output honors a JSON color theme.** Commands with a `--json` flag now print it through oclif's `logJson`, which applies the `json` colors from a user's `theme.json` in the CLI config directory (e.g. `~/.config/heroku/theme.json`) if one is set (set `HEROKU_DISABLE_THEME=true` to ignore it). Without a theme file the output is unchanged.
- **`data:pg:docs` prints its `Opening <url> in <browser> browser…` message to stderr** instead of stdout, like the prompts and warnings around it.
- **Commands that open a browser share one opener.** `apps:open` (`open`), `addons:open`, `addons:docs`, `orgs:open`, `pipelines:open`, `ci:open`, and `pipelines:setup` now open URLs through `heroku-cli-util`'s `openUrl`, still without a keypress prompt. Their status line moves from stdout to stderr and reads `Opening <url> in your default browser…` (previously `Opening <url>...`); `ci:open` and `pipelines:setup` previously printed nothing and now print it too. If the browser launcher can't be started (for example, no `xdg-open` on a headless Linux machine), they warn `We can't open your default browser. Use a different browser or visit <url>.` and exit 1 (`pipelines:setup`, which has already created the pipeline by then, warns and exits 0); previously they failed with the raw spawn error. `data:pg:docs` also exits 1 in that case. `--show-url` still prints only the URL to stdout. Scripts that read the old `Opening <url>...` line from stdout need to read stderr, or use `--show-url` where the command has it.
- **`pg:credentials` shows the rotating-usernames table inside the credential's row.** For a credential that is rotating, the "Usernames currently active for this credential" table was printed above the whole credentials table, separated from the credential it described. It now appears under that heading in the credential's row, as intended.

## Apps commands

- `apps:create` now provisions add-ons, config vars, and buildpacks through `@heroku/sdk` (`platform.app.createAndSetup`). Setup runs as a single step, so the previous per-item progress lines (`Adding <addon>... done`, `Setting config vars... done`, `Setting buildpack to <url>... done`) are consolidated into the one `Creating app... done` spinner. The final status line (app name, region, and stack) is unchanged.
- `apps:errors` now queries router and formation error metrics through `@heroku/sdk` (`metrics.routerMetric.errors` / `metrics.formationMetric.errors`); the metrics host is now `api.metrics.heroku.com` (previously `api.metrics.herokai.com`).

## Authorizations commands

- `authorizations`, `authorizations:create`, `authorizations:info`, `authorizations:revoke` (alias `authorizations:destroy`), `authorizations:rotate`, and `authorizations:update` now use the CLI's standard `--json` flag. Setting `HEROKU_CONTENT_TYPE=json` also switches them to JSON output, and errors are printed as a JSON error document.
- `authorizations:revoke`, `authorizations:rotate`, and `authorizations:update` gain `--json`. Each returns the revoked, rotated, or updated authorization as the API returns it. `--json` output includes token values exactly as the API returns them, as `authorizations:create --json` already did; for `authorizations:rotate`, that includes the new token.
- **`-j` short flag removed (breaking)**: `authorizations`, `authorizations:create`, and `authorizations:info` no longer accept `-j`; use `--json`.
- **`authorizations --json` output order changes (breaking)**: `--json` returns the SDK result unchanged, so authorizations are listed in the order the API returns them. Previously the JSON list was sorted by description. The table output is still sorted.
- **`authorizations:create --short --json` is rejected (breaking)**: the two flags can't be combined, and the command fails with `--json=true cannot also be provided when using --short`. Previously `--short` won and only the token was printed. To print only the token, drop `--json`. To read it from the JSON output instead, use `heroku authorizations:create --json | jq -r .access_token.token`. `--short` still prints only the token when `HEROKU_CONTENT_TYPE=json` is set.

## Certs commands

- `certs:add` matches a certificate's names against your app's domains exactly, ignoring case. Previously, when a certificate had a wildcard name, its names also matched domains that merely contained them: a `*.example.com` certificate matched `www.example.com.evil.org`, and a `www.example.com` name on the same certificate matched `shop.www.example.com`. A wildcard still matches one label (`www.example.com`, not `example.com` or `a.b.example.com`). The names come from the certificate file itself, read before upload.
- `certs`, `certs:add`, `certs:generate`, `certs:info`, `certs:remove`, `certs:update`, `certs:auto`, `certs:auto:disable`, `certs:auto:enable`, and `certs:auto:refresh` gain `--json`. Setting `HEROKU_CONTENT_TYPE=json` also switches them to JSON output, and errors are printed as a JSON error document. Each returns the API's records unchanged:
  - `certs` returns the SNI endpoint list in the order the API returns it (`[]` when there are none). The table output is still sorted by name.
  - `certs:info` returns the SNI endpoint. With `--show-domains`, it adds `domain_hostnames`, the hostnames of the endpoint's domains.
  - `certs:add` returns the SNI endpoint. When it associates domains, the endpoint is read again afterwards, so its `domains` list includes them. `certs:update` returns the SNI endpoint; `certs:remove` returns the removed SNI endpoint.
  - `certs:generate` returns `{domain, key, csr}`, or `{domain, key, certificate}` with `--selfsigned`. `key`, `csr`, and `certificate` are the absolute paths of the files it wrote. With `--json`, openssl's own output goes to stderr and the next-step hints aren't printed.
  - `certs:auto` returns `{app, sniEndpoints, domains}`. `domains` lists all of the app's domains, whether or not Automated Certificate Management is enabled.
  - `certs:auto:enable` returns `{app, domains}`. Each domain gains `dns_record_type` (`CNAME` or `ALIAS/ANAME`), the record type its DNS needs; it's `null` for Heroku-managed domains and for hostnames it can't classify.
  - `certs:auto:disable` and `certs:auto:refresh` return the app.
- `certs:add` gains `--domains <hostnames>`, a comma-separated list of the app's domains to associate the certificate with, instead of the prompt. `--domains ''` associates none. Each hostname must be one of the app's domains and covered by the certificate; otherwise the command fails before uploading anything and names the hostnames that don't qualify.
- `certs:auto --wait` now fails (non-zero exit) when waiting for the certificates fails. Previously it printed `!` and continued, exiting 0.
- `certs:remove`, `certs:update`, and `certs:auto:disable` list `--confirm` in their help. The flag was already accepted but hidden.
- `certs:generate` prints its next-step hints through the CLI's logger instead of writing to stderr directly. Without `--json`, they still appear on stderr.
- `certs:info`, `certs:remove`, and `certs:update` select the certificate differently:
  - `--endpoint <hostname>` selects the certificate that the app's domain `<hostname>` is associated with.
  - `--name` and `--endpoint` can't be used together.
  - The errors name what didn't match:
    - `<hostname> isn't a domain on <app>.`
    - `<hostname> on <app> isn't associated with an SSL certificate.`
    - `Couldn't find an SSL certificate named <name> on <app>.`
    - `<app> has no SSL certificates.`
  - When the app has several certificates and neither flag is given, the error lists them: `<app> has <n> SSL certificates (<names>). Pass --name to select one.`
- `certs:update` reads the certificate and key files before it looks up the certificate, so a missing file fails before any API request.
- `certs:info`'s progress message no longer names the certificate (`Fetching SSL certificate info for <app>`).
- `certs:generate` checks the domain and the output files before it does anything:
  - It rejects a domain that contains `/` or `\`, or starts with `-`.
  - It refuses to overwrite an existing key, CSR, or certificate file. The new `--force` flag overwrites them.
  - It makes the key file readable only by its owner (mode 0600). LibreSSL, macOS's built-in `openssl`, otherwise leaves it readable by everyone.
- If `certs:add` uploads the certificate but associating domains fails, the error names the uploaded certificate and the `certs:remove` command that removes it.
- `certs:add` fails before uploading anything when the certificate file isn't a PEM certificate: `Couldn't read the certificate: expected a PEM-encoded certificate chain. Nothing was uploaded.`
- `certs:add` with `--domains` waits only for the named domains to be ready, not for every pending domain on the app, and `--domains ''` doesn't wait at all.
- With `--json`, the certs commands never prompt:
  - `certs:remove`, `certs:update`, and `certs:auto:disable` require `--confirm <app>`. Without it they fail with `To proceed, re-run this command with --confirm <app>.`
  - `certs:generate` requires `--now`, `--subject`, or at least one of `--owner`, `--country`, `--area`, or `--city`.
  - `certs:add` requires `--domains` when the certificate covers any of the app's domains. Without it, the command fails before uploading anything, with `This certificate covers <hostnames> on <app>. Pass --domains with the hostnames to associate, or --domains '' to associate none. ...`.

## Data commands
- `data:pg:credentials:url` error messages ("no active credentials", "credential isn't active", "Essential-tier databases don't support named credentials") are now plain text. Previously the app/database name and credential name in these messages were colorized (`color.datastore`, `color.name`) with a `⛁` icon on the database name; the SDK throws plain, uncolored `Error`s instead.
- `data:pg:credentials:destroy`'s "you must detach the credential" error is now plain text. Previously the credential name and app name(s) in this message were colorized (`color.name`, `color.app`); the SDK throws a plain, uncolored `Error` instead.

## Ps commands

- `ps:type` (aliases `ps:resize`, `dyno:resize`) now reads and resizes the dyno formation through `@heroku/sdk` (`platform.formation.list`, `platform.dyno.scale`) and detects shielded spaces via `platform.app.isShielded` instead of raw `this.heroku.*` calls. These requests previously sent no explicit `Accept` header (`application/vnd.heroku+json; version=3`) and now default to `application/vnd.heroku+json; version=3.sdk`; the schemas are byte-identical, so the rendered tables and the Eco cost message are unchanged.
- `ps:wait` now polls for dyno convergence through `@heroku/sdk` (`platform.dyno.waitForRelease`) instead of a CLI-side loop over raw `this.heroku.*` calls. The target-release lookup and dyno polling previously sent no explicit `Accept` header (`application/vnd.heroku+json; version=3`) and now default to `application/vnd.heroku+json; version=3.sdk`; the schemas are byte-identical, so the progress fraction (`${done} / ${total}`), the `, done` suffix, and the no-releases warning are unchanged.
- `ps:autoscale:enable` and `ps:autoscale:disable` now make API calls through `@heroku/sdk` (`platform.app.info`, `platform.formation.list`, and the new `metrics.formationMonitor.{list,create,update}` client for `api.metrics.heroku.com`) instead of raw `this.heroku.*` calls. `ps:autoscale:disable`'s app lookup previously sent no explicit `Accept` header (`application/vnd.heroku+json; version=3`) and now defaults to `application/vnd.heroku+json; version=3.sdk` (`ps:autoscale:enable`'s app/formation lookups already sent `version=3.sdk`); the schemas are byte-identical, so behavior and output are unchanged.

## Pg commands

- `pg:backups:unschedule` now names the `DATABASE` argument, or the auto-selected schedule name, in the “no daily backups found” error instead of the add-on resource name.
- `pg:backups:schedule` now names the `DATABASE` argument, or `DATABASE_URL` when that argument is omitted, in the "not yet provisioned" error instead of the add-on resource name. The scheduling spinner still shows that add-on name when `database.describe` returns `name`; if `name` is absent it falls back to the `DATABASE` argument, then `DATABASE_URL`.
- `pg:backups:capture` now names the `DATABASE` argument, or `DATABASE_URL` when that argument is omitted, in the "not yet provisioned" error instead of the add-on resource name. The backup spinner still shows the resolved add-on name, since `captureAndWait` resolves it independently.
- `pg:links`, `pg:links:create`, `pg:links:destroy`, and `pg:connection-pooling:attach` now resolve databases through `@heroku/sdk`, so their not-found errors use the SDK's wording. For example, `Unknown database: FOO on <app>. Valid options are: …` (previously `Unknown database: FOO. Valid options are: …`) and `<app> has no heroku-postgresql databases` (previously `<app> has no databases`).
- `pg:links:create` now links a remote add-on that belongs to a different app when you pass its add-on name. Previously the CLI's fallback to a global add-on lookup never ran, so the command failed with `Couldn't find that add on.` A not-found error for the app itself still fails without retrying.
- `pg:links:create` now accepts only Heroku Postgres remotes, matching what Heroku Data Links supports, and fails before calling the API with `<remote> isn't a Heroku Postgres add-on, so it can't be linked. Data Links only connect Heroku Postgres databases.` (previously `Remote database must be heroku-redis or heroku-postgresql`). Previously it also accepted Heroku Key-Value Store (`heroku-redis`) remotes, which the Data Links API then rejected with a 404, and it accepted any plan whose name merely started with `heroku-redis` or `heroku-postgresql`. The remote's add-on service must now be exactly `heroku-postgresql` (or the `HEROKU_POSTGRESQL_ADDON_NAME` override).
- `pg:connection-pooling:attach` now prints `done` without a release version when the newest release can't be read, or the app has no releases, after the pool is attached. Previously the command failed even though the attachment had been created.
- `pg:settings` and every `pg:settings:*` command now resolve databases through `@heroku/sdk`, so their not-found errors use the SDK's wording (see Resolver changes).
- `pg:settings:*` commands now check `VALUE` before resolving the database. An invalid value (for example `pg:settings:log-lock-waits DATABASE maybe`) fails with the same `Invalid value` error, but no longer resolves the database first. So when both the database and the value are wrong, the value error is the one shown.
- `pg:settings:*` commands now fail with `UnknownDatabaseSettingError: <setting> isn't a setting available on <database>.` when the database doesn't report that setting. Previously they crashed with `Cannot read properties of undefined (reading 'value')`. When setting a value, a response that doesn't include the setting now fails with `UnknownDatabaseSettingError: The update to <setting> was sent to <database>, but the response didn't include <setting>, so the change couldn't be confirmed.` The update may still have been applied; run the command without `VALUE` to check.
- `pg:settings` and every `pg:settings:*` command now reject Advanced-tier databases before calling the Data API, with `You can't perform this operation on Advanced-tier databases.` and a pointer to `heroku data:pg:settings <database> --app <app>`, which manages Advanced-tier settings. These commands never worked on Advanced-tier databases: previously the Data API rejected the request with `You can't use this feature on advanced databases.`
- `pg:settings:log-min-duration-statement` now accepts only a whole number of milliseconds (including `0` and `-1`) and otherwise fails with `Invalid value. Valid options are: a whole number`. Previously `abc` was sent to the API as `null`, and values such as `1.5` or `10ms` were silently truncated to `1` or `10`.
- `pg:copy` performs one SDK-managed source credential lookup after destructive confirmation and before transfer creation. Additional-credential and sanitized lookup-failure warnings are displayed before the copy starts.
- `pg:promote` now passes `--force` through to the SDK readiness check. Without `--force`, a database that is not ready is rejected before any attachment mutation; previously the CLI could create a backup alias before rejecting it.
- `pg:promote` reports attachment and pooler progress as each operation completes and shows release-phase polling while it runs. The follower/read-only warning is displayed before release-phase polling when the promoted database is a follower.
- `pg:promote` distinguishes two unknown release-phase paths. When release-phase checking is active but the SDK cannot resolve the required Attach or Detach release, the SDK rejects with `DatabasePromotionError` caused by `DatabaseReleasePhaseError`; although the cause's message includes the app name, the CLI reports the generic `Unable to check release phase. Check your Attach DATABASE release for failures.` A fulfilled result with `releasePhase.status: 'unknown'` is a separate, defensive result path (not the SDK's normal missing-release behavior) and reports `Unable to check release phase for <app>. Check your Attach DATABASE release for failures.`

## Regions commands

- `regions` now uses the CLI's standard `--json` flag, so `HEROKU_CONTENT_TYPE=json` also switches it to JSON output and errors are rendered as a JSON error document.
- **`regions --json` output order changes (breaking)**: `--json` returns the SDK result unchanged, so regions are listed in the order the API returns them. Previously the JSON list was sorted (common runtime regions first, then by name). The table output is still sorted. `--common` and `--private` still select regions, and each region's fields are unchanged.

## Run commands

- `run`, `run:detached`, and `run:inside` now create dynos through `@heroku/sdk` (`platform.dyno.run`) instead of raw API calls.
- Release-conflict (`409`) retries during one-off dyno creation are now handled by the SDK; the CLI no longer runs its own retry loop.

## Review Apps commands

- `reviewapps:enable` and `reviewapps:disable` now fall back to the pipeline repository service when the repositories API account feature is disabled, instead of continuing without a repository name.

## Spaces commands

- `spaces:vpn:wait` no longer shows `VPN has been allocated.` when the status is already `active`. Instead it immediately shows `Waiting for VPN Connection ${name} to allocate... done`
- `spaces:vpn:wait` now has three dots (`.`) instead of six in `Waiting for VPN Connection ${name} to allocate... done`
- `spaces:create`, `spaces:destroy`, `spaces:hosts`, `spaces:info`, `spaces:rename`, `spaces:topology`, and `spaces:transfer` now make API calls through `@heroku/sdk`'s `platform` client instead of raw `this.heroku.*` calls. Calls that previously sent no explicit `Accept` header (`spaces:destroy`, `spaces:rename`, `spaces:topology`, `spaces:transfer`, and the app lookups made by `spaces:topology`) now default to `application/vnd.heroku+json; version=3.sdk` (previously `application/vnd.heroku+json; version=3`). `spaces:hosts` drops its explicit `version=3.dogwood` override in favor of the SDK's default `version=3.sdk`; the two variants' schemas are byte-identical, so there is no user-visible output change. `spaces:info` now drops its explicit `version=3.fir` header in favor of the SDK's default `version=3.sdk`; the human-readable table output is unchanged (Generation renders identically via the polymorphic `getGeneration`), but **`spaces:info --json` output shape changes (breaking)**: `generation` becomes a string (previously an object `{id, name}`); the object form is preserved under a new `generation_object` key, so consumers that need the id can read `generation_object.id`/`generation_object.name`; and additional fields (`channel_name`, `features`, `supported_features`, `eks_version`) may appear. No field is removed.
- `spaces:transfer` now surfaces API error messages via the SDK's error shape (`error.message`) instead of destructuring `error.body.message`. Behavior is unchanged when the API returns a JSON error body with a `message` field; errors without one now fall back to a generic message instead of throwing an unhandled `TypeError`.
