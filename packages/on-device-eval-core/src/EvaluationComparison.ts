export default {
  compareNumbers(left: unknown, right: unknown, operator: string): boolean {
    if (left == null || right == null) {
      return false;
    }

    const numA = Number(left);
    const numB = Number(right);
    if (isNaN(numA) || isNaN(numB)) {
      return false;
    }

    switch (operator) {
      case 'gt':
        return left > right;
      case 'gte':
        return left >= right;
      case 'lt':
        return left < right;
      case 'lte':
        return left <= right;
      default:
        return false;
    }
  },

  compareVersions(left: unknown, right: unknown, operator: string): boolean {
    if (left == null || right == null) {
      return false;
    }

    let leftStr = String(left);
    let rightStr = String(right);

    const removeSuffix = (str: string): string => {
      const index = str.indexOf('-');
      return index !== -1 ? str.substring(0, index) : str;
    };

    leftStr = removeSuffix(leftStr);
    rightStr = removeSuffix(rightStr);

    const comparison = (leftStr: string, rightStr: string): number => {
      const leftParts = leftStr.split('.').map((part) => parseInt(part));
      const rightParts = rightStr.split('.').map((part) => parseInt(part));

      let i = 0;
      while (i < Math.max(leftParts.length, rightParts.length)) {
        const leftCount = i < leftParts.length ? leftParts[i] : 0;
        const rightCount = i < rightParts.length ? rightParts[i] : 0;

        if (leftCount < rightCount) {
          return -1;
        }

        if (leftCount > rightCount) {
          return 1;
        }

        i++;
      }
      return 0;
    };

    const result = comparison(leftStr, rightStr);
    switch (operator) {
      case 'version_gt':
        return result > 0;
      case 'version_gte':
        return result >= 0;
      case 'version_lt':
        return result < 0;
      case 'version_lte':
        return result <= 0;
      case 'version_eq':
        return result === 0;
      case 'version_neq':
        return result !== 0;
      default:
        return false;
    }
  },

  compareStringInArray(
    value: unknown,
    array: unknown,
    operator: string,
  ): boolean {
    if (!Array.isArray(array)) {
      return false;
    }

    const ignoreCase =
      operator !== 'any_case_sensitive' && operator !== 'none_case_sensitive';

    const result =
      array.findIndex((current) => {
        const valueString = String(value);
        const currentString = String(current);

        const left = ignoreCase ? valueString.toLowerCase() : valueString;
        const right = ignoreCase ? currentString.toLowerCase() : currentString;

        switch (operator) {
          case 'any':
          case 'none':
          case 'any_case_sensitive':
          case 'none_case_sensitive':
            return left === right;
          case 'str_starts_with_any':
            return left.startsWith(right);
          case 'str_ends_with_any':
            return left.endsWith(right);
          case 'str_contains_any':
          case 'str_contains_none':
            return left.includes(right);
          default:
            return false;
        }
      }) !== -1;

    switch (operator) {
      case 'none':
      case 'none_case_sensitive':
      case 'str_contains_none':
        return !result;
      default:
        return result;
    }
  },

  compareStringWithRegEx(value: unknown, target: unknown): boolean {
    try {
      const valueString = String(value);
      if (valueString.length < 1000) {
        return new RegExp(String(target)).test(valueString);
      }
    } catch (e) {
      // noop
    }

    return false;
  },

  compareTime(left: unknown, right: unknown, operator: string): boolean {
    if (left == null || right == null) {
      return false;
    }

    try {
      //convert to normalized date
      const dateLeft = _toNormalizedDate(left);
      const dateRight = _toNormalizedDate(right);
      if (dateLeft === null || dateRight === null) {
        return false;
      }
      //convert to milliseconds
      const timeLeft = dateLeft.getTime();
      const timeRight = dateRight.getTime();

      switch (operator) {
        case 'before':
          return timeLeft < timeRight;
        case 'after':
          return timeLeft > timeRight;
        case 'on':
          return _startOfDay(dateLeft) === _startOfDay(dateRight);
        default:
          return false;
      }
    } catch (e) {
      // malformatted input, returning false
      return false;
    }
  },

  arrayHasValue(value: unknown[], target: string[]): boolean {
    const valueSet = new Set(value);
    for (let i = 0; i < target.length; i++) {
      if (
        valueSet.has(target[i]) ||
        valueSet.has(parseFloat(target[i] as string))
      ) {
        return true;
      }
    }
    return false;
  },

  arrayHasAllValues(value: unknown[], target: string[]): boolean {
    const valueSet = new Set(value);
    for (let i = 0; i < target.length; i++) {
      if (
        !valueSet.has(target[i]) &&
        !valueSet.has(parseFloat(target[i] as string))
      ) {
        return false;
      }
    }
    return true;
  },
};

function _startOfDay(date: Date): number {
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

function _toNormalizedDate(value: unknown): Date | null {
  // If it's a valid number (including numeric strings)
  const num = Number(value);
  if (!isNaN(num)) {
    return num < 1e10 ? new Date(num * 1000) : new Date(num);
  }

  // Check if its a date
  const date = new Date(String(value));
  return isNaN(date.getTime()) ? null : date;
}
