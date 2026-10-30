export interface Range {
  start: number;
  end: number;
}

export function overlaps(a: Range, b: Range): boolean {
  return a.start <= b.end && b.start <= a.end;
}

export function merge(ranges: Range[]): Range[] {
  const sorted = [...ranges].sort((left, right) => left.start - right.start);
  const merged: Range[] = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    if (last !== undefined && overlaps(last, range)) {
      last.end = Math.max(last.end, range.end);
      continue;
    }
    merged.push({ ...range });
  }
  return merged;
}
