import {expect, test} from '@oclif/test'
import webhookType from '../src/webhook-type'

describe('webhooks:add', () => {
  test
    .do(function(){
        webhookType()
    })
    .it('adds a specific app webhook')
})
