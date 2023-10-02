import {Config} from '@oclif/core'

export const getConfig = () => new Config({root: '../../package.json'})
