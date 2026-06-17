# Touch ID Testing Guide

## How to Test Locally

The Touch ID feature can be tested locally without installing `ht` as a global command.

### Method 1: Using Environment Variable

Set the `HEROKU_TOUCH_ID_ENABLED` environment variable when running commands:

```bash
# Navigate to the CLI directory
cd /Users/USER/Documents/cli/packages/cli

# GET request - no Touch ID required
HEROKU_TOUCH_ID_ENABLED=true ./bin/run config -a fast-fortress-83917

# PATCH request - Touch ID required
HEROKU_TOUCH_ID_ENABLED=true ./bin/run config:set TEST_VAR=value -a fast-fortress-83917
```

### Method 2: Using the `ht` Binary (Local)

The `ht` command has Touch ID enabled by default:

```bash
cd /Users/USER/Documents/cli/packages/cli

# GET request - no Touch ID
./bin/ht config -a fast-fortress-83917

# PATCH request - Touch ID required
./bin/ht config:set TEST_VAR=value -a fast-fortress-83917
```

### Method 3: Export Environment Variable

Export the variable for your entire session:

```bash
export HEROKU_TOUCH_ID_ENABLED=true
cd /Users/USER/Documents/cli/packages/cli

# All mutating commands will now require Touch ID
./bin/run config:set KEY=value -a fast-fortress-83917
./bin/run apps:create my-test-app
```

## Debug Mode

Enable debug logging to see when Touch ID checks occur:

```bash
DEBUG_TOUCH_ID=1 HEROKU_TOUCH_ID_ENABLED=true ./bin/run config:set KEY=val -a your-app
```

## What to Expect

### GET/HEAD Requests (Read-only)
- `heroku config`
- `heroku apps:info`
- `heroku logs`

**Result**: No Touch ID prompt, command executes immediately

### POST/PUT/PATCH/DELETE Requests (Mutating)
- `heroku config:set`
- `heroku apps:create`
- `heroku addons:create`
- `heroku ps:scale`

**Result**: macOS authentication dialog appears (with Touch ID on supported devices)

## Testing on Non-macOS

On Linux/Windows, Touch ID is automatically skipped with a warning:

```
Touch ID not available on this device - proceeding without biometric authentication
```

## Disabling Touch ID

To disable Touch ID even when using `ht`:

```bash
HEROKU_DISABLE_TOUCH_ID=true ./bin/ht config:set KEY=val -a your-app
```

## Notes

- The `ht` command is NOT intended for production - it's just a local testing mechanism
- Touch ID uses macOS administrator authentication (same as `sudo`)
- On Macs with Touch ID, you can use your fingerprint instead of typing your password
- The authentication prompt will show the specific request being made (method + URL)
