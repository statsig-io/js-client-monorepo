import { _DJB2 } from '@statsig/client-core';
import { SHA256 } from '@statsig/sha256';
import { Base64 } from '@statsig/sha256';

export type HashAlgorithm = 'none' | 'djb2' | 'sha256';

export const hashString = (str: string, algo: HashAlgorithm): string => {
  if (algo === 'none') {
    return str;
  }

  if (algo === 'djb2') {
    return _DJB2(str);
  }

  if (algo === 'sha256') {
    const sha256 = SHA256(str);
    const buffer = sha256.arrayBuffer();
    return Base64.encodeArrayBuffer(buffer);
  }

  return str;
};

export const hashPrivateAttributes = (
  privateAttributes: Record<string, unknown>,
): string => {
  let val = 0;
  for (const key in privateAttributes) {
    if (Object.prototype.hasOwnProperty.call(privateAttributes, key)) {
      const value = privateAttributes[key];
      const str = `${key}:${value == null ? '' : String(value)}`;
      const hash = parseInt(_DJB2(str), 10);
      val += hash;
      val &= 0xffffffff;
    }
  }
  return val.toString();
};
