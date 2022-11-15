import {test as ogTest} from '@oclif/test/lib'

export * from '@oclif/test/lib'

type Modify<T, R> = Omit<T, keyof R> & R;

export type test = Modify<typeof ogTest,  {
  stub: {
    output: {
      stubs: any[];
    };
    args: [any,  any, (...args: any) => any];
  };
}>
