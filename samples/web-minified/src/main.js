import { test } from './assets/helpers';

const { StatsigClient } = window.Statsig;

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const requests = [];
const emissions = [];

const actual = fetch;
window.fetch = (url, args) => {
  requests.push({ url, args });
  if (url.includes('sdk_exception')) {
    return null;
  }
  return actual(url, args);
};

const client = new StatsigClient(
  DEMO_CLIENT_KEY,
  { userID: 'a-user' },
  { logLevel: 4 },
);

(async () => {
  const timeout = setTimeout(() => {
    test('test timeout', () => false);
  }, 5000);
  await client.initializeAsync(); // prime cache

  client.on('*', (event) => {
    console.log('Emitted Event', event);
    emissions.push(event);
  });

  await client.updateUserAsync({ userID: 'a-user' });

  // Network
  test('creates /initialize request', () =>
    requests[0].url.startsWith('https://featureassets.org/v1/initialize?k='));

  // StatsigClientEventEmitter
  test('values_updated client event', () => {
    const event = emissions[0];
    return (
      event.name === 'values_updated' &&
      event.status === 'Loading' &&
      event.values?.source === 'NetworkNotModified'
    );
  });

  // Gate Checks and StatsigClientEventEmitter
  const aGate = client.checkGate('a_gate');
  test('gate check', () => aGate === true);
  test('gate_evaluation client event', () =>
    emissions[2].name === 'gate_evaluation');

  // Config Checks and StatsigClientEventEmitter
  const aDynamicConfig = client.getDynamicConfig('a_dynamic_config');
  test('dynamic config value contains green', () =>
    aDynamicConfig.value.green === '#0000FF');

  await client.flush();

  // Event Logger
  test('flushed logs', () => {
    const request = requests[2];
    const events = JSON.parse(request.args.body).events;
    return (
      request.url.includes('/v1/rgstr?k=') &&
      events[0].eventName === 'statsig::gate_exposure' &&
      events[1].eventName === 'statsig::config_exposure'
    );
  });

  console.warn('------ DO NOT BE FOOLED -------');
  console.warn('The following is a test for Error Boundary');
  client.dataAdapter.getDataSync = 1;
  client.updateUserSync({ userID: 'b-user' });

  // SDK Exception
  test('logged to sdk_exception', () =>
    requests[3].url.startsWith('https://statsigapi.net/v1/sdk_exception'));
  console.warn('------ DO NOT BE FOOLED -------');

  clearTimeout(timeout);
  test('test timeout', () => true);
})();
