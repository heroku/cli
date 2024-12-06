import {expect, test} from '@oclif/test'

import {buildCommand, buildEnvFromFlag} from '../../../../src/lib/run/helpers'

describe('helpers.buildCommand()', function () {
  [
    {args: ['echo foo'], prependLauncher: false, expected: 'echo foo'},
    {args: ['echo foo'], prependLauncher: true, expected: 'launcher echo foo'},
    {args: ['echo', 'foo bar'], prependLauncher: false, expected: 'echo "foo bar"'},
    {args: ['echo', 'foo bar'], prependLauncher: true, expected: 'launcher echo "foo bar"'},
    {args: ['echo', 'foo', 'bar'], prependLauncher: false, expected: 'echo foo bar'},
    {args: ['echo', 'foo', 'bar'], prependLauncher: true, expected: 'launcher echo foo bar'},
    {args: ['echo', '{"foo": "bar"}'], prependLauncher: false, expected: 'echo "{\\"foo\\": \\"bar\\"}"'},
    {args: ['echo', '{"foo": "bar"}'], prependLauncher: true, expected: 'launcher echo "{\\"foo\\": \\"bar\\"}"'},
    {args: ['echo', '{"foo":"bar"}'], prependLauncher: false, expected: 'echo "{\\"foo\\":\\"bar\\"}"'},
    {args: ['echo', '{"foo":"bar"}'], prependLauncher: true, expected: 'launcher echo "{\\"foo\\":\\"bar\\"}"'},
  ].forEach(example => {
    test
      .it(`parses \`${example.args.join(' ')}\` ${example.prependLauncher ? 'with' : 'without'} \`prependLauncher\` as \`${example.expected}\``, () => {
        expect(buildCommand(example.args, example.prependLauncher)).to.equal(example.expected)
      })
  })
})

describe('helpers.buildEnvFromFlag()', function () {
  it('returns an object with env key value pairs when one environment variable is given', function () {
    const envFlag = 'KEY=value'
    const envResult = buildEnvFromFlag(envFlag)
    expect(envResult).to.deep.equal({KEY: 'value'})
  })

  it('returns an object with env key value pairs when multiple environment variables are given, separated by semicolons', function () {
    const envFlag = 'KEY=value;KEY2=value2'
    const envResult = buildEnvFromFlag(envFlag)
    expect(envResult).to.deep.equal({KEY: 'value', KEY2: 'value2'})
  })

  const envFlagSemiKey = 'K;EY=value'
  test
    .stderr()
    .do(() => buildEnvFromFlag(envFlagSemiKey))
    .it('returns a warning when a semicolon is used as part of the key', context => {
      expect(context.stderr).to.contain("Warning: env flag K appears invalid. Avoid using ';' in values.")
    })

  const envFlagSemiValue = 'KEY=val;ue'
  test
    .stderr()
    .do(() => buildEnvFromFlag(envFlagSemiValue))
    .it('returns a warning when a semicolon is used as part of the value', context => {
      expect(context.stderr).to.contain("Warning: env flag ue appears invalid. Avoid using ';' in values.")
    })
})

