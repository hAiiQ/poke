export function withDropChances(items) {
  const totalWeight = items.reduce((sum, item) => sum + getItemWeight(item), 0);

  return items.map((item) => ({
    ...item,
    chance: totalWeight ? (getItemWeight(item) / totalWeight) * 100 : 0,
  }));
}

function getItemWeight(item) {
  return Number(item.weight ?? 1);
}
