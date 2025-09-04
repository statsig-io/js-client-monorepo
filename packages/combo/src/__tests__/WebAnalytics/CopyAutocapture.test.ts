import fetchMock from 'jest-fetch-mock';

import { StatsigClient, _getStatsigGlobal } from '@statsig/js-client';
import {
  AutoCaptureEventName,
  runStatsigAutoCapture,
} from '@statsig/web-analytics';

const setWindowTextSelection = (s: string): void => {
  window.getSelection = () => {
    return {
      toString: () => s,
    } as Selection;
  };
};

// mocking ClipboardEvent since jsdom doesn't have it
// see https://github.com/jsdom/jsdom/issues/1568
class MockClipboardEvent extends Event implements ClipboardEvent {
  clipboardData: DataTransfer | null = null;

  constructor(type: 'copy' | 'cut' | 'paste', eventInitDict?: EventInit) {
    super(type, eventInitDict);
  }
}

(window as any).ClipboardEvent = MockClipboardEvent;

describe('CopyAutocapture', () => {
  let client: StatsigClient;
  const requestDataList: Record<string, any>[] = [];
  let copyEventResolver: ((v: unknown) => void) | null = null;
  let testElement: HTMLDivElement;

  function getLastCopyEvent(
    requests: Record<string, any>[],
  ): Record<string, any> {
    for (let ii = requests.length - 1; ii >= 0; ii--) {
      const req = requests[ii];
      if (req['events']) {
        for (let jj = req['events'].length - 1; jj >= 0; jj--) {
          const evt = req['events'][jj];
          if (evt.eventName === AutoCaptureEventName.COPY) {
            return evt as Record<string, any>;
          }
        }
      }
    }
    return {};
  }

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(async (r: Request) => {
      const reqData = (await r.json()) as Record<string, any>;
      requestDataList.push(reqData);

      if (reqData['events']) {
        for (const evt of reqData['events']) {
          if (evt.eventName === AutoCaptureEventName.COPY) {
            copyEventResolver && copyEventResolver(null);
            copyEventResolver = null;
            break;
          }
        }
      }
      return '{}';
    });

    Object.defineProperty(window, 'innerWidth', {
      value: 4000,
      writable: true,
    });

    Object.defineProperty(window, 'innerHeight', {
      value: 2000,
      writable: true,
    });
  });

  beforeEach(async () => {
    fetchMock.resetMocks();
    requestDataList.length = 0;
    copyEventResolver = null;

    fetchMock.mockResponse(async (r: Request) => {
      const reqData = (await r.json()) as Record<string, any>;
      requestDataList.push(reqData);

      if (reqData['events']) {
        for (const evt of reqData['events']) {
          if (evt.eventName === AutoCaptureEventName.COPY) {
            copyEventResolver && copyEventResolver(null);
            copyEventResolver = null;
            break;
          }
        }
      }
      return '{}';
    });

    testElement = document.createElement('div');
    testElement.textContent = 'Test text to copy';
    testElement.id = 'test-element';
    document.body.appendChild(testElement);

    client = new StatsigClient(
      'client-key',
      { userID: 'a-user' },
      {
        loggingIntervalMs: 100,
      },
    );
    await client.initializeAsync();
    _getStatsigGlobal().acInstances = {};
  });

  afterEach(async () => {
    if (client) {
      await client.shutdown();
    }
    if (testElement) {
      document.body.removeChild(testElement);
    }
    copyEventResolver = null;
  });

  it('should log copy events when text is copied', async () => {
    setWindowTextSelection('Test text to copy');
    runStatsigAutoCapture(client, { captureCopyText: true });

    // Simulate copy event
    const copyEvent = new ClipboardEvent('copy', {
      bubbles: true,
      cancelable: true,
    });
    testElement.dispatchEvent(copyEvent);

    await new Promise((resolve) => {
      copyEventResolver = resolve;
    });

    const copyEventData = getLastCopyEvent(requestDataList);
    expect(copyEventData['eventName']).toBe(AutoCaptureEventName.COPY);
    expect(copyEventData['value']).toBe('http://localhost/');
    expect(copyEventData['metadata']['selectedText']).toBe('Test text to copy');
    expect(copyEventData['metadata']['clipType']).toBe('copy');
  });

  it('should log cut events when text is cut', async () => {
    setWindowTextSelection('Test text to cut');
    runStatsigAutoCapture(client, { captureCopyText: true });

    // Simulate cut event
    const cutEvent = new ClipboardEvent('cut', {
      bubbles: true,
      cancelable: true,
    });
    testElement.dispatchEvent(cutEvent);

    await new Promise((resolve) => {
      copyEventResolver = resolve;
    });

    const copyEventData = getLastCopyEvent(requestDataList);
    expect(copyEventData['eventName']).toBe(AutoCaptureEventName.COPY);
    expect(copyEventData['value']).toBe('http://localhost/');
    expect(copyEventData['metadata']['selectedText']).toBe('Test text to cut');
    expect(copyEventData['metadata']['clipType']).toBe('cut');
  });

  it('should handle copy events with no selected text', async () => {
    setWindowTextSelection('');
    runStatsigAutoCapture(client, { captureCopyText: true });

    const copyEvent = new ClipboardEvent('copy', {
      bubbles: true,
      cancelable: true,
    });
    testElement.dispatchEvent(copyEvent);

    await new Promise((resolve) => setTimeout(resolve, 250));

    const copyEventData = getLastCopyEvent(requestDataList);
    expect(copyEventData).toEqual({});
  });

  it('should include element metadata in copy events', async () => {
    const testElement = document.createElement('div');
    testElement.id = 'test-copy-element';
    testElement.className = 'copy-test-class another-class';
    testElement.setAttribute('aria-label', 'Copy test element');
    document.body.appendChild(testElement);

    setWindowTextSelection('Test text');
    runStatsigAutoCapture(client, { captureCopyText: true });

    const copyEvent = new ClipboardEvent('copy', {
      bubbles: true,
      cancelable: true,
    });
    testElement.dispatchEvent(copyEvent);

    await new Promise((resolve) => {
      copyEventResolver = resolve;
    });

    const copyEventData = getLastCopyEvent(requestDataList);
    expect(copyEventData['eventName']).toBe(AutoCaptureEventName.COPY);
    expect(copyEventData['metadata']['id']).toBe('test-copy-element');
    expect(copyEventData['metadata']['class']).toBe(
      'copy-test-class another-class',
    );
    expect(copyEventData['metadata']['ariaLabel']).toBe('Copy test element');
    expect(copyEventData['metadata']['selectedText']).toBe('Test text');
  });

  it('should sanitize selected text properly', async () => {
    setWindowTextSelection('Text with <strong>HTML</strong> tags');
    runStatsigAutoCapture(client, { captureCopyText: true });

    const copyEvent = new ClipboardEvent('copy', {
      bubbles: true,
      cancelable: true,
    });
    testElement.dispatchEvent(copyEvent);

    await new Promise((resolve) => {
      copyEventResolver = resolve;
    });

    const copyEventData = getLastCopyEvent(requestDataList);
    expect(copyEventData['metadata']['selectedText']).toBe(
      'Text with HTML tags',
    );
  });

  it('should not capture selected text if captureCopyText is not set', async () => {
    setWindowTextSelection('copy text');
    runStatsigAutoCapture(client);

    const copyEvent = new ClipboardEvent('copy', {
      bubbles: true,
      cancelable: true,
    });
    testElement.dispatchEvent(copyEvent);

    await new Promise((resolve) => {
      copyEventResolver = resolve;
    });

    const copyEventData = getLastCopyEvent(requestDataList);
    expect(copyEventData['metadata']['selectedText']).toBeUndefined();
  });
});
