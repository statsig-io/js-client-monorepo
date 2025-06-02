import { _getCurrentPageUrlSafe } from '@statsig/client-core';

import { _getAnchorNodeInHierarchy } from './commonUtils';

export function _gatherEventData(target: Element): {
  value: string;
  metadata: Record<string, string | null>;
} {
  const tagName = target.tagName.toLowerCase();
  const metadata: Record<string, string | null> = {};
  const value = _getCurrentPageUrlSafe() || '';

  metadata['tagName'] = tagName;

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
