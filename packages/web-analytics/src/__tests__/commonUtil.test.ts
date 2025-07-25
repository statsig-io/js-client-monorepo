import {
  _getSafeNetworkInformation,
  _shouldLogEvent,
} from '../utils/commonUtils';

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

describe('_shouldLogEvent', () => {
  it('should return false if the element contains statsig-no-capture class', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.classList.add('statsig-no-capture');
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    const result = _shouldLogEvent(clickEvent, button);
    expect(result).toBe(false);
  });

  it('should return true if the element is a valid element', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    const result = _shouldLogEvent(clickEvent, button);
    expect(result).toBe(true);
  });
});
