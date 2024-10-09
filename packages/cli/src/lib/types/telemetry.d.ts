export type TelemetryDrains = TelemetryDrain[]

export type TelemetryDrain = {
  id: string;
  capabilities: string[];
  owner: TelemetryDrainOwner;
  exporter: TelemetryExporter
}

type TelemetryDrainOwner = {
  id: string;
  name?: string;
  type: 'app' | 'space';
}

type TelemetryExporter = {
  type: 'otlphttp' | 'otlpgrpc';
  endpoint: string;
  headers: unknown;
}
