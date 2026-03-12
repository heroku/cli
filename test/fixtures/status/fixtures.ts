import {
  TrustInstance,
  TrustIncident,
  TrustMaintenance,
  Localization,
} from '../../../src/lib/types/status.js'

export const fixtureNow = Date.now()
export const fixtureNowISO = new Date(fixtureNow).toISOString()

export const instancesResponse: TrustInstance[] = [
  {
    key: 'Heroku London',
    location: 'NA',
    environment: 'production',
    releaseVersion: '',
    releaseNumber: '',
    status: 'OK',
    isActive: true,
    city: '',
    stateName: '',
    stateCode: '',
    countryName: '',
    countryCode: '',
    maintenanceWindow: '',
    Services: [
      {
        key: 'HerokuApps',
        order: 1,
        isCore: false,
      },
      {
        key: 'HerokuData',
        order: 5,
        isCore: false,
      },
    ],
    Products: [
      {
        key: 'Heroku',
        order: 60,
        isActive: true,
        name: 'Heroku',
        altDisplayName: 'Heroku',
        url: '/products/Heroku',
      },
    ],
    Incidents: [],
    Tags: [],
  },
  {
    key: 'Heroku Tokyo',
    location: 'APAC',
    environment: 'production',
    releaseVersion: '',
    releaseNumber: '',
    status: 'OK',
    isActive: true,
    city: '',
    stateName: '',
    stateCode: '',
    countryName: '',
    countryCode: '',
    maintenanceWindow: '',
    Services: [
      {
        key: 'HerokuApps',
        order: 1,
        isCore: false,
      },
      {
        key: 'HerokuData',
        order: 5,
        isCore: false,
      },
    ],
    Products: [
      {
        key: 'Heroku',
        order: 60,
        isActive: true,
        name: 'Heroku',
        altDisplayName: 'Heroku',
        url: '/products/Heroku',
      },
    ],
    Incidents: [],
    Tags: [],
  },
  {
    key: 'Heroku Europe',
    location: 'EMEA',
    environment: 'production',
    releaseVersion: '',
    releaseNumber: '',
    status: 'OK',
    isActive: true,
    city: '',
    stateName: '',
    stateCode: '',
    countryName: '',
    countryCode: '',
    maintenanceWindow: '',
    Services: [
      {
        key: 'HerokuApps',
        order: 1,
        isCore: false,
      },
      {
        key: 'HerokuData',
        order: 5,
        isCore: false,
      },
    ],
    Products: [
      {
        key: 'Heroku',
        order: 60,
        isActive: true,
        name: 'Heroku',
        altDisplayName: 'Heroku',
        url: '/products/Heroku',
      },
    ],
    Incidents: [],
    Tags: [],
  },
  {
    key: 'Heroku Asia',
    location: 'EMEA',
    environment: 'production',
    releaseVersion: '',
    releaseNumber: '',
    status: 'OK',
    isActive: true,
    city: '',
    stateName: '',
    stateCode: '',
    countryName: '',
    countryCode: '',
    maintenanceWindow: '',
    Services: [
      {
        key: 'HerokuApps',
        order: 1,
        isCore: false,
      },
      {
        key: 'HerokuData',
        order: 5,
        isCore: false,
      },
    ],
    Products: [
      {
        key: 'Heroku',
        order: 60,
        isActive: true,
        name: 'Heroku',
        altDisplayName: 'Heroku',
        url: '/products/Heroku',
      },
    ],
    Incidents: [],
    Tags: [],
  },
  {
    key: 'Heroku North America',
    location: 'NA',
    environment: 'production',
    releaseVersion: '',
    releaseNumber: '',
    status: 'OK',
    isActive: true,
    city: '',
    stateName: '',
    stateCode: '',
    countryName: '',
    countryCode: '',
    maintenanceWindow: '',
    Services: [
      {
        key: 'CLI',
        order: 20,
        isCore: false,
      },
      {
        key: 'Dashboard',
        order: 10,
        isCore: false,
      },
      {
        key: 'PlatformAPI',
        order: 1,
        isCore: false,
      },
    ],
    Products: [
      {
        key: 'Heroku',
        order: 60,
        isActive: true,
        name: 'Heroku',
        altDisplayName: 'Heroku',
        url: '/products/Heroku',
      },
    ],
    Incidents: [],
    Tags: [],
  },
]

export const herokuMaintenanceResponse: TrustMaintenance[] = [
  {
    id: 20745576,
    message: {
      maintenanceType: 'scheduledMaintenance',
      eventStatus: 'resolved',
      availability: 'available',
    },
    externalId: '12345',
    name: 'test',
    externalMaintenanceType: null,
    substrate: null,
    releaseType: null,
    plannedStartTime: '2025-08-01T16:00:00.000Z',
    plannedEndTime: '2025-08-01T16:05:00.000Z',
    additionalInformation: '',
    isCore: false,
    affectsAll: false,
    createdAt: '2025-08-07T16:00:22.214Z',
    updatedAt: '2025-08-07T16:00:22.226Z',
    instanceKeys: [
      'Heroku North America',
    ],
    serviceKeys: [
      'HerokuApps',
      'HerokuData',
    ],
    MaintenanceImpacts: [
      {
        id: 20034313,
        startTime: '2025-08-01T16:00:00.000Z',
        endTime: '2025-08-01T16:05:00.000Z',
        type: 'deployingRelease',
        severity: 'maintenance',
        createdAt: '2025-08-07T16:00:22.273Z',
        updatedAt: '2025-08-07T16:00:22.281Z',
        startTimeCreatedAt: '2025-08-07T16:00:22.273Z',
        startTimeModifiedAt: null,
        endTimeCreatedAt: '2025-08-07T16:00:22.275Z',
        endTimeModifiedAt: null,
      },
    ],
    MaintenanceEvents: [
      {
        id: 21634955,
        type: 'scheduled',
        message: 'This maintenance has been scheduled.',
        createdAt: '2025-08-07T16:00:22.266Z',
        updatedAt: '2025-08-07T16:00:22.270Z',
      },
    ],
  },
]

export const trustLocalizationsResponse: Localization[] = [
  {
    id: 123,
    modelName: 'incidentEventType',
    modelKey: 'herokuIncident',
    modelAttribute: 'label',
    text: 'Heroku - Incident',
    locale: 'en',
  },
  {
    id: 123,
    modelName: 'incidentEventType',
    modelKey: 'herokuIncidentInvestigating',
    modelAttribute: 'label',
    text: 'Heroku Update - Investigating',
    locale: 'en',
  },
  {
    id: 123,
    modelName: 'incidentEventType',
    modelKey: 'herokuIncidentMonitoring',
    modelAttribute: 'label',
    text: 'Heroku Incident - Monitoring',
    locale: 'en',
  },
]

/*
SF Trust API incident responses
 */
const nonHerokuIncident: TrustIncident = {
  id: 12345,
  externalId: '12345',
  message: {
    pathToResolution: null,
    actionPlan: null,
    rootCause: null,
  },
  additionalInformation: 'TEST',
  isCore: false,
  affectsAll: false,
  createdAt: `${fixtureNowISO}`,
  updatedAt: '2025-08-21T08:53:30.069Z',
  instanceKeys: [
    'KEY1',
    'KEY2',
  ],
  serviceKeys: [
    'Service1',
    'Service2',
  ],
  IncidentImpacts: [
    {
      id: 20011917,
      startTime: '2025-08-21T08:52:00.000Z',
      endTime: null,
      type: 'featurePerfDegradation',
      severity: 'minor',
      createdAt: '2025-08-21T08:53:01.799Z',
      updatedAt: '2025-08-21T08:53:01.808Z',
      startTimeCreatedAt: '2025-08-21T08:53:01.800Z',
      startTimeModifiedAt: null,
      endTimeCreatedAt: null,
      endTimeModifiedAt: null,
    },
  ],
  IncidentEvents: [
    {
      id: 20008740,
      type: 'issueIsolatedDatabaseTier',
      message: 'Incident update 1',
      createdAt: '2025-08-21T08:54:00.000Z',
      updatedAt: '2025-08-21T08:57:47.859Z',
    },
    {
      id: 20008739,
      type: 'issueIsolatedDatabaseTier',
      message: 'Incident update 2',
      createdAt: '2025-08-21T08:53:00.000Z',
      updatedAt: '2025-08-21T08:53:53.787Z',
    },
    {
      id: 20008738,
      type: 'investigatingCauseOfIssue',
      message: 'Incident update 3',
      createdAt: '2025-08-21T08:53:00.000Z',
      updatedAt: '2025-08-21T08:53:30.112Z',
    },
  ],
}

const herokuDataIncident: TrustIncident = {
  id: 12345,
  externalId: '12345',
  message: {
    pathToResolution: null,
    actionPlan: null,
    rootCause: null,
  },
  additionalInformation: 'TEST',
  isCore: false,
  affectsAll: false,
  createdAt: `${fixtureNowISO}`,
  updatedAt: '2025-08-21T08:53:30.069Z',
  instanceKeys: [
    'Heroku North America',
  ],
  serviceKeys: [
    'Data',
  ],
  IncidentImpacts: [
    {
      id: 20011917,
      startTime: '2025-08-21T08:52:00.000Z',
      endTime: null,
      type: 'herokuDataFeatureDisruption',
      severity: 'major',
      createdAt: '2025-08-21T08:53:01.799Z',
      updatedAt: '2025-08-21T08:53:01.808Z',
      startTimeCreatedAt: '2025-08-21T08:53:01.800Z',
      startTimeModifiedAt: null,
      endTimeCreatedAt: null,
      endTimeModifiedAt: null,
    },
  ],
  IncidentEvents: [
    {
      id: 20008740,
      type: 'herokuIncident',
      message: 'Incident update 1',
      createdAt: `${fixtureNowISO}`,
      updatedAt: '2025-08-21T08:57:47.859Z',
    },
    {
      id: 20008739,
      type: 'herokuIncidentMonitoring',
      message: 'Incident update 2',
      createdAt: `${fixtureNowISO}`,
      updatedAt: '2025-08-21T08:53:53.787Z',
    },
    {
      id: 20008738,
      type: 'herokuIncidentInvestigating',
      message: 'Incident update 3',
      createdAt: `${fixtureNowISO}`,
      updatedAt: '2025-08-21T08:53:30.112Z',
    },
  ],
}

const herokuAppsIncident: TrustIncident = {
  id: 12345,
  externalId: '12345',
  message: {
    pathToResolution: null,
    actionPlan: null,
    rootCause: null,
  },
  additionalInformation: 'TEST',
  isCore: false,
  affectsAll: false,
  createdAt: `${fixtureNowISO}`,
  updatedAt: '2025-08-21T08:53:30.069Z',
  instanceKeys: [
    'Heroku Europe',
  ],
  serviceKeys: [
    'Apps',
  ],
  IncidentImpacts: [
    {
      id: 20011917,
      startTime: '2025-08-21T08:52:00.000Z',
      endTime: null,
      type: 'herokuAppsServiceDisruption',
      severity: 'minor',
      createdAt: '2025-08-21T08:53:01.799Z',
      updatedAt: '2025-08-21T08:53:01.808Z',
      startTimeCreatedAt: '2025-08-21T08:53:01.800Z',
      startTimeModifiedAt: null,
      endTimeCreatedAt: null,
      endTimeModifiedAt: null,
    },
  ],
  IncidentEvents: [
    {
      id: 20008740,
      type: 'herokuIncident',
      message: 'Incident update 1',
      createdAt: `${fixtureNowISO}`,
      updatedAt: '2025-08-21T08:57:47.859Z',
    },
    {
      id: 20008739,
      type: 'herokuIncidentMonitoring',
      message: 'Incident update 2',
      createdAt: `${fixtureNowISO}`,
      updatedAt: '2025-08-21T08:53:53.787Z',
    },
    {
      id: 20008738,
      type: 'herokuIncidentInvestigating',
      message: 'Incident update 3',
      createdAt: `${fixtureNowISO}`,
      updatedAt: '2025-08-21T08:53:30.112Z',
    },
  ],
}

const herokuToolsIncident: TrustIncident = {
  id: 12345,
  externalId: '12345',
  message: {
    pathToResolution: null,
    actionPlan: null,
    rootCause: null,
  },
  additionalInformation: 'TEST',
  isCore: false,
  affectsAll: false,
  createdAt: `${fixtureNowISO}`,
  updatedAt: '2025-08-21T08:53:30.069Z',
  instanceKeys: [
    'Heroku Asia',
  ],
  serviceKeys: [
    'Dashboard',
  ],
  IncidentImpacts: [
    {
      id: 20011917,
      startTime: '2025-08-21T08:52:00.000Z',
      endTime: null,
      type: 'herokuToolsFeatureDisruption',
      severity: 'minor',
      createdAt: '2025-08-21T08:53:01.799Z',
      updatedAt: '2025-08-21T08:53:01.808Z',
      startTimeCreatedAt: '2025-08-21T08:53:01.800Z',
      startTimeModifiedAt: null,
      endTimeCreatedAt: null,
      endTimeModifiedAt: null,
    },
  ],
  IncidentEvents: [
    {
      id: 20008740,
      type: 'herokuIncident',
      message: 'Incident update 1',
      createdAt: `${fixtureNowISO}`,
      updatedAt: '2025-08-21T08:57:47.859Z',
    },
    {
      id: 20008739,
      type: 'herokuIncidentMonitoring',
      message: 'Incident update 2',
      createdAt: `${fixtureNowISO}`,
      updatedAt: '2025-08-21T08:53:53.787Z',
    },
    {
      id: 20008738,
      type: 'herokuIncidentInvestigating',
      message: 'Incident update 3',
      createdAt: `${fixtureNowISO}`,
      updatedAt: '2025-08-21T08:53:30.112Z',
    },
  ],
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
