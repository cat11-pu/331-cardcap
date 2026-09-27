// cards.js：标签累加与溢出
export function bumpLabel(labels, label, value) {
  const next = labels.map(function (row) { return [row[0], row[1]]; });
  for (const row of next) {
    if (row[0] === label) { row[1] += value; return next; }
  }
  next.push([label, value]);
  next.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  return next;
}

export function overflowLeft(overflow, overflowCap) {
  return overflowCap - overflow;
}
