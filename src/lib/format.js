export function formatCurrency(value) {
  return Number(value).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInteger(value) {
  return Number(value).toLocaleString("de-DE");
}

export function formatShortNumber(value) {
  return new Intl.NumberFormat("de-DE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
