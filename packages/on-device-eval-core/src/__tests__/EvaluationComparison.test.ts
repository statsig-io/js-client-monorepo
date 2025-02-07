import EvaluationComparison from '../EvaluationComparison';

describe('EvaluationComparison', () => {
  describe('compareNumbers', () => {
    it('should return true for greater than comparison', () => {
      expect(EvaluationComparison.compareNumbers(5, 3, 'gt')).toBe(true);
    });

    it('should return false for less than comparison', () => {
      expect(EvaluationComparison.compareNumbers(2, 3, 'gt')).toBe(false);
    });

    it('should handle null values', () => {
      expect(EvaluationComparison.compareNumbers(null, 3, 'gt')).toBe(false);
    });

    it('should handle non-numeric values', () => {
      expect(EvaluationComparison.compareNumbers('a', 3, 'gt')).toBe(false);
    });
  });

  describe('compareVersions', () => {
    it('should return true for version greater than comparison', () => {
      expect(
        EvaluationComparison.compareVersions('1.2.0', '1.1.9', 'version_gt'),
      ).toBe(true);
    });

    it('should return false for version less than comparison', () => {
      expect(
        EvaluationComparison.compareVersions('1.0.0', '1.0.1', 'version_gt'),
      ).toBe(false);
    });

    it('should handle null values', () => {
      expect(
        EvaluationComparison.compareVersions(null, '1.0.0', 'version_gt'),
      ).toBe(false);
    });
  });

  describe('compareStringInArray', () => {
    it('should return true if string is in array', () => {
      expect(
        EvaluationComparison.compareStringInArray(
          'apple',
          ['apple', 'banana'],
          'any',
        ),
      ).toBe(true);
    });

    it('should return false if string is not in array', () => {
      expect(
        EvaluationComparison.compareStringInArray(
          'cherry',
          ['apple', 'banana'],
          'any',
        ),
      ).toBe(false);
    });

    it('should handle non-array inputs', () => {
      expect(
        EvaluationComparison.compareStringInArray(
          'apple',
          'not an array',
          'any',
        ),
      ).toBe(false);
    });
  });

  describe('compareStringWithRegEx', () => {
    it('should return true if string matches regex', () => {
      expect(
        EvaluationComparison.compareStringWithRegEx('hello world', '^hello'),
      ).toBe(true);
    });

    it('should return false if string does not match regex', () => {
      expect(
        EvaluationComparison.compareStringWithRegEx('goodbye world', '^hello'),
      ).toBe(false);
    });
  });

  describe('compareTime', () => {
    it('should return true if left time is before right time', () => {
      expect(
        EvaluationComparison.compareTime('2023-01-01', '2023-01-02', 'before'),
      ).toBe(true);
    });

    it('should return false if left time is not before right time', () => {
      expect(
        EvaluationComparison.compareTime('2023-01-02', '2023-01-01', 'before'),
      ).toBe(false);
    });

    it('should handle invalid date formats', () => {
      expect(
        EvaluationComparison.compareTime(
          'invalid date',
          '2023-01-01',
          'before',
        ),
      ).toBe(false);
    });
  });

  describe('arrayHasValue', () => {
    it('should return true if array has the value', () => {
      expect(EvaluationComparison.arrayHasValue([1, 2, 3], ['2'])).toBe(true);
    });

    it('should return false if array does not have the value', () => {
      expect(EvaluationComparison.arrayHasValue([1, 2, 3], ['4'])).toBe(false);
    });
  });

  describe('arrayHasAllValues', () => {
    it('should return true if array has all values', () => {
      expect(
        EvaluationComparison.arrayHasAllValues([1, 2, 3], ['1', '2']),
      ).toBe(true);
    });

    it('should return false if array does not have all values', () => {
      expect(
        EvaluationComparison.arrayHasAllValues([1, 2, 3], ['1', '4']),
      ).toBe(false);
    });
  });
});
