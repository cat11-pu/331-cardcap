// cards.js：标签累加与溢出
export function bumpLabel(labels, label, value) {
  const rows = (labels || []).map(function (row) { return [row[0], row[1]]; });
  for (const row of rows) {
    if (row[0] === label) {
      row[1] += value;
      return rows;
    }
  }
  rows.push([label, value]);
  rows.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  return rows;
}

export function overflowLeft(overflow, overflowCap) {
  return overflowCap - overflow;
}
