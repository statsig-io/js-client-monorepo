import { _getStackTrace, _safeStringify } from '../consoleLogsUtils';

describe('consoleLogsUtils', () => {
  describe('_safeStringify', () => {
    const defaultMaxKeys = 100;
    const defaultMaxDepth = 10;
    const defaultMaxStringLength = 1000;

    it('should handle null values', () => {
      const result = _safeStringify(
        null,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('null');
    });

    it('should handle undefined values', () => {
      const result = _safeStringify(
        undefined,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('undefined');
    });

    it('should handle strings', () => {
      const result = _safeStringify(
        'test string',
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('test string');
    });

    it('should handle numbers', () => {
      const result = _safeStringify(
        123,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('123');
    });

    it('should handle booleans', () => {
      const result = _safeStringify(
        true,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('true');
    });

    it('should handle functions', () => {
      const testFn = () => 'test';
      const result = _safeStringify(
        testFn,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toContain('() =>');
    });

    it('should handle symbols', () => {
      const symbol = Symbol('test');
      const result = _safeStringify(
        symbol,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toContain('Symbol(test)');
    });

    it('should handle plain objects', () => {
      const obj = { key: 'value', number: 123 };
      const result = _safeStringify(
        obj,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('{"key":"value","number":123}');
    });

    it('should handle arrays', () => {
      const arr = [1, 'string', { nested: 'value' }];
      const result = _safeStringify(
        arr,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('[1,"string",{"nested":"value"}]');
    });

    it('should handle objects with too many keys', () => {
      const obj: Record<string, any> = {};
      for (let i = 0; i < 150; i++) {
        obj[`key${i}`] = `value${i}`;
      }
      const result = _safeStringify(
        obj,
        100,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('[object Object]');
    });

    it('should handle deeply nested objects', () => {
      const deepObj: any = {};
      let current = deepObj;
      for (let i = 0; i < 15; i++) {
        current.nested = {};
        current = current.nested;
      }
      const result = _safeStringify(
        deepObj,
        defaultMaxKeys,
        10,
        defaultMaxStringLength,
      );
      expect(result).toBe('[object Object]');
    });

    it('should handle circular objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      const result = _safeStringify(
        circularObj,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('[object Object]');
    });

    it('should handle circular arrays', () => {
      const circularArray: any[] = ['test'];
      circularArray.push(circularArray);
      const result = _safeStringify(
        circularArray,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('[Unserializable]');
    });

    it('should handle complex nested circular structures', () => {
      const obj1: any = { name: 'obj1' };
      const obj2: any = { name: 'obj2', ref: obj1 };
      obj1.ref = obj2;
      const result = _safeStringify(
        obj1,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('[object Object]');
    });

    it('should handle objects with getters that throw', () => {
      const objWithBadGetter = {};
      Object.defineProperty(objWithBadGetter, 'badProp', {
        get: () => {
          throw new Error('getter error');
        },
      });
      const result = _safeStringify(
        objWithBadGetter,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe('{}');
    });

    it('should respect maxStringLength parameter for strings', () => {
      const longString = 'a'.repeat(2000);
      const result = _safeStringify(
        longString,
        defaultMaxKeys,
        defaultMaxDepth,
        100,
      );
      expect(result).toBe('a'.repeat(100) + '...');
    });

    it('should respect maxStringLength parameter for objects', () => {
      const obj = { key: 'a'.repeat(2000) };
      const result = _safeStringify(obj, defaultMaxKeys, defaultMaxDepth, 100);
      expect(result.length).toBe(103);
      expect(result).toContain('...');
    });

    it('should respect maxStringLength parameter for numbers', () => {
      const longNumber = '1'.repeat(2000);
      const result = _safeStringify(
        longNumber,
        defaultMaxKeys,
        defaultMaxDepth,
        100,
      );
      expect(result).toBe('1'.repeat(100) + '...');
    });

    it('should handle non-plain objects', () => {
      const date = new Date();
      const result = _safeStringify(
        date,
        defaultMaxKeys,
        defaultMaxDepth,
        defaultMaxStringLength,
      );
      expect(result).toBe(JSON.stringify(date));
    });
  });

  describe('_getStackTrace', () => {
    it('should return an array of stack trace lines', () => {
      const stackTrace = _getStackTrace();
      expect(Array.isArray(stackTrace)).toBe(true);
      expect(stackTrace.length).toBeGreaterThan(0);
    });

    it('should handle stack trace generation errors gracefully', () => {
      // Mock Error constructor to throw
      const originalError = global.Error;
      global.Error = jest.fn().mockImplementation(() => {
        throw new Error('Stack trace error');
      }) as any;

      const stackTrace = _getStackTrace();
      expect(stackTrace).toEqual([]);

      global.Error = originalError;
    });

    it('should return empty array when stack is undefined', () => {
      // Mock Error to return undefined stack
      const originalError = global.Error;
      global.Error = jest.fn().mockImplementation(() => ({
        stack: undefined,
      })) as any;

      const stackTrace = _getStackTrace();
      expect(stackTrace).toEqual([]);

      global.Error = originalError;
    });
  });
});
