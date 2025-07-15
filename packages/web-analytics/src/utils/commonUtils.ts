import { _getCurrentPageUrlSafe, _getWindowSafe } from '@statsig/client-core';

interface NetworkInformation {
  downlink: number;
  effectiveType: string;
  rtt: number;
  saveData: boolean;
}

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

export function _shouldLogEvent(e: Event, el: Element): boolean {
  if (!e || !el || el.nodeType !== 1) {
    return false;
  }

  const tagName = el.tagName.toLowerCase();
  const eventType = e.type.toLowerCase();

  switch (tagName) {
    case 'html':
      return false;
    case 'form':
      return eventType === 'submit';
    case 'input':
    case 'select':
    case 'textarea':
      return ['change'].includes(eventType);
    default:
      if (eventType === 'click') {
        if (tagName === 'button') {
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
