import { _getCurrentPageUrlSafe } from '@statsig/client-core';

import { _getAnchorNodeInHierarchy } from './commonUtils';

const MAX_ATTRIBUTE_LENGTH = 1000;
const MAX_CLASS_LIST_LENGTH = 100;
const MAX_SELECTOR_DEPTH = 50;

export function _gatherEventData(target: Element): {
  value: string;
  metadata: Record<string, unknown>;
} {
  const tagName = target.tagName.toLowerCase();
  const metadata: Record<string, string | null> = {};
  const value = _getCurrentPageUrlSafe() || '';

  metadata['tagName'] = tagName;

  const elementMetadata = _getMetadataFromElement(target);
  Object.assign(metadata, elementMetadata);

  if (tagName === 'form') {
    Object.assign(metadata, _getFormMetadata(target));
  }

  if (
    ['input', 'select', 'textarea'].includes(tagName) &&
    target.getAttribute('type') !== 'password'
  ) {
    Object.assign(metadata, _getInputMetadata(target));
  }

  const anchor = _getAnchorNodeInHierarchy(target);
  if (anchor) {
    Object.assign(metadata, _getAnchorMetadata(anchor));
  }

  if (tagName === 'button' || anchor) {
    Object.assign(metadata, _getButtonMetadata(anchor || target));
  }

  return { value, metadata };
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

export function _getMetadataFromElement(
  target: Element,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  const classList = Array.from(target.classList);
  metadata['classList'] =
    classList.length > 0 ? classList.slice(0, MAX_CLASS_LIST_LENGTH) : null;

  metadata['class'] = _normalizeClassAttribute(
    _truncateString(target.getAttribute('class'), MAX_ATTRIBUTE_LENGTH) || '',
  );
  metadata['id'] = _truncateString(
    target.getAttribute('id'),
    MAX_ATTRIBUTE_LENGTH,
  );
  metadata['ariaLabel'] = _truncateString(
    target.getAttribute('aria-label'),
    MAX_ATTRIBUTE_LENGTH,
  );

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
