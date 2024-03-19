import * as DcsResponse from './data/dcs_response.json';
import * as InitResponse from './data/initialize.json';

export * from './Matchers';
export * from './MockClients';
export * from './TestPromise';

const InitResponseString = JSON.stringify(InitResponse);
const DcsResponseString = JSON.stringify(DcsResponse);

export { InitResponse, InitResponseString, DcsResponse, DcsResponseString };
