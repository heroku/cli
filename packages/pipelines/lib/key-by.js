"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function keyBy(list, propertyOrCb) {
    const isCallback = typeof propertyOrCb === 'function';
    return list.reduce((memo, item) => {
        const key = isCallback ? propertyOrCb(item) : item[propertyOrCb];
        memo[key] = item;
        return memo;
    }, {});
}
exports.default = keyBy;
