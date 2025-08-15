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
  tags: TrustTag[];
}

export type TrustIncident = {
  id: number;
  message?: {
    pathToResolution?: string;
    actionPlan?: string;
    rootCause?: string;
  },
  externalId?: string;
  affectsAll: boolean;
  isCore: boolean;
  additionalInformation?: string;
  serviceKeys: string[];
  instanceKeys: string[];
  IncidentImpacts: TrustIncidentImpact[]
  IncidentEvents: TrustIncidentEvent[]
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
  externalMaintenanceType?: string;
  releaseType?: string;
  substrate?: string;
  affectsAll: boolean;
  isCore: boolean;
  plannedStartTime?: string;
  plannedEndTime?: string;
  additionalInformation?: string;
  serviceKeys: string[];
  instanceKeys: string[];
  MaintenanceImpacts: TrustMaintenanceImpact[]
  createdAt: string;
  updatedAt: string;
}

type TrustIncidentImpact = {
  id: number;
  startTime: string;
  endTime?: string;
  serviceIssue?: string;
  endUserImpact?: string;
  severity?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

type TrustIncidentEvent = {
  id: number;
  type: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

type TrustMaintenanceImpact = {
  id: number;
  startTime: string;
  endTime?: string;
  type: string;
  systemAvailability: string;
  createdAt: string;
  updatedAt: string;
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

type HerokuIncident = {
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
