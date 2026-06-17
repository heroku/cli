# Touch ID Authentication for Heroku CLI

This module adds Touch ID biometric authentication to the Heroku CLI for enhanced security on macOS devices.

## Features

- **Automatic Touch ID Prompt**: Any non-GET HTTP request (POST, PUT, PATCH, DELETE) will trigger a Touch ID authentication prompt on macOS devices with Touch ID enabled.
- **Platform Detection**: Automatically detects if Touch ID is available and falls back gracefully on unsupported platforms.
- **Alternate Command**: Use `ht` command instead of `heroku` to enable Touch ID authentication.
- **Environment Control**: Can be enabled/disabled via environment variables.

## How It Works

1. **Hook Integration**: The `touch-id` hook is registered in the `init` lifecycle and wraps the APIClient instance.
2. **Request Interception**: All APIClient requests are intercepted before execution.
3. **Selective Authentication**: Only mutating requests (POST, PUT, PATCH, DELETE) require Touch ID authentication.
4. **Graceful Fallback**: On non-macOS platforms or when Touch ID is unavailable, requests proceed normally with a warning.

## Usage

### Option 1: Use the `ht` Command

The `ht` command is an alternate entry point with Touch ID enabled by default:

```bash
# Read-only operations work without Touch ID
ht config

# Mutating operations require Touch ID authentication
ht config:set KEY=value
ht apps:create my-app
ht addons:create heroku-postgresql
```

### Option 2: Enable Touch ID for Regular `heroku` Command

Set the environment variable to enable Touch ID:

```bash
export HEROKU_TOUCH_ID_ENABLED=true
heroku config:set KEY=value  # Now requires Touch ID
```

### Disabling Touch ID

To disable Touch ID authentication, set the environment variable:

```bash
export HEROKU_DISABLE_TOUCH_ID=1
```

Or for a single command:

```bash
HEROKU_DISABLE_TOUCH_ID=1 heroku apps:create my-app
```

## Supported Platforms

- **macOS**: Full Touch ID support on devices with Touch ID sensors (MacBook Pro 2016+, MacBook Air 2018+, iMac with Touch ID keyboard)
- **Linux/Windows**: Touch ID prompts are skipped, requests proceed normally

## Security Considerations

- Touch ID authentication adds an additional layer of security for sensitive operations
- Failed or cancelled Touch ID authentication will prevent the API request from executing
- GET and HEAD requests are exempt as they are read-only operations
- Authentication happens before any API request is sent to Heroku servers

## Implementation Details

### Files

- **`touch-id.ts`**: Core Touch ID authentication logic using macOS LocalAuthentication framework
- **`api-client-wrapper.ts`**: APIClient wrapper that intercepts requests
- **`hooks/init/touch-id.ts`**: Initialization hook that applies the wrapper

### Dependencies

Uses macOS system tools:
<!-- cSpell:words bioutil osascript -->
- `bioutil`: Check if Touch ID is available
- `osascript`: Execute AppleScript to trigger LocalAuthentication framework

No additional npm dependencies required.

## Testing

Run the test suite:

```bash
yarn test:unit
```

The Touch ID module includes unit tests for request type detection and platform compatibility.

## Future Enhancements

Potential improvements:
- Support for Windows Hello biometric authentication
- Configurable timeout for Touch ID prompt
- Per-command Touch ID requirements
- Touch ID authentication caching with configurable TTL
