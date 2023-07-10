"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.names = exports.inferrableStageNames = exports.inferrableStages = void 0;
const INFERRABLE_STAGES = [
    {
        name: 'development',
        inferRegex: /-(dev|development|uat|tst|test|qa)$/,
    },
    {
        name: 'staging',
        inferRegex: /-(stg|staging)$/,
    },
    {
        name: 'production',
        inferRegex: /-(prd|prod|production|admin|demo)$/,
    },
];
exports.inferrableStages = INFERRABLE_STAGES;
const INFERRABLE_STAGE_NAMES = INFERRABLE_STAGES.map(stage => stage.name);
exports.inferrableStageNames = INFERRABLE_STAGE_NAMES;
const STAGE_NAMES = ['review'].concat(INFERRABLE_STAGE_NAMES);
exports.names = STAGE_NAMES;
