export type TelemetryDrains = TelemetryDrain[]

export type TelemetryDrain = {
  id: string;
  signals: string[];
  owner: TelemetryDrainOwner;
  exporter: TelemetryExporter
}

type TelemetryDrainOwner = {
  id: string;
  type: 'app' | 'space';
}

type TelemetryExporter = {
  type: string;
  endpoint: string;
  headers: unknown;
}

type TelemetryDrainWithOptionalKeys = Partial<TelemetryDrain, 'exporter'>
type TelemetryExporterWithOptionalKeys = Partial<TelemetryExporter>
