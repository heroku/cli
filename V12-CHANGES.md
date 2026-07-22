# Heroku CLI v12 - User-Facing Changes

## Domains commands

- `domains:wait` now shows a single spinner for multiple pending domains: `Waiting for all pending domains for app ${app}... done`
- `domains:add --wait` no longer shows `Waiting for ${hostname)... done`

## Run commands

- `run`, `run:detached`, and `run:inside` now create dynos through `@heroku/sdk` (`platform.dyno.run`) instead of raw API calls.
- Release-conflict (`409`) retries during one-off dyno creation are now handled by the SDK; the CLI no longer runs its own retry loop.

