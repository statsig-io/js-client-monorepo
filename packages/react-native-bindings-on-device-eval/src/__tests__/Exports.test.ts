import * as Mod from '../index';

describe('Exports', () => {
  it('should not include StatsigProviderOnDeviceEval', () => {
    expect(Mod.StatsigProviderOnDeviceEval).toBeUndefined();
  });

  it('should not include StatsigOnDeviceEvalClient', () => {
    expect(Mod.StatsigOnDeviceEvalClient).toBeUndefined();
  });
});
