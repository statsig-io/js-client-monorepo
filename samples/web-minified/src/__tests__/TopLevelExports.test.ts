import { anyFunction, anyString } from 'statsig-test-helpers';

import StatsigMin from '../assets/statsig-js-client.min.js';

describe('TopLevelExports', () => {
  it('exports StatsigClient', () => {
    expect(StatsigMin.StatsigClient).toEqual(anyFunction());
  });

  it('exports SDK_VERSION', () => {
    expect(StatsigMin.SDK_VERSION).toEqual(anyString());
  });
});
