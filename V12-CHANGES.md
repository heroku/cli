# Heroku CLI v12 - User-Facing Changes

## Certs commands

- `certs:add` matches wildcard certificates against your app's domains more strictly: a `*.example.com` certificate now matches only direct subdomains (e.g. `www.example.com`), no longer matching deeper or trailing-suffix domains

## Run commands

- `run`, `run:detached`, and `run:inside` now create dynos through `@heroku/sdk` (`platform.dyno.run`) instead of raw API calls.
- Release-conflict (`409`) retries during one-off dyno creation are now handled by the SDK; the CLI no longer runs its own retry loop.

