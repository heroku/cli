import {describe, it} from 'mocha'
import {expect} from 'chai'
import {Scrubber} from '../../../../src/lib/data-scrubber/scrubber.js'

describe('Scrubber', () => {
  describe('Field-based scrubbing', () => {
    it('scrubs sensitive fields at any depth', () => {
      const scrubber = new Scrubber({
        fields: ['access_token'],
      })

      const input = {
        user: {
          profile: {
            settings: {
              auth: {access_token: 'secret123'},
            },
          },
        },
      }

      const {data} = scrubber.scrub(input)
      expect(data.user.profile.settings.auth.access_token).to.equal(
        '[SCRUBBED]',
      )
    })

    it('handles case-insensitive field matching', () => {
      const scrubber = new Scrubber({
        fields: ['password'],
      })

      const input = {
        Password: 'secret1',
        PASSWORD: 'secret2',
        password: 'secret3',
      }

      const {data} = scrubber.scrub(input)
      expect(data.Password).to.equal('[SCRUBBED]')
      expect(data.PASSWORD).to.equal('[SCRUBBED]')
      expect(data.password).to.equal('[SCRUBBED]')
    })

    it('supports regex field patterns', () => {
      const scrubber = new Scrubber({
        fields: [/api[-_]?key/i], // Matches api_key, api-key, apikey (case insensitive)
      })

      const input = {
        user_api_key: 'secret',
        API_KEY_V2: 'secret',
        myApiKeyHere: 'secret',
      }

      const {data} = scrubber.scrub(input)
      expect(data.user_api_key).to.equal('[SCRUBBED]')
      expect(data.API_KEY_V2).to.equal('[SCRUBBED]')
      expect(data.myApiKeyHere).to.equal('[SCRUBBED]')
    })
  })

  describe('Path-based scrubbing', () => {
    it('scrubs specific paths only', () => {
      const scrubber = new Scrubber({
        paths: ['user.profile.email'],
      })

      const input = {
        user: {
          profile: {email: 'bob@example.com', name: 'Bob'},
          settings: {email: 'notifications@example.com'},
        },
      }

      const {data} = scrubber.scrub(input)
      expect(data.user.profile.email).to.equal('[SCRUBBED]')
      expect(data.user.settings.email).to.equal('notifications@example.com')
    })

    it('scrubs array items by index', () => {
      const scrubber = new Scrubber({
        paths: ['users[0].password'],
      })

      const input = {
        users: [
          {name: 'bob', password: 'secret1'},
          {name: 'alice', password: 'secret2'},
        ],
      }

      const {data} = scrubber.scrub(input)
      expect(data.users?.[0]?.password).to.equal('[SCRUBBED]')
      expect(data.users?.[1]?.password).to.equal('secret2')
    })
  })

  describe('Pattern-based scrubbing', () => {
    it('scrubs SSN patterns in strings', () => {
      const scrubber = new Scrubber({
        patterns: [/\b\d{3}-\d{2}-\d{4}\b/g],
      })

      const input = {message: 'User SSN is 123-45-6789'}
      const {data} = scrubber.scrub(input)
      expect(data.message).to.contain('[SCRUBBED]')
      expect(data.message).not.to.contain('123-45-6789')
    })

    it('scrubs email patterns in strings', () => {
      const scrubber = new Scrubber({
        patterns: [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g],
      })

      const input = {log: 'Auth failed for user@example.com'}
      const {data} = scrubber.scrub(input)
      expect(data.log).to.contain('[SCRUBBED]')
      expect(data.log).not.to.contain('user@example.com')
    })

    it('scrubs multiple patterns in same string', () => {
      const scrubber = new Scrubber({
        patterns: [
          /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
        ],
      })

      const input = {
        log: 'User bob@example.com has SSN 123-45-6789',
      }

      const {data} = scrubber.scrub(input)
      expect(data.log).not.to.contain('bob@example.com')
      expect(data.log).not.to.contain('123-45-6789')
    })
  })

  describe('Array handling', () => {
    it('scrubs fields across all array items', () => {
      const scrubber = new Scrubber({
        fields: ['password'],
      })

      const users = [
        {name: 'bob', password: 'secret'},
        {name: 'alice', password: 'hidden'},
      ]

      const {data} = scrubber.scrub(users)
      expect(data[0]?.password).to.equal('[SCRUBBED]')
      expect(data[1]?.password).to.equal('[SCRUBBED]')
      expect(data[0]?.name).to.equal('bob')
      expect(data[1]?.name).to.equal('alice')
    })

    it('handles nested arrays', () => {
      const scrubber = new Scrubber({
        fields: ['api_key'],
      })

      const input = {
        teams: [
          {
            members: [
              {name: 'bob', api_key: 'secret1'},
              {name: 'alice', api_key: 'secret2'},
            ],
          },
        ],
      }

      const {data} = scrubber.scrub(input)
      expect(data.teams?.[0]?.members?.[0]?.api_key).to.equal('[SCRUBBED]')
      expect(data.teams?.[0]?.members?.[1]?.api_key).to.equal('[SCRUBBED]')
    })
  })

  describe('Circular reference handling', () => {
    it('handles circular references without crashing', () => {
      const scrubber = new Scrubber({fields: []})
      const input: any = {name: 'test'}
      input.self = input

      const {data} = scrubber.scrub(input)
      expect(data.self).to.equal('[Circular Reference]')
    })

    it('scrubs fields before detecting circular references', () => {
      const scrubber = new Scrubber({fields: ['password']})
      const input: any = {name: 'test', password: 'secret'}
      input.self = input

      const {data} = scrubber.scrub(input)
      expect(data.password).to.equal('[SCRUBBED]')
      expect(data.self).to.equal('[Circular Reference]')
    })

    it('handles nested circular references', () => {
      const scrubber = new Scrubber({fields: []})
      const input: any = {name: 'test', nested: {level: 1}}
      input.self = input
      input.nested.parent = input

      const {data} = scrubber.scrub(input)
      expect(data.self).to.equal('[Circular Reference]')
      expect(data.nested.parent).to.equal('[Circular Reference]')
    })
  })

  describe('Combined modes', () => {
    it('applies field + path + pattern scrubbing together', () => {
      const scrubber = new Scrubber({
        fields: ['api_key'],
        paths: ['user.email'],
        patterns: [/\b\d{3}-\d{2}-\d{4}\b/g],
      })

      const input = {
        user: {
          email: 'bob@example.com', // Path-based
          api_key: 'secret-key-123', // Field-based
        },
        log: 'SSN: 123-45-6789', // Pattern-based
        nested: {
          service: {
            api_key: 'another-secret', // Field-based (any depth)
          },
        },
      }

      const {data, scrubbedPaths} = scrubber.scrub(input)
      expect(data.user?.email).to.equal('[SCRUBBED]')
      expect(data.user?.api_key).to.equal('[SCRUBBED]')
      expect(data.log).not.to.contain('123-45-6789')
      expect(data.nested?.service?.api_key).to.equal('[SCRUBBED]')
      expect(scrubbedPaths.length).to.be.greaterThan(0)
    })
  })

  describe('Scrub result metadata', () => {
    it('tracks scrubbed paths', () => {
      const scrubber = new Scrubber({
        fields: ['password'],
        paths: ['user.email'],
      })

      const input = {
        user: {email: 'test@example.com', password: 'secret'},
      }

      const result = scrubber.scrub(input)
      expect(result.scrubbed).to.be.true
      expect(result.scrubbedPaths).to.include.members([
        'user.email',
        'user.password',
      ])
    })

    it('reports scrubbed=false when nothing was scrubbed', () => {
      const scrubber = new Scrubber({
        fields: ['password'],
      })

      const input = {name: 'Bob', age: 30}
      const result = scrubber.scrub(input)
      expect(result.scrubbed).to.be.false
      expect(result.scrubbedPaths).to.have.length(0)
    })
  })

  describe('Immutability', () => {
    it('does not mutate original object', () => {
      const scrubber = new Scrubber({
        fields: ['password'],
      })

      const input = {user: {password: 'secret', name: 'Bob'}}
      const original = JSON.stringify(input)

      scrubber.scrub(input)

      expect(JSON.stringify(input)).to.equal(original)
      expect(input.user.password).to.equal('secret')
    })
  })

  describe('Custom replacement text', () => {
    it('uses custom replacement string', () => {
      const scrubber = new Scrubber({
        fields: ['password'],
        replacement: '***REDACTED***',
      })

      const input = {password: 'secret'}
      const {data} = scrubber.scrub(input)
      expect(data.password).to.equal('***REDACTED***')
    })
  })

  describe('Edge cases', () => {
    it('handles null values', () => {
      const scrubber = new Scrubber({fields: ['password']})
      const input = {user: null}
      const {data} = scrubber.scrub(input)
      expect(data.user).to.be.null
    })

    it('handles undefined values', () => {
      const scrubber = new Scrubber({fields: ['password']})
      const input = {user: undefined}
      const {data} = scrubber.scrub(input)
      expect(data.user).to.be.undefined
    })

    it('handles empty objects', () => {
      const scrubber = new Scrubber({fields: ['password']})
      const input = {}
      const {data} = scrubber.scrub(input)
      expect(data).to.deep.equal({})
    })

    it('handles empty arrays', () => {
      const scrubber = new Scrubber({fields: ['password']})
      const input: any[] = []
      const {data} = scrubber.scrub(input)
      expect(data).to.deep.equal([])
    })

    it('handles primitive values', () => {
      const scrubber = new Scrubber({fields: ['password']})
      expect(scrubber.scrub('test').data).to.equal('test')
      expect(scrubber.scrub(123).data).to.equal(123)
      expect(scrubber.scrub(true).data).to.equal(true)
    })

    it('scrubs entire array element by index path', () => {
      // Tests lines 76-78: scrubbing entire array element, not just a field
      const scrubber = new Scrubber({
        paths: ['users[0]', 'items[1]'], // Scrub specific array elements by full path
      })

      const input = {
        users: [
          {name: 'bob', email: 'bob@example.com'}, // Should be scrubbed entirely
          {name: 'alice', email: 'alice@example.com'}, // Not scrubbed
        ],
        items: [
          {id: 1, value: 'keep'}, // Not scrubbed
          {id: 2, value: 'scrub'}, // Should be scrubbed entirely
        ],
      }

      const {data} = scrubber.scrub(input)
      expect(data.users?.[0]).to.equal('[SCRUBBED]')
      expect(data.users?.[1]?.name).to.equal('alice') // Not scrubbed
      expect(data.items?.[0]?.value).to.equal('keep') // Not scrubbed
      expect(data.items?.[1]).to.equal('[SCRUBBED]') // Entire element scrubbed
    })

    it('scrubs array index across all arrays', () => {
      // Tests that index-only paths (e.g., '0') scrub that index in ALL arrays
      const scrubber = new Scrubber({
        paths: ['1'], // Scrub index 1 of ANY array
      })

      const input = {
        users: [
          {name: 'bob'}, // Index 0 - not scrubbed
          {name: 'alice'}, // Index 1 - scrubbed
          {name: 'charlie'}, // Index 2 - not scrubbed
        ],
        teams: [
          {id: 'team-a'}, // Index 0 - not scrubbed
          {id: 'team-b'}, // Index 1 - scrubbed
        ],
      }

      const {data} = scrubber.scrub(input)
      expect(data.users?.[0]?.name).to.equal('bob')
      expect(data.users?.[1]).to.equal('[SCRUBBED]') // Scrubbed by index
      expect(data.users?.[2]?.name).to.equal('charlie')
      expect(data.teams?.[0]?.id).to.equal('team-a')
      expect(data.teams?.[1]).to.equal('[SCRUBBED]') // Scrubbed by index
    })

    it('handles deeply nested objects (10+ levels)', () => {
      // Validates discovery doc requirement: "Scrubs nested objects 10+ levels deep"
      const scrubber = new Scrubber({
        fields: ['secret'],
      })

      // Build a 15-level deep object
      const input: any = {level: 1}
      let current = input
      for (let i = 2; i <= 15; i++) {
        current.nested = {level: i}
        current = current.nested
      }

      // Add secret at the deepest level
      current.secret = 'deep-secret'
      current.public = 'visible'

      const {data} = scrubber.scrub(input)

      // Navigate to the deepest level
      let deepest: any = data
      for (let i = 1; i < 15; i++) {
        expect(deepest.level).to.equal(i)
        deepest = deepest.nested
      }

      // Verify scrubbing worked at 15 levels deep
      expect(deepest.level).to.equal(15)
      expect(deepest.secret).to.equal('[SCRUBBED]')
      expect(deepest.public).to.equal('visible')
    })

    it('handles circular references in deep clone fallback (arrays)', () => {
      // Tests lines 166-172: circular reference deep clone for arrays
      const scrubber = new Scrubber({
        fields: ['password'],
      })

      // Create an object with circular references that will trigger the fallback clone
      const parent: any = {name: 'parent', password: 'secret'}
      const child1: any = {name: 'child1', items: []}
      const child2 = {name: 'child2', password: 'hidden'}

      // Create circular reference in an array
      child1.items = [child2, parent] // Array contains parent
      parent.children = [child1] // Parent contains array with circular ref

      const {data} = scrubber.scrub(parent)

      // Verify scrubbing happened
      expect(data.password).to.equal('[SCRUBBED]')
      expect(data.children?.[0]?.name).to.equal('child1')

      // Verify circular reference was handled in the array
      expect(data.children?.[0]?.items?.[1]).to.equal('[Circular Reference]')
    })

    it('handles arrays with circular self-reference', () => {
      // Additional test for circular array deep cloning
      const scrubber = new Scrubber({
        fields: ['token'],
      })

      const obj: any = {
        token: 'secret-token',
        list: [{name: 'item1'}],
      }
      // Array references the parent object
      obj.list.push(obj)

      const {data} = scrubber.scrub(obj)

      expect(data.token).to.equal('[SCRUBBED]')
      expect(data.list?.[0]?.name).to.equal('item1')
      expect(data.list?.[1]).to.equal('[Circular Reference]')
    })
  })
})
