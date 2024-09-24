import { StatsigClient } from '@statsig/js-client';

describe('Initialize Failure Event Emitting', () => {
  const user = { userID: 'a-user' };

  let client: StatsigClient;
  let initFailure = false;

  beforeEach(() => {
    client = new StatsigClient('client-key', user);
    client.on('initialization_failure', () => (initFailure = true));
  });

  it('Initialize Fails with bad SDK Key', async () => {
    await client.initializeAsync();
    expect(initFailure).toBe(true);
  });
});
