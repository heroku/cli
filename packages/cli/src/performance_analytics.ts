interface Telemetry {
    command: string,
    os: string,
    version: string,
    exitCode: number,
    exitState: string[],
    cliRunDuration: number,
    commandRunDuration: number,
}

export interface TelemetryGlobal extends NodeJS.Global {
  cliTelemetry?: Telemetry
}


export function setupTelemetry(config: any, opts: any) {
    const now = new Date()
    const cmdStartTime = now.getTime()
    return {
        command: opts.Command.id,
        os: config.platform,
        version: config.version,
        exitCode: 0,
        exitState: [''],
        cliRunDuration: 0,
        commandRunDuration: cmdStartTime,
    }
}

export function computeDuration(cmdStartTime: any) {
    // calculate time duration from start time till now
    const now = new Date()
    const cmdFinishTime = now.getTime()

    return cmdFinishTime - cmdStartTime
}

export function reportCmdNotFound(config: any) {
    return {
        command: '',
        os: config.platform,
        version: config.version,
        exitCode: 0,
        exitState: ['command_not_found'],
        cliRunDuration: 0,
        commandRunDuration: 0,
    }
}

export function sendTelemetry(currentTelemetry: any) {
    // send captured cli telemetry to honeycomb
}