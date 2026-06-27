export function calculateCasePrice(items, markup = 0.1) {
  if (!items.length) return 0;

  const averageValue =
    items.reduce((sum, item) => sum + Number(item.value), 0) / items.length;

  return roundCasePrice(averageValue * (1 + markup));
}

export function calculateExpectedCasePrice(items, markup = 0.1) {
  if (!items.length) return 0;

  const expectedValue = items.reduce((sum, item) => {
    const chance = Number(item.chance ?? item.weight ?? 0);
    return sum + Number(item.value) * (chance / 100);
  }, 0);

  return roundToTwoDecimals(expectedValue * (1 + markup));
}

export function roundCasePrice(value) {
  if (value === 0) return 0;
  if (value < 1) return Math.ceil(value * 100) / 100;
  if (value < 100) return Math.ceil(value * 4) / 4;
  if (value < 1000) return Math.ceil(value / 5) * 5;
  return Math.ceil(value / 25) * 25;
}

export function roundToTwoDecimals(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
