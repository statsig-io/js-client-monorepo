import { _makeLayer } from '../StatsigTypeFactories';

describe('Typed Getter', () => {
  let exposed = false;

  const value = {
    bool: true,
    num: 1,
    str: 'a',
    arr: ['a'],
    obj: { a: 'a' },
  };

  const config = _makeLayer(
    '',
    {} as any,
    { value } as any,
    () => (exposed = true),
  );

  const get = config.get;

  beforeEach(() => {
    exposed = false;
  });

  it('knows about typescript types', () => {
    expect(get<boolean>('', true)).toBeDefined();
    expect(get<number>('', 1)).toBeDefined();
    expect(get<string>('', 'a')).toBeDefined();
    expect(get<unknown[]>('', ['a'])).toBeDefined();
    expect(get<Record<string, unknown>>('', { a: 'a' })).toBeDefined();
  });

  it('gets the fallback when the key is not found', () => {
    expect(get('', true)).toStrictEqual(true);
    expect(get('', 1)).toStrictEqual(1);
    expect(get('', 'a')).toStrictEqual('a');
    expect(get('', ['a'])).toStrictEqual(['a']);
    expect(get('', { a: 'a' })).toStrictEqual({ a: 'a' });
  });

  it('gets correct types for the string type', () => {
    const fallback = '';
    expect(get('bool', fallback)).toStrictEqual(fallback);
    expect(get('num', fallback)).toStrictEqual(fallback);
    expect(get('str', fallback)).toStrictEqual('a');
    expect(get('arr', fallback)).toStrictEqual(fallback);
    expect(get('obj', fallback)).toStrictEqual(fallback);
  });

  it('gets correct types for the array type', () => {
    const fallback = Array<unknown>();
    expect(get('bool', fallback)).toStrictEqual(fallback);
    expect(get('num', fallback)).toStrictEqual(fallback);
    expect(get('str', fallback)).toStrictEqual(fallback);
    expect(get('arr', fallback)).toStrictEqual(['a']);
    expect(get('obj', fallback)).toStrictEqual(fallback);
  });

  it('gets correct types for the object type', () => {
    const fallback = {};
    expect(get('bool', fallback)).toStrictEqual(fallback);
    expect(get('num', fallback)).toStrictEqual(fallback);
    expect(get('str', fallback)).toStrictEqual(fallback);
    expect(get('arr', fallback)).toStrictEqual(fallback);
    expect(get('obj', fallback)).toStrictEqual({ a: 'a' });
  });

  it('gets correct types for the boolean type', () => {
    const fallback = false;
    expect(get('bool', fallback)).toStrictEqual(true);
    expect(get('num', fallback)).toStrictEqual(fallback);
    expect(get('str', fallback)).toStrictEqual(fallback);
    expect(get('arr', fallback)).toStrictEqual(fallback);
    expect(get('obj', fallback)).toStrictEqual(fallback);
  });

  it('gets correct types for the number type', () => {
    const fallback = 0;
    expect(get('bool', fallback)).toStrictEqual(fallback);
    expect(get('num', fallback)).toStrictEqual(1);
    expect(get('str', fallback)).toStrictEqual(fallback);
    expect(get('arr', fallback)).toStrictEqual(fallback);
    expect(get('obj', fallback)).toStrictEqual(fallback);
  });

  it('exposes when a value is found', () => {
    get('num');
    expect(exposed).toBe(true);
  });

  it('does not expose when no value is found', () => {
    get('not_a_value');
    expect(exposed).toBe(false);
  });

  it('does not expose on type mismatch', () => {
    get('num', '');
    expect(exposed).toBe(false);
  });
});
