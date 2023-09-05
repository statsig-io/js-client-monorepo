import { sha256create } from '../js-sha256';
import { Base64 } from './Base64';
// import { SHA256 } from '../sha256';
import { sha256create as statsig_sha256create } from '../statsig-sha256';

function getExpectedHash(value: string) {
  const buffer = sha256create().update(value).arrayBuffer();
  return Base64.encodeArrayBuffer(buffer);
}

function getActualHash(value: string) {
  // const buffer = SHA256(value);
  const buffer = statsig_sha256create().update(value).arrayBuffer();

  return Base64.encodeArrayBuffer(buffer);
}

describe('Foo', () => {
  it('bar', () => {
    const expected = getExpectedHash('foo');
    const actual = getActualHash('foo');
    expect(actual).toEqual(expected);
  });
});
