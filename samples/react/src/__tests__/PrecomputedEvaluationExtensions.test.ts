import '@sigstat/client-extensions';
import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';

describe('Foo', () => {
  const client = new PrecomputedEvaluationsClient('', {});

  it('has', () => {
    expect(client.overrideGate).toBeDefined();
    expect(client.overrideDynamicConfig).toBeDefined();
    expect(client.overrideExperiment).toBeDefined();
    expect(client.overrideLayer).toBeDefined();
  });
});
