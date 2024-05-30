import { readFileSync } from 'fs';
import path from 'path';

describe('Supported APIs only', () => {
  const content = readFileSync(
    path.resolve(__dirname, '../assets/statsig-js-client.min.js'),
  ).toString();

  it('does not use Object.entries', () => {
    // https://caniuse.com/?search=Object.entries
    expect(content).not.toContain('Object.entries');
  });
});
