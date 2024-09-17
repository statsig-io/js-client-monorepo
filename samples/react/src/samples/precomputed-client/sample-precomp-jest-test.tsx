/* eslint-disable @typescript-eslint/no-unsafe-return */

/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-inferrable-types */
import type {
  expect as expectType,
  jest as jestType,
  test as testType,
} from '@jest/globals';

// <snippet>
import { StatsigClient } from '@statsig/js-client';

// </snippet>

// prettier-ignore
export default async function Sample(): Promise<void> {
    console.log(Foo);
}

function transform(input: string): Promise<string> {
  return Promise.resolve(input);
}

// prettier-ignore
function Foo() {
  const expect: typeof expectType = 1 as any;
  const jest: typeof jestType = 1 as any;
  const test: typeof testType = 1 as any;

  // <snippet>
jest.mock('@statsig/js-client');

test('string transformations', async () => {
  jest
    .spyOn(StatsigClient.prototype, 'checkGate')
    .mockImplementation(() => true);

  jest
    .spyOn(StatsigClient.prototype, 'getExperiment')
    .mockImplementation(() => ({ get: () => 'my-value' } as any));

  const result = await transform('original');
  expect(result).toBe('transformed-my-value');
});

  // </snippet>
}
