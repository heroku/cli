/*
import {expect} from 'chai'
import {essentialPlan} from '../../../../src/lib/pg/util.js'
import {ExtendedAddonAttachment} from '@heroku/heroku-cli-util'


describe('util', function () {
  describe('essentialPlan', function () {
    it('correctly identifies essential plans', function () {
      const addon = (plan: string) => ({plan: {name: plan}})
      const parsed = (addon: unknown) => essentialPlan(addon as ExtendedAddonAttachment['addon'])

      expect(parsed(addon('heroku-postgresql:mini'))).to.equal(true)
      expect(parsed(addon('heroku-postgresql:basic'))).to.equal(true)
      expect(parsed(addon('heroku-postgresql:essential-0'))).to.equal(true)
      expect(parsed(addon('heroku-postgresql:standard-0'))).to.equal(false)
      expect(parsed(addon('heroku-postgresql:private-0'))).to.equal(false)
      expect(parsed(addon('heroku-postgresql:shield-0'))).to.equal(false)
    })
  })
})

*/
