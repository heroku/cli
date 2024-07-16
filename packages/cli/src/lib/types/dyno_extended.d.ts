import {Dyno} from '@heroku-cli/schema'

export interface DynoExtended extends Required<Dyno> {
  /**
   * Extended information.
   */
  extended?: {
    az: string,
    execution_plane: string,
    fleet: string,
    instance: string,
    ip: string,
    port: number,
    region: string,
    route: string,
  }
}
