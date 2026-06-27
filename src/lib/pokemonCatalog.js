import pokemonVariantPrices from "../../data/pokerogue_variant_prices_de.json";

const spriteBase =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

export const POKEMON_GRADES = [
  "Wild",
  "Trainiert",
  "Kampfbereit",
  "Elite",
  "Perfekt",
];

const basePokemonCatalog = pokemonVariantPrices.map((pokemon) => ({
  id: Number(pokemon.id),
  name: pokemon.pokemon,
  rarity: pokemon.rarity,
  image: getPokemonImage(pokemon.id),
  variants: pokemon.varianten.map((variant) => ({
    grade: variant.grade,
    shiny: Boolean(variant.shiny),
    price: Number(variant.preis),
  })),
}));

const pokemonById = new Map(
  basePokemonCatalog.map((pokemon) => [pokemon.id, pokemon])
);
const pokemonByName = new Map(
  basePokemonCatalog.map((pokemon) => [pokemon.name.toLowerCase(), pokemon])
);
let pokemonPriceOverrides = {};

export const pokemonCatalog = basePokemonCatalog;

export function setPokemonPriceOverrides(overrides = {}) {
  pokemonPriceOverrides = Object.fromEntries(
    Object.entries(overrides)
      .map(([key, value]) => [key, Number(value)])
      .filter(([, value]) => Number.isFinite(value) && value >= 0)
  );
}

export function getPokemonImage(id, shiny = false) {
  const shinyPath = shiny ? "/shiny" : "";
  return `${spriteBase}${shinyPath}/${Number(id)}.png`;
}

export function getPokemonCatalog() {
  return basePokemonCatalog.map(applyPriceOverrides);
}

export function getPokemonById(id) {
  const pokemon = pokemonById.get(Number(id));
  return pokemon ? applyPriceOverrides(pokemon) : null;
}

export function getPokemonByName(name) {
  const pokemon = pokemonByName.get(String(name).toLowerCase());
  return pokemon ? applyPriceOverrides(pokemon) : null;
}

export function getPokemonVariant(pokemonId, grade, shiny) {
  const pokemon = getPokemonById(pokemonId);
  if (!pokemon) return null;

  return (
    pokemon.variants.find(
      (variant) => variant.grade === grade && variant.shiny === Boolean(shiny)
    ) ?? null
  );
}

export function getBasePokemonPrice(pokemon) {
  const baseVariant =
    pokemon.variants.find(
      (variant) => variant.grade === "Kampfbereit" && !variant.shiny
    ) ?? pokemon.variants[0];

  return baseVariant.price;
}

export function getClosestVariant(pokemon, value) {
  const targetValue = Number(value);
  if (!pokemon || !Number.isFinite(targetValue)) {
    return pokemon?.variants[0] ?? null;
  }

  return pokemon.variants.reduce((closestVariant, variant) => {
    const closestDistance = Math.abs(closestVariant.price - targetValue);
    const currentDistance = Math.abs(variant.price - targetValue);
    return currentDistance < closestDistance ? variant : closestVariant;
  }, pokemon.variants[0]);
}

export function getVariantName({ pokemon, grade, shiny }) {
  return `${shiny ? "Shiny " : ""}${pokemon} - ${grade}`;
}

export function getPokemonPriceOverrideKey(pokemonId, grade, shiny) {
  return `${Number(pokemonId)}:${grade}:${Boolean(shiny) ? "shiny" : "normal"}`;
}

function applyPriceOverrides(pokemon) {
  return {
    ...pokemon,
    variants: pokemon.variants.map((variant) => {
      const overrideKey = getPokemonPriceOverrideKey(
        pokemon.id,
        variant.grade,
        variant.shiny
      );
      const customPrice = pokemonPriceOverrides[overrideKey];
      const hasCustomPrice = Number.isFinite(customPrice);

      return {
        ...variant,
        basePrice: variant.price,
        hasCustomPrice,
        price: hasCustomPrice ? customPrice : variant.price,
      };
    }),
  };
}
