import {Hook} from '@oclif/config'

export const brewHook: Hook<'update'> = async function () {
  // autocomplete is now in core, skip windows
  if (this.config.windows) return
  this.config.runHook('recache', {type: 'update'})
}
