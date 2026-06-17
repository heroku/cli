# Touch ID Local Testing Guide

## Quick Start

Test Touch ID authentication locally without installing globally:

```bash
cd /Users/USER/Documents/cli

# Test read-only command (no Touch ID)
HEROKU_TOUCH_ID_ENABLED=true ./bin/run.js config -a your-app

# Test mutating command (Touch ID required)
HEROKU_TOUCH_ID_ENABLED=true ./bin/run.js config:set TEST_KEY=test_value -a your-app
```

## What You'll See

### Read-Only Commands (GET/HEAD)
```bash
HEROKU_TOUCH_ID_ENABLED=true ./bin/run.js apps:info my-app
```
- No Touch ID prompt
- Command executes immediately

### Mutating Commands (POST/PUT/PATCH/DELETE)
```bash
HEROKU_TOUCH_ID_ENABLED=true ./bin/run.js config:set KEY=value -a my-app
```
- Console shows: `🔐 Touch ID authentication required for PATCH request`
- Native macOS dialog appears with "Authenticate to allow Heroku CLI PATCH request"
- Use Touch ID fingerprint (or password as fallback)
- Console shows: `Touch ID authenticated... ✓`
- Command executes

## Testing Methods

### Method 1: Environment Variable (Recommended)
```bash
export HEROKU_TOUCH_ID_ENABLED=true
./bin/run.js config:set KEY=value -a your-app
./bin/run.js apps:create my-test-app
```

### Method 2: Per-Command
```bash
HEROKU_TOUCH_ID_ENABLED=true ./bin/run.js addons:create heroku-postgresql -a app
```

### Method 3: ht Command
```bash
# ht has Touch ID enabled by default
./bin/ht config:set KEY=value -a your-app
```

## Debug Mode

See what's happening behind the scenes:

```bash
DEBUG_TOUCH_ID=1 HEROKU_TOUCH_ID_ENABLED=true ./bin/run.js config:set KEY=val -a app
```

Output:
```
[Touch ID Debug] Init hook running, Touch ID enabled
[Touch ID Debug] Found heroku getter, wrapping it
[Touch ID Debug] Wrapping API client
[Touch ID Debug] Method: PATCH, URL: /apps/app/config-vars, Requires auth: true
🔐 Touch ID authentication required for PATCH request
Touch ID authenticated... ✓
```

## Test Cases

### Should NOT Require Touch ID
- `heroku config -a app`
- `heroku apps:info app`
- `heroku logs -a app`
- `heroku releases -a app`

### SHOULD Require Touch ID
- `heroku config:set KEY=value -a app`
- `heroku apps:create new-app`
- `heroku addons:create service -a app`
- `heroku ps:scale web=2 -a app`
- `heroku maintenance:on -a app`

## Disabling Touch ID

Even with `HEROKU_TOUCH_ID_ENABLED`, you can disable:

```bash
HEROKU_DISABLE_TOUCH_ID=true ./bin/run.js config:set KEY=val -a app
```

## Platform Behavior

### macOS with Touch ID
- Native dialog with fingerprint icon
- Use Touch ID sensor or password

### macOS without Touch ID  
- Falls back to password-only authentication
- Still uses secure LocalAuthentication framework

### Linux/Windows
- Touch ID checks automatically skipped
- Shows warning: "Touch ID not available on this device"
- Command proceeds normally

## Troubleshooting

### "Touch ID not available"
- Check if your Mac has Touch ID hardware
- Verify Touch ID is enabled in System Preferences
- Try: `swift scripts/touch-id-auth.swift "Test"` directly

### Authentication dialog doesn't appear
- Verify `HEROKU_TOUCH_ID_ENABLED=true` is set
- Check debug output with `DEBUG_TOUCH_ID=1`
- Ensure you're running a mutating command (not GET)

### Build required
If you modified source files:
```bash
npm run build
```

## Production Notes

- `ht` command is for testing only
- Production usage: set `HEROKU_TOUCH_ID_ENABLED=true` in shell profile
- Or create an alias: `alias ht='HEROKU_TOUCH_ID_ENABLED=true heroku'`
- Touch ID has no effect on regular `heroku` command unless explicitly enabled
