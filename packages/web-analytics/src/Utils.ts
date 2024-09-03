import { _getCurrentPageUrlSafe, _getWindowSafe } from '@statsig/client-core';

interface NetworkInformation {
  downlink: number;
  effectiveType: string;
  rtt: number;
  saveData: boolean;
}

export function _gatherDatasetProperties(el: Element): Record<string, string> {
  const dataset = {} as Record<string, string>;
  if (!el) {
    return dataset;
  }
  const attr = (el as HTMLElement)?.dataset;
  if (!attr) {
    return dataset;
  }

  for (const key in attr) {
    dataset[`data-${key}`] = attr[key] || '';
  }

  return dataset;
}

export function _gatherEventData(target: Element): {
  value: string;
  metadata: Record<string, string | null>;
} {
  const tagName = target.tagName.toLowerCase();
  const metadata: Record<string, string | null> = {};
  const value = _getCurrentPageUrlSafe() || '';

  metadata['tagName'] = tagName;
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

  const anchor = _getAnchorNodeInHierarchy(target);
  if (anchor) {
    metadata['href'] = anchor.getAttribute('href');
  }

  if (tagName === 'button' || anchor) {
    metadata['content'] = (target.textContent || '').trim();
    const dataset = _gatherDatasetProperties(anchor || target);
    Object.assign(metadata, dataset);
  }

  return { value, metadata };
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
