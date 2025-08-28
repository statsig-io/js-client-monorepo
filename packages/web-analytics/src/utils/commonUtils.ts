import { _getCurrentPageUrlSafe, _getWindowSafe } from '@statsig/client-core';

interface NetworkInformation {
  downlink: number;
  effectiveType: string;
  rtt: number;
  saveData: boolean;
}

const coreCCPattern = `(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11})`;
const CC_REGEX = new RegExp(`^(?:${coreCCPattern})$`);

const coreSSNPattern = `\\d{3}-?\\d{2}-?\\d{4}`;
const SSN_REGEX = new RegExp(`^(${coreSSNPattern})$`);

export const interactiveElements: string[] = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'form',
  'select',
  'label',
];

export function _stripEmptyValues<
  T extends Record<string, string | number | null | undefined>,
>(obj: T): Partial<Record<keyof T, string | number>> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, value]) => value != null && value !== '' && value !== undefined,
    ),
  ) as Partial<Record<keyof T, string | number>>;
}

export function _getTargetNode(e: Event): Element | null {
  if (!e) {
    return null;
  }

  let target: EventTarget | null = e.target || e.srcElement;
  if (!target || !(target instanceof Element)) {
    return null;
  }

  if (target.nodeType === 3) {
    target = (target.parentNode || null) as Element | null;
  }

  return target as Element;
}

export function _shouldLogEvent(
  e: Event,
  el: Element,
  isCopyEvent = false,
): boolean {
  if (!e || !el || el.nodeType !== 1) {
    return false;
  }

  const tagName = el.tagName.toLowerCase();
  const eventType = e.type.toLowerCase();
  const classList = el.classList;
  if (classList.contains('statsig-no-capture')) {
    return false;
  }

  if (isCopyEvent) {
    // We don't want to force strict event filtering for copy events
    return true;
  }

  switch (tagName) {
    case 'html':
      return false;
    case 'form':
      return ['submit'].indexOf(eventType) >= 0;
    case 'input':
    case 'select':
    case 'textarea':
      return ['change', 'click'].indexOf(eventType) >= 0;
    default:
      if (eventType === 'click') {
        const compStyles = window.getComputedStyle(el);
        if (compStyles && compStyles.getPropertyValue('cursor') === 'pointer') {
          return true;
        }

        if (interactiveElements.includes(tagName)) {
          return true;
        }

        if (el.getAttribute('contenteditable') === 'true') {
          return true;
        }

        const anchor = _getAnchorNodeInHierarchy(el);
        if (anchor) {
          return true;
        }
      }
      return false;
  }
}

export function _getSafeUrl(): URL {
  const href = _getWindowSafe()?.location?.href ?? '';
  let url: URL;
  try {
    url = new URL(href);
  } catch (e) {
    url = new URL('error:');
  }
  return url;
}

export function _getSafeUrlString(): string {
  const urlString = _getSafeUrl().toString();
  if (urlString.startsWith('error:')) {
    return '';
  }
  return urlString;
}

export function _getSanitizedPageUrl(): string {
  return _getCurrentPageUrlSafe() || '';
}

export function _registerEventHandler(
  element: Document | Window,
  eventType: string,
  handler: (event: Event) => void,
): void {
  if (!element || !element.addEventListener) {
    return;
  }

  element.addEventListener(eventType, handler, true);
}

export function _getSafeNetworkInformation(): NetworkInformation | null {
  const win = _getWindowSafe();
  if (!win || !win.navigator) {
    return null;
  }
  const connection = (
    win.navigator as unknown as { connection?: NetworkInformation }
  ).connection;

  if (!connection) {
    return null;
  }

  return connection;
}

export function _getSafeTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return null;
  }
}

export function _getSafeTimezoneOffset(): number | null {
  try {
    return new Date().getTimezoneOffset();
  } catch (e) {
    return null;
  }
}

export function _getAnchorNodeInHierarchy(
  node: Element | null,
): Element | null {
  if (!node) {
    return null;
  }

  let parent: Element | null = node;
  while (parent) {
    const parentTagName = parent.tagName.toLowerCase();
    if (['body', 'document'].includes(parentTagName)) {
      return null;
    }
    if (parent.tagName.toLowerCase() === 'a') {
      return parent;
    }
    parent = parent.parentElement;
  }

  return null;
}

export function _sanitizeString(
  maybeString: string | null | undefined,
): string | null {
  if (!maybeString) {
    return null;
  }
  return maybeString
    .replace(/<[^>]*>/g, '')
    .trim()
    .split(/(\s+)/)
    .filter((s) => _shouldCaptureTextValue(s))
    .join('')
    .replace(/[\r\n]/g, ' ')
    .replace(/[ ]+/g, ' ')
    .substring(0, 255);
}

function _shouldCaptureTextValue(text: string): boolean {
  if (CC_REGEX.test((text || '').replace(/[- ]/g, ''))) {
    return false;
  }
  if (SSN_REGEX.test((text || '').replace(/[- ]/g, ''))) {
    return false;
  }
  return true;
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number,
): T {
  let lastCall = 0;
  return function (...args: unknown[]) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  } as T;
}

export function wrapFunctionWithRestore(
  targetObject: Record<string, unknown>,
  functionName: string,
  wrapperFactory: (
    original: (...args: unknown[]) => unknown,
  ) => (...args: unknown[]) => unknown,
): () => void {
  const originalFunction = targetObject[functionName];

  if (typeof originalFunction !== 'function') {
    return () => {
      // noop
    };
  }

  try {
    const wrappedFunction = wrapperFactory(
      originalFunction as (...args: unknown[]) => void,
    );

    Object.defineProperty(wrappedFunction, '__statsig_original__', {
      enumerable: false,
      value: originalFunction,
    });

    targetObject[functionName] = wrappedFunction;

    // Restore function
    return () => {
      targetObject[functionName] = originalFunction;
    };
  } catch {
    return () => {
      // noop
    };
  }
}
