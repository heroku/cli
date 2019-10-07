const edit = require('edit-string')

// This indirection exists to give tests
// a way to stub calls to `edit(...)`
export class Editor {
  edit(input: string, options = {}) {
    return edit(input, options)
  }
}
