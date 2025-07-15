import { _getSafeNetworkInformation } from '../utils/commonUtils';

describe('_getSafeNetworkInformation', () => {
  const originalNavigator = window.navigator;

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('should return null if window.navigator is not defined', () => {
    Object.defineProperty(window, 'navigator', {
      value: undefined,
      writable: true,
    });

    const result = _getSafeNetworkInformation();
    expect(result).toBeNull();
  });

  it('should return null if window.navigator.connection is not defined', () => {
    Object.defineProperty(window, 'navigator', {
      value: {},
      writable: true,
    });

    const result = _getSafeNetworkInformation();
    expect(result).toBeNull();
  });

  it('should return the connection object if it exists and has some properties', () => {
    const mockConnection = { downlink: 10, effectiveType: '4g' };
    Object.defineProperty(window, 'navigator', {
      value: { connection: mockConnection },
      writable: true,
    });

    const result = _getSafeNetworkInformation();
    expect(result).toEqual(mockConnection);
  });

  it('should return the connection object if it exists and has all properties', () => {
    const mockConnection = {
      downlink: 10,
      effectiveType: '4g',
      rtt: 100,
      saveData: false,
    };
    Object.defineProperty(window, 'navigator', {
      value: { connection: mockConnection },
      writable: true,
    });

    const result = _getSafeNetworkInformation();
    expect(result).toEqual(mockConnection);
  });

  it('should return the connection object if it exists and extra properties', () => {
    const mockConnection = {
      downlink: 10,
      effectiveType: '4g',
      rtt: 100,
      saveData: false,
      someExtraField: 'extra',
    };
    Object.defineProperty(window, 'navigator', {
      value: { connection: mockConnection },
      writable: true,
    });

    const result = _getSafeNetworkInformation();
    expect(result).toEqual(mockConnection);
  });

  it('should return the connection object if it exists and havs wrong property types', () => {
    const mockConnection = {
      downlink: 'hi',
      effectiveType: 4,
    };
    Object.defineProperty(window, 'navigator', {
      value: { connection: mockConnection },
      writable: true,
    });

    const result = _getSafeNetworkInformation();
    expect(result).toEqual(mockConnection);
  });
});
