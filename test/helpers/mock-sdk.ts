import {HerokuSDK} from '@heroku/sdk'
import {SinonStub, stub} from 'sinon'

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (...args: any[]) => any ? T[P] : T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StubbedDataClient = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StubbedPlatformClient = Record<string, any>

export interface MockSDK {
  dataStub?: SinonStub
  platformStub?: SinonStub
  restore: () => void
}

export function mockSDKData(fakeData: StubbedDataClient): MockSDK {
  const dataStub = stub(HerokuSDK.prototype, 'data').get(() => fakeData)
  return {
    dataStub,
    restore: () => dataStub.restore(),
  }
}

export function mockSDKPlatform(fakePlatform: StubbedPlatformClient): MockSDK {
  const platformStub = stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  return {
    platformStub,
    restore: () => platformStub.restore(),
  }
}

export function mockSDK(fakeData?: StubbedDataClient, fakePlatform?: StubbedPlatformClient): MockSDK {
  const dataStub = fakeData ? stub(HerokuSDK.prototype, 'data').get(() => fakeData) : undefined
  const platformStub = fakePlatform ? stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform) : undefined
  return {
    dataStub,
    platformStub,
    restore: () => {
      dataStub?.restore()
      platformStub?.restore()
    },
  }
}
