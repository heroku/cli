# Heroku CLI v12 - User-Facing Changes

## Resolver changes

Many commands now resolve add-ons, add-on attachments, and Postgres databases through `@heroku/sdk` instead of the CLI's local resolvers or `heroku-cli-util`. These behavior changes apply broadly, wherever the new resolvers are used:

- **No global fallback.** An add-on identifier scoped to `--app` that isn't found on that app no longer retries as a global lookup — it fails immediately with a not-found error. Previously, an add-on that existed but wasn't attached to the specified app would still be found via a global retry in the CLI addons/resolve.ts lib file.
- **Specific wrong-service message.** When a database identifier matches an attachment that isn't on the configured Postgres add-on service, the SDK's Postgres database resolver now returns a specific message (`<name> is not a <service> database on <app>. Valid options are: <list>`) instead of the unformatted `Couldn't find that addon.` that `heroku-cli-util` returned.
- **App name added to the "unknown database" message.** When a database identifier doesn't match any attachment at all, `heroku-cli-util`'s fallback already returned `Unknown database: <name>. Valid options are: <list>`; the SDK's Postgres database resolver now returns the same message with the app name added: `Unknown database: <name> on <app>. Valid options are: <list>`.
- **Specific "app not found" message during database resolution.** When a database identifier fails to resolve because the app itself doesn't exist, the SDK's Postgres database resolver now returns `Couldn't find that app: <app>` instead of `heroku-cli-util`'s generic app-not-found error.
- **No color on identifiers in resolver errors.** `heroku-cli-util` colorized the app name in its "no databases" error. The SDK's resolver errors are plain text, so that identifier is no longer colorized.
- **Service name included in the "no databases" error.** The SDK's "no databases" error now names the add-on service it was looking for (`<app> has no <service> databases`), instead of `heroku-cli-util`'s generic `<app> has no databases`.
- **Ambiguous-match wording.** The SDK's ambiguous-identifier error says `multiple matching add-on attachments found: <names>.`, instead of `heroku-cli-util`'s `multiple matching add-ons found: <names>.`
- **Internal error class name in the message prefix.** The SDK's resolver error classes (e.g. `PgDatabaseNotFoundError`, `AddonAttachmentAmbiguousError`) set `name` to their class name, so an uncaught resolver error prints as `<ClassName>: <message>` (e.g. `PgDatabaseNotFoundError: Unknown database: ...`). `heroku-cli-util`'s equivalent errors didn't override `name`, so those showed a plain `Error: <message>`.
- **Extra "Caused by:" line for not-found errors.** The SDK's `PgDatabaseNotFoundError` is constructed with the original resolution error as its `cause`. oclif prints that as an additional `Caused by: <InternalClassName>: <message>` line below the main message.

## Apps commands

- `apps:create` now provisions add-ons, config vars, and buildpacks through `@heroku/sdk` (`platform.app.createAndSetup`). Setup runs as a single step, so the previous per-item progress lines (`Adding <addon>... done`, `Setting config vars... done`, `Setting buildpack to <url>... done`) are consolidated into the one `Creating app... done` spinner. The final status line (app name, region, and stack) is unchanged.
- `apps:errors` now queries router and formation error metrics through `@heroku/sdk` (`metrics.routerMetric.errors` / `metrics.formationMetric.errors`); the metrics host is now `api.metrics.heroku.com` (previously `api.metrics.herokai.com`).

## Certs commands

- `certs:add` matches wildcard certificates against your app's domains more strictly: a `*.example.com` certificate now matches only direct subdomains (e.g. `www.example.com`), no longer matching deeper or trailing-suffix domains

## Data commands
- `data:pg:credentials:url` error messages ("no active credentials", "credential isn't active", "Essential-tier databases don't support named credentials") are now plain text. Previously the app/database name and credential name in these messages were colorized (`color.datastore`, `color.name`) with a `⛁` icon on the database name; the SDK throws plain, uncolored `Error`s instead.

## Ps commands

- `ps:type` (aliases `ps:resize`, `dyno:resize`) now reads and resizes the dyno formation through `@heroku/sdk` (`platform.formation.list`, `platform.dyno.scale`) and detects shielded spaces via `platform.app.isShielded` instead of raw `this.heroku.*` calls. These requests previously sent no explicit `Accept` header (`application/vnd.heroku+json; version=3`) and now default to `application/vnd.heroku+json; version=3.sdk`; the schemas are byte-identical, so the rendered tables and the Eco cost message are unchanged.
- `ps:wait` now polls for dyno convergence through `@heroku/sdk` (`platform.dyno.waitForRelease`) instead of a CLI-side loop over raw `this.heroku.*` calls. The target-release lookup and dyno polling previously sent no explicit `Accept` header (`application/vnd.heroku+json; version=3`) and now default to `application/vnd.heroku+json; version=3.sdk`; the schemas are byte-identical, so the progress fraction (`${done} / ${total}`), the `, done` suffix, and the no-releases warning are unchanged.
- `ps:autoscale:enable` and `ps:autoscale:disable` now make API calls through `@heroku/sdk` (`platform.app.info`, `platform.formation.list`, and the new `metrics.formationMonitor.{list,create,update}` client for `api.metrics.heroku.com`) instead of raw `this.heroku.*` calls. `ps:autoscale:disable`'s app lookup previously sent no explicit `Accept` header (`application/vnd.heroku+json; version=3`) and now defaults to `application/vnd.heroku+json; version=3.sdk` (`ps:autoscale:enable`'s app/formation lookups already sent `version=3.sdk`); the schemas are byte-identical, so behavior and output are unchanged.

## Pg commands

- `pg:backups:unschedule` now names the `DATABASE` argument, or the auto-selected schedule name, in the “no daily backups found” error instead of the add-on resource name.
- `pg:backups:schedule` now names the `DATABASE` argument, or `DATABASE_URL` when that argument is omitted, in the "not yet provisioned" error instead of the add-on resource name. The scheduling spinner still shows that add-on name when `database.describe` returns `name`; if `name` is absent it falls back to the `DATABASE` argument, then `DATABASE_URL`.
- `pg:backups:capture` now names the `DATABASE` argument, or `DATABASE_URL` when that argument is omitted, in the "not yet provisioned" error instead of the add-on resource name. The backup spinner still shows the resolved add-on name, since `captureAndWait` resolves it independently.

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
