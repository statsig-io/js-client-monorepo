import { _getWindowSafe } from '@statsig/client-core';

import {
  _getAnchorNodeInHierarchy,
  _getSafeUrl,
  _getSanitizedPageUrl,
  _sanitizeString,
} from './commonUtils';

const MAX_ATTRIBUTE_LENGTH = 1000;
const MAX_CLASS_LIST_LENGTH = 100;
const MAX_SELECTOR_DEPTH = 50;

export function _gatherEventData(target: Element): {
  value: string;
  metadata: Record<string, unknown>;
} {
  const value = _getSanitizedPageUrl() || '';
  const tagName = target.tagName.toLowerCase();

  // If the element is sensitive, we only gather safe attribute fields
  if (_isSensitiveElement(target)) {
    return { value, metadata: _getSafeMetadataAttributes(target) };
  }

  const metadata: Record<string, string | null> = {};

  metadata['tagName'] = tagName;

  const elementMetadata = _getMetadataFromElement(target);
  Object.assign(metadata, elementMetadata);

  if (tagName === 'form') {
    Object.assign(metadata, _getFormMetadata(target));
  }

  if (tagName === 'input') {
    Object.assign(metadata, _getInputMetadata(target));
  }

  const anchor = _getAnchorNodeInHierarchy(target);
  if (anchor) {
    Object.assign(metadata, _getAnchorMetadata(anchor));
  }

  if (tagName === 'button' || anchor) {
    Object.assign(metadata, _getButtonMetadata(anchor || target));
  }

  if (_isOutboundLink(metadata)) {
    metadata['isOutbound'] = 'true';
  }

  return { value, metadata };
}

export function _gatherCopyEventData(e: Event): Record<string, unknown> {
  const selectedText = _getWindowSafe()?.getSelection()?.toString();
  const metadata: Record<string, unknown> = {};
  metadata['selectedText'] = _sanitizeString(selectedText);
  const clipType = (e as ClipboardEvent).type || 'clipboard';
  metadata['clipType'] = clipType;

  return metadata;
}

function _isSensitiveElement(target: Element): boolean {
  return (
    (target.tagName.toLowerCase() === 'input' &&
      ['button', 'checkbox', 'submit', 'reset'].includes(
        target.getAttribute('type') || '',
      )) ||
    target.tagName.toLowerCase() === 'textarea' ||
    target.tagName.toLowerCase() === 'select' ||
    target.getAttribute('contenteditable') === 'true'
  );
}

function _getFormMetadata(target: Element): Record<string, string | null> {
  const metadata: Record<string, string | null> = {};
  metadata['action'] = target.getAttribute('action');
  metadata['method'] = target.getAttribute('method') ?? 'GET';
  metadata['formName'] = target.getAttribute('name');
  metadata['formId'] = target.getAttribute('id');
  return metadata;
}

function _getInputMetadata(target: Element): Record<string, string | null> {
  const metadata: Record<string, string | null> = {};
  metadata['content'] = (target as HTMLInputElement).value;
  metadata['inputName'] = target.getAttribute('name');
  return metadata;
}

function _getAnchorMetadata(anchor: Element): Record<string, string | null> {
  const metadata: Record<string, string | null> = {};
  metadata['href'] = anchor.getAttribute('href');
  return metadata;
}

function _getButtonMetadata(target: Element): Record<string, string | null> {
  const metadata: Record<string, string | null> = {};
  metadata['content'] = (target.textContent || '').trim();
  const dataset = _gatherDatasetProperties(target);
  Object.assign(metadata, dataset);
  return metadata;
}

function _gatherDatasetProperties(el: Element): Record<string, string> {
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

function _truncateString(
  str: string | null | undefined,
  maxLength: number,
): string | null {
  if (!str) return null;
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}
function _isOutboundLink(metadata: Record<string, unknown>): boolean {
  if (
    Array.isArray(metadata['classList']) &&
    metadata['classList']?.includes('statsig-ctr-capture')
  ) {
    return true;
  }

  const href = metadata['href'] as string;
  if (href) {
    try {
      const currentUrl = _getSafeUrl();
      const linkUrl = new URL(href);

      return currentUrl.host !== linkUrl.host;
    } catch {
      // Invalid URL, treat as non-outbound
      return false;
    }
  }

  return false;
}

function _getSafeMetadataAttributes(elem: Element): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  metadata['class'] = _normalizeClassAttribute(
    _truncateString(elem.getAttribute('class'), MAX_ATTRIBUTE_LENGTH) || '',
  );
  metadata['id'] = _truncateString(
    elem.getAttribute('id'),
    MAX_ATTRIBUTE_LENGTH,
  );
  metadata['ariaLabel'] = _truncateString(
    elem.getAttribute('aria-label'),
    MAX_ATTRIBUTE_LENGTH,
  );

  metadata['name'] = _truncateString(
    elem.getAttribute('name'),
    MAX_ATTRIBUTE_LENGTH,
  );

  return metadata;
}

export function _getMetadataFromElement(
  target: Element,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  const safeAttributes = _getSafeMetadataAttributes(target);
  Object.assign(metadata, safeAttributes);

  const classList = Array.from(target.classList);
  metadata['classList'] =
    classList.length > 0 ? classList.slice(0, MAX_CLASS_LIST_LENGTH) : null;

  metadata['selector'] = _generateCssSelector(target);
  return metadata;
}

function _normalizeClassAttribute(className: string): string {
  return className.replace(/\s+/g, ' ').trim();
}

function hasNextSiblingWithSameTag(element: Element): boolean {
  let sibling: Element | null = element.nextElementSibling;
  while (sibling) {
    if (sibling.tagName === element.tagName) {
      return true;
    }
    sibling = sibling.nextElementSibling;
  }
  return false;
}

function getElementSelector(element: Element): string {
  const tagName = element.tagName.toLowerCase();

  // 1. Use ID if available
  if (element.id) {
    return `#${element.id}`;
  }

  // 2. Build class-based selector
  let selector = tagName;
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/);
    if (classes.length > 0 && classes[0] !== '') {
      selector += '.' + classes.join('.');
    }
  }

  const parent = element.parentElement;
  if (parent && parent.children.length > 1) {
    let nthChild = 1;
    let nthOfType = 1;
    let sibling: Element | null = element.previousElementSibling;

    while (sibling) {
      nthChild++;
      if (sibling.tagName === element.tagName) {
        nthOfType++;
      }
      sibling = sibling.previousElementSibling;
    }

    selector += `:nth-child(${nthChild})`;

    // Only add nth-of-type if there are other elements with the same tag
    if (nthOfType > 1 || hasNextSiblingWithSameTag(element)) {
      selector += `:nth-of-type(${nthOfType})`;
    }
  }

  return selector;
}

function _generateCssSelector(element: Element): string {
  if (!element) {
    return '';
  }

  // Handle case where element has no parent (e.g., detached element)
  if (!element.parentNode) {
    const tagName = element.tagName.toLowerCase();
    if (element.id) {
      return `#${element.id}`;
    }

    let selector = tagName;
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/);
      if (classes.length > 0 && classes[0] !== '') {
        selector += '.' + classes.join('.');
      }
    }
    return selector;
  }

  // Build the full selector path
  const selectors: string[] = [];
  let currentElement: Element | null = element;
  let depth = 0;

  while (
    currentElement &&
    currentElement.nodeType === Node.ELEMENT_NODE &&
    depth < MAX_SELECTOR_DEPTH
  ) {
    const selector = getElementSelector(currentElement);
    selectors.unshift(selector);

    // Stop if we found an ID (since IDs should be unique)
    if (currentElement.id) {
      break;
    }

    currentElement = currentElement.parentElement;

    // Stop at document body to avoid going too far up
    if (currentElement && currentElement.tagName.toLowerCase() === 'body') {
      break;
    }

    depth++;
  }

  return selectors.join(' > ');
}
