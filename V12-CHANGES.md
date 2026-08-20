# Heroku CLI v12 - User-Facing Changes

## Apps commands

- `apps:create` now provisions add-ons, config vars, and buildpacks through `@heroku/sdk` (`platform.app.createAndSetup`). Setup runs as a single step, so the previous per-item progress lines (`Adding <addon>... done`, `Setting config vars... done`, `Setting buildpack to <url>... done`) are consolidated into the one `Creating app... done` spinner. The final status line (app name, region, and stack) is unchanged.
- `apps:errors` now queries router and formation error metrics through `@heroku/sdk` (`metrics.routerMetric.errors` / `metrics.formationMetric.errors`); the metrics host is now `api.metrics.heroku.com` (previously `api.metrics.herokai.com`).

## Certs commands

- `certs:add` matches wildcard certificates against your app's domains more strictly: a `*.example.com` certificate now matches only direct subdomains (e.g. `www.example.com`), no longer matching deeper or trailing-suffix domains

## Run commands

- `run`, `run:detached`, and `run:inside` now create dynos through `@heroku/sdk` (`platform.dyno.run`) instead of raw API calls.
- Release-conflict (`409`) retries during one-off dyno creation are now handled by the SDK; the CLI no longer runs its own retry loop.

## Spaces commands

- `spaces:vpn:wait` no longer shows `VPN has been allocated.` when the status is already `active`. Instead it immediately shows `Waiting for VPN Connection ${name} to allocate... done`
- `spaces:vpn:wait` now has three dots (`.`) instead of six in `Waiting for VPN Connection ${name} to allocate... done`
- `spaces:create`, `spaces:destroy`, `spaces:hosts`, `spaces:info`, `spaces:rename`, `spaces:topology`, and `spaces:transfer` now make API calls through `@heroku/sdk`'s `platform` client instead of raw `this.heroku.*` calls. Calls that previously sent no explicit `Accept` header (`spaces:destroy`, `spaces:rename`, `spaces:topology`, `spaces:transfer`, and the app lookups made by `spaces:topology`) now default to `application/vnd.heroku+json; version=3.sdk` (previously `application/vnd.heroku+json; version=3`). `spaces:hosts` drops its explicit `version=3.dogwood` override in favor of the SDK's default `version=3.sdk`; the two variants' schemas are byte-identical, so there is no user-visible output change. `spaces:info` is unaffected: it still sends its explicit `version=3.fir` header, which is preserved unchanged.
- `spaces:transfer` now surfaces API error messages via the SDK's error shape (`error.message`) instead of destructuring `error.body.message`. Behavior is unchanged when the API returns a JSON error body with a `message` field; errors without one now fall back to a generic message instead of throwing an unhandled `TypeError`.
