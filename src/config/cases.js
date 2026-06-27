import { calculateCasePrice } from "../lib/casePricing.js";
import { withDropChances } from "../lib/dropChances.js";

const spriteBase =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

function pokemonSprite(id) {
  return `${spriteBase}/${id}.png`;
}

function buildCase(caseConfig) {
  const items = withDropChances(caseConfig.items);
  const price =
    caseConfig.priceOverride ?? calculateCasePrice(items, 0.1);

  return {
    ...caseConfig,
    items,
    price,
    coverImage: caseConfig.coverImage ?? pokemonSprite(caseConfig.previewIds[0]),
    previewSprites: caseConfig.previewIds.map(pokemonSprite),
  };
}

// Replace each coverImage value with the final case artwork URL later.
export const cases = [
  buildCase({
    id: "free",
    name: "Free Case",
    coverImage: pokemonSprite(13),
    category: "Täglich",
    rarity: "Common",
    requirement: "Kostenlos",
    priceOverride: 0,
    previewIds: [13, 10, 16],
    items: [
      { pokemon: "Hornliu", pokemonId: 13, value: 0.03, weight: 90 },
      { pokemon: "Raupy", pokemonId: 10, value: 0.21, weight: 10 },
    ],
  }),
  buildCase({
    id: "basic",
    name: "Basic Case",
    coverImage: pokemonSprite(1),
    category: "Starter",
    rarity: "Uncommon",
    requirement: "Offen",
    previewIds: [1, 4, 7],
    items: [
      { pokemon: "Bisasam", pokemonId: 1, value: 0.43, weight: 35 },
      { pokemon: "Glumanda", pokemonId: 4, value: 0.47, weight: 35 },
      { pokemon: "Schiggy", pokemonId: 7, value: 0.46, weight: 35 },
      { pokemon: "Evoli", pokemonId: 133, value: 1.15, weight: 12 },
    ],
  }),
  buildCase({
    id: "spark",
    name: "Spark Case",
    coverImage: pokemonSprite(25),
    category: "Case",
    rarity: "Rare",
    requirement: "Offen",
    previewIds: [25, 26, 135],
    items: [
      { pokemon: "Voltobal", pokemonId: 100, value: 0.77, weight: 50 },
      { pokemon: "Blitza", pokemonId: 135, value: 3.6, weight: 28 },
      { pokemon: "Pikachu", pokemonId: 25, value: 6.95, weight: 18 },
      { pokemon: "Raichu", pokemonId: 26, value: 16.25, weight: 4 },
    ],
  }),
  buildCase({
    id: "evolution",
    name: "Evolution Case",
    coverImage: pokemonSprite(6),
    category: "Case",
    rarity: "Epic",
    requirement: "Offen",
    previewIds: [6, 130, 448],
    items: [
      { pokemon: "Lucario", pokemonId: 448, value: 8.65, weight: 38 },
      { pokemon: "Garados", pokemonId: 130, value: 10.25, weight: 32 },
      { pokemon: "Glurak", pokemonId: 6, value: 16, weight: 22 },
      { pokemon: "Quajutsu", pokemonId: 658, value: 44, weight: 8 },
    ],
  }),
  buildCase({
    id: "battle",
    name: "Battle Case",
    coverImage: pokemonSprite(384),
    category: "Battle",
    rarity: "Legendary",
    requirement: "Battles",
    previewIds: [150, 151, 384],
    items: [
      { pokemon: "Mew", pokemonId: 151, value: 4687, weight: 46 },
      { pokemon: "Mewtu", pokemonId: 150, value: 5572, weight: 42 },
      { pokemon: "Rayquaza", pokemonId: 384, value: 13349, weight: 12 },
    ],
  }),
  buildCase({
    id: "level-10",
    name: "Level 10 Case",
    coverImage: pokemonSprite(133),
    category: "Level",
    rarity: "Rare",
    requirement: "Level 10",
    previewIds: [133, 134, 197],
    items: [
      { pokemon: "Evoli", pokemonId: 133, value: 1.15, weight: 55 },
      { pokemon: "Aquana", pokemonId: 134, value: 3.65, weight: 30 },
      { pokemon: "Nachtara", pokemonId: 197, value: 5.25, weight: 15 },
    ],
  }),
  buildCase({
    id: "level-20",
    name: "Level 20 Case",
    coverImage: pokemonSprite(6),
    category: "Level",
    rarity: "Epic",
    requirement: "Level 20",
    previewIds: [6, 9, 3],
    items: [
      { pokemon: "Bisaflor", pokemonId: 3, value: 6.85, weight: 42 },
      { pokemon: "Turtok", pokemonId: 9, value: 7.05, weight: 42 },
      { pokemon: "Glurak", pokemonId: 6, value: 16, weight: 16 },
    ],
  }),
  buildCase({
    id: "level-30",
    name: "Level 30 Case",
    coverImage: pokemonSprite(493),
    category: "Level",
    rarity: "Mythic",
    requirement: "Level 30",
    previewIds: [382, 383, 493],
    items: [
      { pokemon: "Kyogre", pokemonId: 382, value: 7277, weight: 44 },
      { pokemon: "Groudon", pokemonId: 383, value: 7423, weight: 44 },
      { pokemon: "Arceus", pokemonId: 493, value: 15347, weight: 12 },
    ],
  }),
];
