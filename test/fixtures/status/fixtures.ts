import {
  Localization,
  TrustIncident,
  TrustInstance,
  TrustMaintenance,
} from '../../../src/lib/types/status.js'

export const fixtureNow = Date.now()
export const fixtureNowISO = new Date(fixtureNow).toISOString()

export const instancesResponse: TrustInstance[] = [
  {
    city: '',
    countryCode: '',
    countryName: '',
    environment: 'production',
    Incidents: [],
    isActive: true,
    key: 'Heroku London',
    location: 'NA',
    maintenanceWindow: '',
    Products: [
      {
        altDisplayName: 'Heroku',
        isActive: true,
        key: 'Heroku',
        name: 'Heroku',
        order: 60,
        url: '/products/Heroku',
      },
    ],
    releaseNumber: '',
    releaseVersion: '',
    Services: [
      {
        isCore: false,
        key: 'HerokuApps',
        order: 1,
      },
      {
        isCore: false,
        key: 'HerokuData',
        order: 5,
      },
    ],
    stateCode: '',
    stateName: '',
    status: 'OK',
    Tags: [],
  },
  {
    city: '',
    countryCode: '',
    countryName: '',
    environment: 'production',
    Incidents: [],
    isActive: true,
    key: 'Heroku Tokyo',
    location: 'APAC',
    maintenanceWindow: '',
    Products: [
      {
        altDisplayName: 'Heroku',
        isActive: true,
        key: 'Heroku',
        name: 'Heroku',
        order: 60,
        url: '/products/Heroku',
      },
    ],
    releaseNumber: '',
    releaseVersion: '',
    Services: [
      {
        isCore: false,
        key: 'HerokuApps',
        order: 1,
      },
      {
        isCore: false,
        key: 'HerokuData',
        order: 5,
      },
    ],
    stateCode: '',
    stateName: '',
    status: 'OK',
    Tags: [],
  },
  {
    city: '',
    countryCode: '',
    countryName: '',
    environment: 'production',
    Incidents: [],
    isActive: true,
    key: 'Heroku Europe',
    location: 'EMEA',
    maintenanceWindow: '',
    Products: [
      {
        altDisplayName: 'Heroku',
        isActive: true,
        key: 'Heroku',
        name: 'Heroku',
        order: 60,
        url: '/products/Heroku',
      },
    ],
    releaseNumber: '',
    releaseVersion: '',
    Services: [
      {
        isCore: false,
        key: 'HerokuApps',
        order: 1,
      },
      {
        isCore: false,
        key: 'HerokuData',
        order: 5,
      },
    ],
    stateCode: '',
    stateName: '',
    status: 'OK',
    Tags: [],
  },
  {
    city: '',
    countryCode: '',
    countryName: '',
    environment: 'production',
    Incidents: [],
    isActive: true,
    key: 'Heroku Asia',
    location: 'EMEA',
    maintenanceWindow: '',
    Products: [
      {
        altDisplayName: 'Heroku',
        isActive: true,
        key: 'Heroku',
        name: 'Heroku',
        order: 60,
        url: '/products/Heroku',
      },
    ],
    releaseNumber: '',
    releaseVersion: '',
    Services: [
      {
        isCore: false,
        key: 'HerokuApps',
        order: 1,
      },
      {
        isCore: false,
        key: 'HerokuData',
        order: 5,
      },
    ],
    stateCode: '',
    stateName: '',
    status: 'OK',
    Tags: [],
  },
  {
    city: '',
    countryCode: '',
    countryName: '',
    environment: 'production',
    Incidents: [],
    isActive: true,
    key: 'Heroku North America',
    location: 'NA',
    maintenanceWindow: '',
    Products: [
      {
        altDisplayName: 'Heroku',
        isActive: true,
        key: 'Heroku',
        name: 'Heroku',
        order: 60,
        url: '/products/Heroku',
      },
    ],
    releaseNumber: '',
    releaseVersion: '',
    Services: [
      {
        isCore: false,
        key: 'CLI',
        order: 20,
      },
      {
        isCore: false,
        key: 'Dashboard',
        order: 10,
      },
      {
        isCore: false,
        key: 'PlatformAPI',
        order: 1,
      },
    ],
    stateCode: '',
    stateName: '',
    status: 'OK',
    Tags: [],
  },
]

export const herokuMaintenanceResponse: TrustMaintenance[] = [
  {
    additionalInformation: '',
    affectsAll: false,
    createdAt: '2025-08-07T16:00:22.214Z',
    externalId: '12345',
    externalMaintenanceType: null,
    id: 20_745_576,
    instanceKeys: [
      'Heroku North America',
    ],
    isCore: false,
    MaintenanceEvents: [
      {
        createdAt: '2025-08-07T16:00:22.266Z',
        id: 21_634_955,
        message: 'This maintenance has been scheduled.',
        type: 'scheduled',
        updatedAt: '2025-08-07T16:00:22.270Z',
      },
    ],
    MaintenanceImpacts: [
      {
        createdAt: '2025-08-07T16:00:22.273Z',
        endTime: '2025-08-01T16:05:00.000Z',
        endTimeCreatedAt: '2025-08-07T16:00:22.275Z',
        endTimeModifiedAt: null,
        id: 20_034_313,
        severity: 'maintenance',
        startTime: '2025-08-01T16:00:00.000Z',
        startTimeCreatedAt: '2025-08-07T16:00:22.273Z',
        startTimeModifiedAt: null,
        type: 'deployingRelease',
        updatedAt: '2025-08-07T16:00:22.281Z',
      },
    ],
    message: {
      availability: 'available',
      eventStatus: 'resolved',
      maintenanceType: 'scheduledMaintenance',
    },
    name: 'test',
    plannedEndTime: '2025-08-01T16:05:00.000Z',
    plannedStartTime: '2025-08-01T16:00:00.000Z',
    releaseType: null,
    serviceKeys: [
      'HerokuApps',
      'HerokuData',
    ],
    substrate: null,
    updatedAt: '2025-08-07T16:00:22.226Z',
  },
]

export const trustLocalizationsResponse: Localization[] = [
  {
    id: 123,
    locale: 'en',
    modelAttribute: 'label',
    modelKey: 'herokuIncident',
    modelName: 'incidentEventType',
    text: 'Heroku - Incident',
  },
  {
    id: 123,
    locale: 'en',
    modelAttribute: 'label',
    modelKey: 'herokuIncidentInvestigating',
    modelName: 'incidentEventType',
    text: 'Heroku Update - Investigating',
  },
  {
    id: 123,
    locale: 'en',
    modelAttribute: 'label',
    modelKey: 'herokuIncidentMonitoring',
    modelName: 'incidentEventType',
    text: 'Heroku Incident - Monitoring',
  },
]

/*
SF Trust API incident responses
 */
const nonHerokuIncident: TrustIncident = {
  additionalInformation: 'TEST',
  affectsAll: false,
  createdAt: `${fixtureNowISO}`,
  externalId: '12345',
  id: 12_345,
  IncidentEvents: [
    {
      createdAt: '2025-08-21T08:54:00.000Z',
      id: 20_008_740,
      message: 'Incident update 1',
      type: 'issueIsolatedDatabaseTier',
      updatedAt: '2025-08-21T08:57:47.859Z',
    },
    {
      createdAt: '2025-08-21T08:53:00.000Z',
      id: 20_008_739,
      message: 'Incident update 2',
      type: 'issueIsolatedDatabaseTier',
      updatedAt: '2025-08-21T08:53:53.787Z',
    },
    {
      createdAt: '2025-08-21T08:53:00.000Z',
      id: 20_008_738,
      message: 'Incident update 3',
      type: 'investigatingCauseOfIssue',
      updatedAt: '2025-08-21T08:53:30.112Z',
    },
  ],
  IncidentImpacts: [
    {
      createdAt: '2025-08-21T08:53:01.799Z',
      endTime: null,
      endTimeCreatedAt: null,
      endTimeModifiedAt: null,
      id: 20_011_917,
      severity: 'minor',
      startTime: '2025-08-21T08:52:00.000Z',
      startTimeCreatedAt: '2025-08-21T08:53:01.800Z',
      startTimeModifiedAt: null,
      type: 'featurePerfDegradation',
      updatedAt: '2025-08-21T08:53:01.808Z',
    },
  ],
  instanceKeys: [
    'KEY1',
    'KEY2',
  ],
  isCore: false,
  message: {
    actionPlan: null,
    pathToResolution: null,
    rootCause: null,
  },
  serviceKeys: [
    'Service1',
    'Service2',
  ],
  updatedAt: '2025-08-21T08:53:30.069Z',
}

const herokuDataIncident: TrustIncident = {
  additionalInformation: 'TEST',
  affectsAll: false,
  createdAt: `${fixtureNowISO}`,
  externalId: '12345',
  id: 12_345,
  IncidentEvents: [
    {
      createdAt: `${fixtureNowISO}`,
      id: 20_008_740,
      message: 'Incident update 1',
      type: 'herokuIncident',
      updatedAt: '2025-08-21T08:57:47.859Z',
    },
    {
      createdAt: `${fixtureNowISO}`,
      id: 20_008_739,
      message: 'Incident update 2',
      type: 'herokuIncidentMonitoring',
      updatedAt: '2025-08-21T08:53:53.787Z',
    },
    {
      createdAt: `${fixtureNowISO}`,
      id: 20_008_738,
      message: 'Incident update 3',
      type: 'herokuIncidentInvestigating',
      updatedAt: '2025-08-21T08:53:30.112Z',
    },
  ],
  IncidentImpacts: [
    {
      createdAt: '2025-08-21T08:53:01.799Z',
      endTime: null,
      endTimeCreatedAt: null,
      endTimeModifiedAt: null,
      id: 20_011_917,
      severity: 'major',
      startTime: '2025-08-21T08:52:00.000Z',
      startTimeCreatedAt: '2025-08-21T08:53:01.800Z',
      startTimeModifiedAt: null,
      type: 'herokuDataFeatureDisruption',
      updatedAt: '2025-08-21T08:53:01.808Z',
    },
  ],
  instanceKeys: [
    'Heroku North America',
  ],
  isCore: false,
  message: {
    actionPlan: null,
    pathToResolution: null,
    rootCause: null,
  },
  serviceKeys: [
    'Data',
  ],
  updatedAt: '2025-08-21T08:53:30.069Z',
}

const herokuAppsIncident: TrustIncident = {
  additionalInformation: 'TEST',
  affectsAll: false,
  createdAt: `${fixtureNowISO}`,
  externalId: '12345',
  id: 12_345,
  IncidentEvents: [
    {
      createdAt: `${fixtureNowISO}`,
      id: 20_008_740,
      message: 'Incident update 1',
      type: 'herokuIncident',
      updatedAt: '2025-08-21T08:57:47.859Z',
    },
    {
      createdAt: `${fixtureNowISO}`,
      id: 20_008_739,
      message: 'Incident update 2',
      type: 'herokuIncidentMonitoring',
      updatedAt: '2025-08-21T08:53:53.787Z',
    },
    {
      createdAt: `${fixtureNowISO}`,
      id: 20_008_738,
      message: 'Incident update 3',
      type: 'herokuIncidentInvestigating',
      updatedAt: '2025-08-21T08:53:30.112Z',
    },
  ],
  IncidentImpacts: [
    {
      createdAt: '2025-08-21T08:53:01.799Z',
      endTime: null,
      endTimeCreatedAt: null,
      endTimeModifiedAt: null,
      id: 20_011_917,
      severity: 'minor',
      startTime: '2025-08-21T08:52:00.000Z',
      startTimeCreatedAt: '2025-08-21T08:53:01.800Z',
      startTimeModifiedAt: null,
      type: 'herokuAppsServiceDisruption',
      updatedAt: '2025-08-21T08:53:01.808Z',
    },
  ],
  instanceKeys: [
    'Heroku Europe',
  ],
  isCore: false,
  message: {
    actionPlan: null,
    pathToResolution: null,
    rootCause: null,
  },
  serviceKeys: [
    'Apps',
  ],
  updatedAt: '2025-08-21T08:53:30.069Z',
}

const herokuToolsIncident: TrustIncident = {
  additionalInformation: 'TEST',
  affectsAll: false,
  createdAt: `${fixtureNowISO}`,
  externalId: '12345',
  id: 12_345,
  IncidentEvents: [
    {
      createdAt: `${fixtureNowISO}`,
      id: 20_008_740,
      message: 'Incident update 1',
      type: 'herokuIncident',
      updatedAt: '2025-08-21T08:57:47.859Z',
    },
    {
      createdAt: `${fixtureNowISO}`,
      id: 20_008_739,
      message: 'Incident update 2',
      type: 'herokuIncidentMonitoring',
      updatedAt: '2025-08-21T08:53:53.787Z',
    },
    {
      createdAt: `${fixtureNowISO}`,
      id: 20_008_738,
      message: 'Incident update 3',
      type: 'herokuIncidentInvestigating',
      updatedAt: '2025-08-21T08:53:30.112Z',
    },
  ],
  IncidentImpacts: [
    {
      createdAt: '2025-08-21T08:53:01.799Z',
      endTime: null,
      endTimeCreatedAt: null,
      endTimeModifiedAt: null,
      id: 20_011_917,
      severity: 'minor',
      startTime: '2025-08-21T08:52:00.000Z',
      startTimeCreatedAt: '2025-08-21T08:53:01.800Z',
      startTimeModifiedAt: null,
      type: 'herokuToolsFeatureDisruption',
      updatedAt: '2025-08-21T08:53:01.808Z',
    },
  ],
  instanceKeys: [
    'Heroku Asia',
  ],
  isCore: false,
  message: {
    actionPlan: null,
    pathToResolution: null,
    rootCause: null,
  },
  serviceKeys: [
    'Dashboard',
  ],
  updatedAt: '2025-08-21T08:53:30.069Z',
}

export const nonHerokuIncidentResponse: TrustIncident[] = [
  nonHerokuIncident,
  nonHerokuIncident,
]

export const herokuDataAppsToolsIncidentResponse: TrustIncident[] = [
  nonHerokuIncident,
  herokuDataIncident,
  herokuAppsIncident,
  herokuToolsIncident,
]
