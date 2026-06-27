import { getPokemonById, getPokemonImage } from "./pokemonCatalog.js";

export function pickWeightedDrop(items = []) {
  if (!items.length) return null;

  const totalWeight = items.reduce(
    (sum, item) => sum + getDropWeight(item),
    0
  );
  const roll = Math.random() * totalWeight;
  let cursor = 0;

  for (const item of items) {
    cursor += getDropWeight(item);
    if (roll <= cursor) return item;
  }

  return items[items.length - 1];
}

export function prepareDrop(drop, caseItem) {
  const pokemon = drop?.pokemonId ? getPokemonById(drop.pokemonId) : null;

  return {
    ...drop,
    image: getDropImage(drop, caseItem),
    fallbackImage: getDropFallbackImage(drop, caseItem),
    rarity: drop?.rarity ?? pokemon?.rarity ?? caseItem?.rarity,
  };
}

function getDropImage(drop, caseItem) {
  if (drop?.pokemonId && drop.shiny) {
    return getPokemonImage(drop.pokemonId, true);
  }

  if (drop?.image) return drop.image;
  if (drop?.pokemonId) return getPokemonImage(drop.pokemonId);

  return caseItem?.coverImage ?? getPokemonImage(caseItem?.previewIds?.[0] ?? 1);
}

function getDropFallbackImage(drop, caseItem) {
  if (drop?.pokemonId) return getPokemonImage(drop.pokemonId);
  return caseItem?.coverImage ?? getPokemonImage(caseItem?.previewIds?.[0] ?? 1);
}

function getDropWeight(item) {
  const weight = Number(item?.chance ?? item?.weight ?? 0);
  return Number.isFinite(weight) && weight > 0 ? weight : 1;
}
