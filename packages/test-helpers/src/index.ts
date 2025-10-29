import {
  getDcsResponseWithConfigValue,
  getInitializeResponseWithConfigValue,
} from './ResponseBuilder';
import * as DcsResponse from './data/dcs_response.json';
import * as InitResponse from './data/initialize.json';

export * from './Matchers';
export * from './MockClients';
export * from './MockLocalStorage';
export * from './TestPromise';
export { toStartWith } from 'jest-extended';

const InitResponseString = JSON.stringify(InitResponse);
const InitResponseStableID = updateUserWithStableID(InitResponse);
const InitResponseStableIDString = JSON.stringify(InitResponseStableID);
const DcsResponseString = JSON.stringify(DcsResponse);

const noop = (..._args: unknown[]): void => {
  // noop
};

const nullthrows = <T>(input: T | undefined | null): T => {
  if (input == null) {
    throw "[Statsig Test]: 'nullthrows' method encountered a null value";
  }
  return input;
};

const skipFrame = (): Promise<void> => new Promise((r) => setTimeout(r, 1));

function updateUserWithStableID(response: unknown): Record<string, unknown> {
  const clonedResponse = JSON.parse(JSON.stringify(response)) as Record<
    string,
    unknown
  >;

  clonedResponse['user'] = {
    ...(clonedResponse['user'] as object),
    customIDs: {
      stableID: 'a-stable-id',
    },
  };

  return clonedResponse;
}

export {
  InitResponse,
  InitResponseString,
  DcsResponse,
  DcsResponseString,
  InitResponseStableID,
  InitResponseStableIDString,
  getDcsResponseWithConfigValue,
  getInitializeResponseWithConfigValue,
  noop,
  nullthrows,
  skipFrame,
};
