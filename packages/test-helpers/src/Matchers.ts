import { expect } from '@jest/globals';

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
