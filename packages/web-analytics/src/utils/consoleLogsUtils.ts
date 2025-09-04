function _truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength) + '...';
}

export function _safeStringify(
  val: unknown,
  maxKeysCount: number,
  maxDepth: number,
  maxLength: number,
): string {
  try {
    if (_shouldNotStringify(val as object, maxKeysCount, maxDepth)) {
      return _simpleStringify(val as object, maxLength);
    }

    if (typeof val === 'string') {
      return _truncateString(val, maxLength);
    }
    if (typeof val === 'object' && val !== null) {
      return _truncateString(JSON.stringify(val), maxLength);
    }

    return _truncateString(String(val), maxLength);
  } catch {
    return _truncateString('[Unserializable]', maxLength);
  }
}

export function _getStackTrace(): string[] {
  try {
    return new Error().stack?.split('\n').slice(2) ?? [];
  } catch {
    return [];
  }
}

function _shouldNotStringify(
  val: object,
  maxKeysCount: number,
  maxDepth: number,
): boolean {
  if (_isPlainObject(val)) {
    if (Object.keys(val).length > maxKeysCount) {
      return true;
    }
    if (_isObjectTooDeep(val, maxDepth)) {
      return true;
    }
  }

  if (typeof val === 'function') {
    return true;
  }

  return false;
}

function _isPlainObject(obj: unknown): boolean {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function _isObjectTooDeep(obj: unknown, maxDepth: number): boolean {
  if (maxDepth <= 0) {
    return true;
  }
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  return Object.keys(obj).some((key) =>
    _isObjectTooDeep(obj[key as keyof typeof obj], maxDepth - 1),
  );
}

function _simpleStringify(val: object, maxLength: number): string {
  return _truncateString(val.toString(), maxLength);
}
