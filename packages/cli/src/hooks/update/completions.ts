import {Hook} from '@oclif/config'

export const brewHook: Hook<'update'> = async function () {
  this.config.runHook('recache', {type: 'update'})
}
