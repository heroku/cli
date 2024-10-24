import {Dyno} from '@heroku-cli/schema'

export interface DynoExtended extends Required<Dyno> {
  /**
   * Extended information.
   */
  extended?: {
    az: string | null,
    execution_plane: string | null,
    fleet: string | null,
    instance: string | null,
    ip: string | null,
    port: number | null,
    region: string | null,
    route: string | null,
  }
}
