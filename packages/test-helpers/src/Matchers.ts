import { expect } from '@jest/globals';

export function anyUUID(): unknown {
  const UUID_V4_REGEX =
    /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}/;
  return expect.stringMatching(UUID_V4_REGEX);
}

export function anyString(): unknown {
  return expect.any(String);
}

export function anyStringContaining(needle: string): unknown {
  return expect.stringContaining(needle);
}

export function anyNumber(): unknown {
  return expect.any(Number);
}

export function anyFunction(): unknown {
  return expect.any(Function);
}

export function anyObject(): unknown {
  return expect.any(Object);
}

export function anyObjectContaining(input: Record<string, unknown>): unknown {
  return expect.objectContaining(input);
}
