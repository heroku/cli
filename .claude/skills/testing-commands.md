---
name: testing-commands
description: Create or update unit tests for commands in packages/cli/src/commands directory
---

# Testing Commands Skill

When a command is added or modified in the `packages/cli/src/commands` directory, this skill helps create or update comprehensive unit tests following the project's testing patterns.

## Test File Location

Tests should be created in the corresponding path under `packages/cli/test/unit/commands/`. For example:
- Command: `packages/cli/src/commands/accounts/add.ts`
- Test: `packages/cli/test/unit/commands/accounts/add.unit.test.ts`

## Test Structure

Follow this structure when creating command tests:

1. **Imports**: Include these standard imports:
   - `import {expect} from 'chai'`
   - `import runCommand from '../../../helpers/runCommand.js'`
   - `import nock from 'nock'`
   - `import sinon from 'sinon'`
   - Import the command class being tested
   - Import any modules that need stubbing

2. **Test Suite**: Use `describe` blocks to organize tests:
   - Outer `describe` for the command name
   - Nested `describe` blocks for different scenarios

3. **Setup and Teardown**:
   - `beforeEach`: Set up stubs, mocks, and nock API interceptors
   - `afterEach`: Clean up with `sinon.restore()`, `api.done()`, `nock.cleanAll()`, and delete environment variables

4. **Test Cases**: Cover these scenarios:
   - Happy path: Successful command execution
   - Error cases: Missing authentication, missing required arguments, API failures
   - Edge cases: Empty responses, validation failures

## Example Test Pattern

```typescript
import {expect} from 'chai'
import runCommand from '../../../helpers/runCommand.js'
import nock from 'nock'
import sinon from 'sinon'
import Cmd from '../../../../src/commands/example/command.js'

describe('example:command', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    sinon.restore()
    api.done()
    nock.cleanAll()
  })

  it('should execute successfully with valid inputs', async function () {
    process.env.HEROKU_API_KEY = 'testKey'
    api.get('/endpoint')
      .reply(200, {data: 'value'})

    await runCommand(Cmd, ['arg1', 'arg2'])
    // Add assertions
  })

  it('should handle errors appropriately', async function () {
    // Test error scenarios
  })
})
```

## Key Testing Utilities

- **runCommand**: Helper function to execute commands in tests
- **nock**: Mock HTTP requests to the Heroku API
- **sinon**: Stub and spy on module functions
- **chai**: Assertion library using `expect` syntax

## When to Create or Update Tests

Create or update tests when:
- A new command file is added to `packages/cli/src/commands/`
- An existing command is modified with new functionality
- New arguments, flags, or options are added to a command
- Command behavior changes (error handling, validation, API calls)
- Bug fixes require test coverage to prevent regression

## Updating Existing Tests

When updating existing test files:
1. Read the existing test file to understand current coverage
2. Identify gaps based on command changes
3. Add new test cases following existing patterns in the file
4. Update assertions if command output has changed
5. Ensure all new code paths are covered
6. Maintain consistency with the file's existing style

## Test Coverage Goals

Aim to cover:
- All command arguments and flags
- Authentication requirements
- API interactions
- Error handling and validation
- User-facing messages and outputs
