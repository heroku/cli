import {Hook} from '@oclif/core'

export const brewHook: Hook<'update'> = async function () {
  // autocomplete is now in core, skip windows
  if (this.config.windows) return
  await this.config.runHook('recache', {type: 'update'})
}
