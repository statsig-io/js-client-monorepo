import { SDKType } from '../SDKType';

describe('SDKType', () => {
  beforeAll(() => {
    SDKType._setClientType('precomp', 'javascript-client');
    SDKType._setClientType('ondev', 'js-on-device-eval-client');
  });

  it('handles client type alone', () => {
    SDKType._setClientType('precomp', 'javascript-client');
    SDKType._setClientType('ondev', 'js-on-device-eval-client');

    expect(SDKType._get('precomp')).toBe('javascript-client');
    expect(SDKType._get('ondev')).toBe('js-on-device-eval-client');
  });

  it('handles with suffix', () => {
    SDKType._setBindingType('rn');

    expect(SDKType._get('precomp')).toBe('javascript-client-rn');
    expect(SDKType._get('ondev')).toBe('js-on-device-eval-client-rn');
  });
});
