export const _fastApproxSizeOf = (
  o: Record<string, unknown> | Array<unknown>,
  m: number,
): number => {
  const c: Array<Record<string, unknown> | Array<unknown>> = [o],
    k = [Object.keys(o)],
    i = [0],
    z = [0];
  let n = 0,
    r = 0;
  for (;;) {
    if (i[n] < k[n].length) {
      const t = k[n][i[n]++],
        v = (c[n] as Record<string, unknown>)[t];
      z[n] += t.length;
      if (v && typeof v == 'object') {
        c[++n] = v as Record<string, unknown> | Array<unknown>;
        k[n] = Object.keys(v);
        i[n] = z[n] = 0;
        continue;
      }
      z[n] += (v + '').length + 1;
      if (z[n] < m) continue;
    }
    for (r = z[n--]; n >= 0 && (z[n] += r + 2) >= m; r = z[n--]);
    if (n < 0) return r;
  }
};
