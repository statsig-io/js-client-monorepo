import { SHA256 } from './sha256';

export { SHA256 };

declare global {
  interface Window {
    __STATSIG__: {
      [key: string]: unknown;
    };
  }
}

window.__STATSIG__ = {
  ...window.__STATSIG__,
  SHA256,
};
