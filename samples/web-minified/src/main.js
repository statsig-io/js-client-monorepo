import { test } from './helpers';

const { StatsigClient } = window.Statsig;

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const requests = [];

const actual = fetch;
window.fetch = (url, args) => {
  requests.push({ url, args });
  return actual(url, args);
};

const client = new StatsigClient(DEMO_CLIENT_KEY, { userID: 'a-user' });

(async () => {
  await client.initializeAsync();

  const aGate = client.checkGate('a_gate');
  test('gate check', () => aGate === true);

  const aDynamicConfig = client.getDynamicConfig('a_dynamic_config');
  test('dynamic config value contains green', () =>
    aDynamicConfig.value.green === '#0000FF');

  await client.flush();

  test('creates /initialize request', () =>
    requests[0].url.startsWith('https://api.statsig.com/v1/initialize?k='));

  test('flushed logs', () => {
    const events = JSON.parse(requests[1].args.body).events;

    return (
      requests[1].url.startsWith('https://api.statsig.com/v1/rgstr?k=') &&
      events[0].eventName === 'statsig::gate_exposure' &&
      events[1].eventName === 'statsig::config_exposure'
    );
  });
})();
