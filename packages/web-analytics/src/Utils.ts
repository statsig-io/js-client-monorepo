import { DJB2, Log, getUUID, typedJsonParse } from '@statsig/client-core';

const MAX_SESSION_IDLE_TIME = 10 * 60 * 1000; // 10 minutes
const MAX_SESSION_AGE = 4 * 60 * 60 * 1000; // 4 hours

const globals: Record<string, string> = {};

export function gatherEventData(target: Element): {
  value: string;
  metadata: Record<string, string | null>;
} {
  const tagName = target.tagName.toLowerCase();
  const metadata: Record<string, string | null> = {};
  const value = tagName;

  if (tagName === 'form') {
    metadata['action'] = target.getAttribute('action');
    metadata['method'] = target.getAttribute('method') ?? 'GET';
    metadata['formName'] = target.getAttribute('name');
    metadata['formId'] = target.getAttribute('id');
  }

  if (
    ['input', 'select', 'textarea'].includes(tagName) &&
    target.getAttribute('type') !== 'password'
  ) {
    metadata['content'] = (target as HTMLInputElement).value;
    metadata['inputName'] = target.getAttribute('name');
  }

  if (tagName === 'button') {
    metadata['content'] = (target.textContent || '').trim();
  }

  const anchor = _getAnchorNodeInHierarchy(target);
  if (anchor) {
    metadata['href'] = anchor.getAttribute('href');
  }

  return { value, metadata };
}

export function getTargetNode(e: Event): Element | null {
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

export function shouldLogEvent(e: Event, el: Element): boolean {
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

export function getSafeUrl(): URL {
  const href = window?.location?.href || '';
  let url: URL;
  try {
    url = new URL(href);
  } catch (e) {
    url = new URL('error:');
  }
  return url;
}

export function getWebSessionId(sdkKey: string): string {
  const key = `statsig.web_analytics.session.${DJB2(sdkKey)}`;
  const json = _getLocalValue(key);
  const now = Date.now();

  let session = json
    ? typedJsonParse<WebSession>(
        json,
        'lastAccessedTime',
        'Failed to parse WebSession',
      )
    : null;

  if (
    !session ||
    now - session.startTime > MAX_SESSION_AGE ||
    now - session.lastAccessedTime > MAX_SESSION_IDLE_TIME
  ) {
    session = _createNewSession();
  }

  session.lastAccessedTime = now;
  _setLocalValue(key, JSON.stringify(session));

  return session.id;
}

export function getSanitizedPageUrl(): string {
  const url = window?.location?.href?.split(/[?#]/)[0];
  return url || '';
}

export function registerEventHandler(
  element: Document | Window,
  eventType: string,
  handler: (event: Event) => void,
): void {
  if (!element || !element.addEventListener) {
    return;
  }

  element.addEventListener(eventType, handler, true);
}

function _getAnchorNodeInHierarchy(node: Element | null): Element | null {
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

function _setLocalValue(key: string, value: string): void {
  if (window && window.localStorage) {
    window.localStorage.setItem(key, value);
  } else {
    globals[key] = value;
    Log.error('Statsig Web AutoCapture: No window.localStorage');
  }
}

function _getLocalValue(key: string): string | null {
  if (window && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return globals[key];
}

type WebSession = {
  id: string;
  startTime: number;
  lastAccessedTime: number;
};

function _createNewSession(): WebSession {
  const now = Date.now();
  return {
    id: getUUID(),
    startTime: now,
    lastAccessedTime: now,
  };
}
