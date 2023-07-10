"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stages_1 = require("./stages");
function infer(app) {
    const inferredStage = stages_1.inferrableStages.find(stage => stage.inferRegex.test(app));
    if (inferredStage) {
        return [app.replace(inferredStage.inferRegex, ''), inferredStage.name];
    }
    return [app, 'production'];
}
exports.default = infer;
