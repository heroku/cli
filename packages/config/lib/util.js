"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Editor = void 0;
const edit = require('edit-string');
// This indirection exists to give tests
// a way to stub calls to `edit(...)`
class Editor {
    edit(input, options = {}) {
        return edit(input, options);
    }
}
exports.Editor = Editor;
