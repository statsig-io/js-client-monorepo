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

const InitResponseString = JSON.stringify(InitResponse);
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

export {
  InitResponse,
  InitResponseString,
  DcsResponse,
  DcsResponseString,
  getDcsResponseWithConfigValue,
  getInitializeResponseWithConfigValue,
  noop,
  nullthrows,
  skipFrame,
};
