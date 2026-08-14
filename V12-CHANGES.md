# Heroku CLI v12 - User-Facing Changes

## Apps commands

- `apps:create` now provisions add-ons, config vars, and buildpacks through `@heroku/sdk` (`platform.app.createAndSetup`). Setup runs as a single step, so the previous per-item progress lines (`Adding <addon>... done`, `Setting config vars... done`, `Setting buildpack to <url>... done`) are consolidated into the one `Creating app... done` spinner. The final status line (app name, region, and stack) is unchanged.
- `apps:errors` now queries router and formation error metrics through `@heroku/sdk` (`metrics.routerMetric.errors` / `metrics.formationMetric.errors`); the metrics host is now `api.metrics.heroku.com` (previously `api.metrics.herokai.com`).

## Certs commands

- `certs:add` matches wildcard certificates against your app's domains more strictly: a `*.example.com` certificate now matches only direct subdomains (e.g. `www.example.com`), no longer matching deeper or trailing-suffix domains

## Run commands

- `run`, `run:detached`, and `run:inside` now create dynos through `@heroku/sdk` (`platform.dyno.run`) instead of raw API calls.
- Release-conflict (`409`) retries during one-off dyno creation are now handled by the SDK; the CLI no longer runs its own retry loop.

