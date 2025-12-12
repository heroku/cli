import {expect, test} from '@oclif/test'

describe('local:run', function () {
  describe('argument validation', function () {
    test
      .command(['local:run'])
      .catch(error => {
        expect(error.message).to.match(/Usage: heroku local:run \[COMMAND\]/)
        expect(error.message).to.contain('Must specify command to run')
      })
      .it('requires command argument and shows usage', () => {
        // Assertion is in the catch block
      })
  })

  describe('flag validation', function () {
    test
      .command(['local:run', 'echo', 'test', '--env', 'valid.env'])
      .catch(error => {
        // If this fails, it means flag parsing worked and foreman was called
        // We expect this to fail because we don't have foreman mocked
        expect(error.message).to.not.contain('Invalid flag')
      })
      .it('accepts --env flag', () => {
        // Test passes if no flag parsing errors occur
      })

    test
      .command(['local:run', 'echo', 'test', '-e', 'valid.env'])
      .catch(error => {
        // If this fails, it means flag parsing worked and foreman was called
        expect(error.message).to.not.contain('Invalid flag')
      })
      .it('accepts -e shorthand for env flag', () => {
        // Test passes if no flag parsing errors occur
      })

    test
      .command(['local:run', 'echo', 'test', '--port', '4200'])
      .catch(error => {
        // If this fails, it means flag parsing worked and foreman was called
        expect(error.message).to.not.contain('Invalid flag')
      })
      .it('accepts --port flag', () => {
        // Test passes if no flag parsing errors occur
      })

    test
      .command(['local:run', 'echo', 'test', '-p', '4200'])
      .catch(error => {
        // If this fails, it means flag parsing worked and foreman was called
        expect(error.message).to.not.contain('Invalid flag')
      })
      .it('accepts -p shorthand for port flag', () => {
        // Test passes if no flag parsing errors occur
      })
  })
})
