"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxBy = void 0;
function maxBy(arr, fn) {
    let max;
    for (const cur of arr) {
        const i = fn(cur);
        if (!max || i > max.i) {
            max = { i, element: cur };
        }
    }
    return max && max.element;
}
exports.maxBy = maxBy;
