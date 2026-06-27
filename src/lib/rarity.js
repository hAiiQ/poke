export function getRarityTone(rarity) {
  return (
    String(rarity ?? "custom")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "custom"
  );
}
