import {stringToConfig} from '../../../src/commands/config/edit'
import {expect} from '../../test'

describe('config:edit', () => {
  describe('stringToConfig', () => {
    it('handles config vars with empty string values', () => {
      expect(stringToConfig("foo=''")).to.deep.equal({foo: ''})
      expect(stringToConfig('foo=""')).to.deep.equal({foo: ''})
      expect(stringToConfig('foo=')).to.deep.equal({foo: ''})
    })
  })
})
