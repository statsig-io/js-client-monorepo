import { sha256create } from './statsig-sha256';
// import { sha256create } from './js-sha256';

export function SHA256(input: string): ArrayBuffer {
  return sha256create().update(input).arrayBuffer();
}
