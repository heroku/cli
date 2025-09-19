export type HerokuStatus = {
  status: SystemStatus[]
  incidents: HerokuIncident[] | []
  scheduled: HerokuScheduledMaintenance[] | []
}

export type FormattedTrustStatus = {
  status: SystemStatus[]
  incidents: TrustIncident[]
  scheduled: TrustMaintenance[]
}

/*
SF Trust API
 */
export type TrustInstance = {
  key: string;
  location: string;
  environment: string;
  releaseVersion: string;
  releaseNumber: string;
  status: string;
  isActive: boolean;
  city: string;
  stateName: string;
  stateCode: string;
  countryName: string;
  countryCode: string;
  maintenanceWindow: string;
  Services: TrustService[];
  Products: TrustProduct[];
  Incidents: TrustIncident[];
  Tags: TrustTag[];
}

export type TrustIncident = {
  id: number;
  message?: {
    pathToResolution?: string | null;
    actionPlan?: string | null;
    rootCause?: string | null;
  },
  externalId?: string | null;
  affectsAll: boolean;
  isCore: boolean;
  additionalInformation?: string;
  serviceKeys: string[];
  instanceKeys: string[];
  IncidentImpacts: TrustIncidentImpact[]
  IncidentEvents: TrustEvent[]
  createdAt: string;
  updatedAt: string;
}

export type TrustMaintenance = {
  id: number;
  message?: {
    maintenanceType?: string;
    availability?: string;
    eventStatus?: confirmed;
  }
  externalId?: string;
  name?: string;
  externalMaintenanceType?: string | null;
  releaseType?: string | null;
  substrate?: string | null;
  affectsAll: boolean;
  isCore: boolean;
  plannedStartTime?: string;
  plannedEndTime?: string;
  additionalInformation?: string;
  serviceKeys: string[];
  instanceKeys: string[];
  MaintenanceImpacts: TrustMaintenanceImpact[]
  MaintenanceEvents: TrustEvent[]
  createdAt: string;
  updatedAt: string;
}

export type Localization = {
  id: number;
  modelName: string;
  modelKey: string;
  modelAttribute: string;
  text: string;
  locale: string;
}

type TrustIncidentImpact = {
  id: number;
  startTime: string;
  endTime?: string | null;
  serviceIssue?: string;
  endUserImpact?: string;
  severity?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  startTimeCreatedAt: string;
  startTimeModifiedAt: string | null;
  endTimeCreatedAt: string | null;
  endTimeModifiedAt: string | null;
}

type TrustEvent = {
  id: number;
  type: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  localizedType?: string;
}

type TrustMaintenanceImpact = {
  id: number;
  startTime: string;
  endTime?: string;
  type: string;
  systemAvailability?: string;
  createdAt: string;
  updatedAt: string;
  severity?: string;
  startTimeCreatedAt: string;
  startTimeModifiedAt: string | null;
  endTimeCreatedAt: string | null;
  endTimeModifiedAt: string | null;
}

type TrustService = {
  key: string;
  order: number;
  isCore: boolean;
}

type TrustProduct = {
  key: string;
  order: number;
  isActive: boolean;
  name: string;
  altDisplayName: string;
  url: string;
}

type TrustTag = {
  id: number;
  value: string;
  type: string;
  Instances: string[];
}

/*
Heroku Status API
 */

type SystemStatus = {
  system: string;
  status: string;
}

export type HerokuIncident = {
  title: string;
  created_at: string;
  full_url: string;
  updates: HerokuIncidentUpdate[]
}

type HerokuIncidentUpdate = {
  update_type: string;
  updated_at: string;
  contents: string;
}

type HerokuScheduledMaintenance = Record<string, unknown>
