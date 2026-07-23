# Heroku CLI v12 - User-Facing Changes

## Domains commands

- `domains:wait` now shows a single spinner for multiple pending domains: `Waiting for all pending domains... done`
- `domains:add --wait` no longer shows `Waiting for ${hostname)... done`

## Certs commands

- `certs:add` no longer shows the `Waiting for stable domains to be created...` spinner while domains stabilize; the wait now happens silently before the certificate is associated
- `certs:add` matches wildcard certificates against your app's domains more strictly: a `*.example.com` certificate now matches only direct subdomains (e.g. `www.example.com`), no longer matching deeper or trailing-suffix domains
## Run commands

- `run`, `run:detached`, and `run:inside` now create dynos through `@heroku/sdk` (`platform.dyno.run`) instead of raw API calls.
- Release-conflict (`409`) retries during one-off dyno creation are now handled by the SDK; the CLI no longer runs its own retry loop.

