import {Hook} from '@oclif/core'

const doRecache: Hook<'update'> = async function () {
  // autocomplete is now in core, skip windows
  if (this.config.windows) return
  await this.config.runHook('recache', {type: 'update'})
}

export default doRecache
