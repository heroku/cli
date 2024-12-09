import {Dyno} from './fir'

export interface DynoExtended extends Dyno {
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
  [name: string]: unknown
}
