import { _getCurrentPageUrlSafe, _getWindowSafe } from '@statsig/client-core';

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

  if (tagName === 'button') {
    metadata['content'] = (target.textContent || '').trim();
  }

  const anchor = _getAnchorNodeInHierarchy(target);
  if (anchor) {
    metadata['href'] = anchor.getAttribute('href');
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
