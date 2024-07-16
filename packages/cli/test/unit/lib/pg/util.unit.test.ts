import {expect} from 'chai'
import {essentialPlan, parsePostgresConnectionString} from '../../../../src/lib/pg/util'
import {AddOnAttachmentWithConfigVarsAndPlan} from '../../../../src/lib/pg/types'

describe('util', function () {
  describe('parsePostgresConnectionString', function () {
    it('correctly parses relative connection strings', function () {
      const connString = 'myapp/my_database_name'
      const parsed = parsePostgresConnectionString(connString)

      expect(parsed.database).to.equal('myapp/my_database_name')
      expect(parsed.host).to.equal('')
      expect(parsed.port).to.equal('')
    })

    it('correctly parses absolute connection strings', function () {
      const connString = 'postgres://localhost:5432/myapp/my_database_name?application_name=myapp&sslmode=require'
      const parsed = parsePostgresConnectionString(connString)

      expect(parsed.database).to.equal('myapp/my_database_name')
      expect(parsed.host).to.equal('localhost')
      expect(parsed.port).to.equal('5432')
    })

    it('correctly parses connection strings with auth', function () {
      const connString = 'postgres://user:pass@198.0.0.1:5432/my_database_name'
      const parsed = parsePostgresConnectionString(connString)

      expect(parsed.database).to.equal('my_database_name')
      expect(parsed.host).to.equal('198.0.0.1')
      expect(parsed.port).to.equal('5432')
      expect(parsed.user).to.equal('user')
      expect(parsed.password).to.equal('pass')
    })
  })

  describe('essentialPlan', function () {
    it('correctly identifies essential plans', function () {
      const addon = (plan: string) => ({plan: {name: plan}})
      const parsed = (addon: unknown) => essentialPlan(addon as AddOnAttachmentWithConfigVarsAndPlan)

      expect(parsed(addon('heroku-postgresql:mini'))).to.equal(true)
      expect(parsed(addon('heroku-postgresql:basic'))).to.equal(true)
      expect(parsed(addon('heroku-postgresql:essential-0'))).to.equal(true)
      expect(parsed(addon('heroku-postgresql:standard-0'))).to.equal(false)
      expect(parsed(addon('heroku-postgresql:private-0'))).to.equal(false)
      expect(parsed(addon('heroku-postgresql:shield-0'))).to.equal(false)
    })
  })
})
