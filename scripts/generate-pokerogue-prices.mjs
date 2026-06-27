import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");

const POKEROGUE_BRANCH = "beta";
const POKEROGUE_RAW = `https://raw.githubusercontent.com/pagefaultgames/pokerogue/${POKEROGUE_BRANCH}`;

const SOURCES = {
  speciesIds: `${POKEROGUE_RAW}/src/enums/species-id.ts`,
  eggTiers: `${POKEROGUE_RAW}/src/data/balance/species-egg-tiers.ts`,
  starterCosts: `${POKEROGUE_RAW}/src/data/balance/starters.ts`,
  pokeApiSpecies:
    "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species.csv",
  pokeApiNames:
    "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv",
};

// Virtual economy assumptions. Keep this away from real money unless you handle legal compliance.
const CASE_PRICE = 1.0;
const TARGET_RTP = 0.85;
const JACKPOT_EV_SHARE = 0.075;
// A 25k jackpot in a 1-credit case only makes sense if the single top hit is
// extremely rare. This is roughly 1 in 392k for the absolute ceiling item.
const JACKPOT_DROP_CHANCE = 0.00000255;
const MAX_SECRET_PRICE = roundMoney(
  (CASE_PRICE * TARGET_RTP * JACKPOT_EV_SHARE) / JACKPOT_DROP_CHANCE
);

const RARITY_TIERS = [
  { name: "Common", minScore: 0, maxScore: 24, minPrice: 0.03, maxPrice: 0.35 },
  { name: "Uncommon", minScore: 24, maxScore: 42, minPrice: 0.4, maxPrice: 2 },
  { name: "Rare", minScore: 42, maxScore: 60, minPrice: 2.5, maxPrice: 12 },
  { name: "Epic", minScore: 60, maxScore: 78, minPrice: 15, maxPrice: 75 },
  { name: "Ultra Rare", minScore: 78, maxScore: 96, minPrice: 100, maxPrice: 450 },
  { name: "Legendary", minScore: 96, maxScore: 116, minPrice: 650, maxPrice: 2500 },
  { name: "Mythic", minScore: 116, maxScore: 138, minPrice: 3500, maxPrice: 9000 },
  {
    name: "Secret Rare",
    minScore: 138,
    maxScore: 205,
    minPrice: 12000,
    maxPrice: MAX_SECRET_PRICE,
  },
];

const EGG_TIER_BONUS = {
  COMMON: 0,
  RARE: 4,
  EPIC: 8,
  LEGENDARY: 12,
};

const STARTER_COST_SCORE = {
  1: 5,
  2: 14,
  3: 25,
  4: 37,
  5: 48,
  6: 63,
  7: 76,
  8: 96,
  9: 112,
  10: 132,
};

const POPULARITY_BOOSTS = new Map(
  Object.entries({
    pikachu: 7,
    raichu: 5,
    charizard: 17,
    blastoise: 8,
    venusaur: 7,
    eevee: 8,
    vaporeon: 5,
    jolteon: 5,
    flareon: 5,
    espeon: 6,
    umbreon: 9,
    sylveon: 8,
    gengar: 12,
    gyarados: 9,
    snorlax: 8,
    dragonite: 10,
    mewtwo: 13,
    mew: 13,
    lugia: 8,
    "ho-oh": 8,
    tyranitar: 10,
    gardevoir: 9,
    metagross: 10,
    salamence: 9,
    rayquaza: 17,
    lucario: 13,
    garchomp: 12,
    darkrai: 9,
    arceus: 18,
    greninja: 13,
    mimikyu: 10,
    dragapult: 10,
    zacian: 9,
    koraidon: 9,
    miraidon: 9,
    ogerpon: 9,
    terapagos: 8,
    pecharunt: 8,
    eternatus: 22,
  })
);

const CHASE_SCORE_FLOORS = new Map(
  Object.entries({
    mew: 122,
    mewtwo: 122,
    rayquaza: 145,
    arceus: 152,
    darkrai: 118,
    deoxys: 116,
    jirachi: 114,
    celebi: 112,
    marshadow: 120,
    zeraora: 118,
    pecharunt: 118,
    eternatus: 205,
  })
);

const GERMAN_LANGUAGE_ID = "6";
const SHINY_MULTIPLIER = 2.5;

const GRADES = [
  { key: "wild", label: "Wild", multiplier: 0.7 },
  { key: "trainiert", label: "Trainiert", multiplier: 0.85 },
  { key: "kampfbereit", label: "Kampfbereit", multiplier: 1 },
  { key: "elite", label: "Elite", multiplier: 1.35 },
  { key: "perfekt", label: "Perfekt", multiplier: 1.7 },
];

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      value = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""]))
  );
}

function parseSpeciesIds(text) {
  const enumMatch = text.match(/export enum SpeciesId\s*{([\s\S]*?)\n}/);
  if (!enumMatch) throw new Error("Could not find SpeciesId enum");

  const speciesIds = new Map();
  let nextId = 0;

  for (const line of enumMatch[1].split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)(?:\s*=\s*(-?\d+))?\s*,/);
    if (!match) continue;

    const [, key, explicitValue] = match;
    if (explicitValue !== undefined) {
      nextId = Number(explicitValue);
    }
    speciesIds.set(key, nextId);
    nextId += 1;
  }

  return speciesIds;
}

function parseEggTiers(text, speciesIds) {
  const tiers = new Map();
  const regex = /\[SpeciesId\.([A-Z0-9_]+)\]\s*:\s*EggTier\.([A-Z]+)/g;
  for (const match of text.matchAll(regex)) {
    const [, key, tier] = match;
    const id = speciesIds.get(key);
    if (id) tiers.set(id, tier);
  }
  return tiers;
}

function parseStarterCosts(text, speciesIds) {
  const costs = new Map();
  const sectionMatch = text.match(
    /export const speciesStarterCosts = {([\s\S]*?)\n}\s*(?:satisfies[\s\S]*?)?;/
  );
  if (!sectionMatch) throw new Error("Could not find speciesStarterCosts map");

  const regex = /\[SpeciesId\.([A-Z0-9_]+)\]\s*:\s*(\d+)/g;
  for (const match of sectionMatch[1].matchAll(regex)) {
    const [, key, cost] = match;
    const id = speciesIds.get(key);
    if (id) costs.set(id, Number(cost));
  }
  return costs;
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

function stableHash(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableUnit(text) {
  return stableHash(text) / 0xffffffff;
}

function roundMoney(value) {
  if (value < 1) return Math.round(value * 100) / 100;
  if (value < 10) return Math.round(value * 100) / 100;
  if (value < 100) return Math.round(value * 4) / 4;
  return Math.round(value);
}

function formatPrice(value) {
  return value.toFixed(2);
}

function findTierByScore(score) {
  return (
    RARITY_TIERS.find(
      (tier) => score >= tier.minScore && score < tier.maxScore
    ) ?? RARITY_TIERS[RARITY_TIERS.length - 1]
  );
}

function findTierByPrice(price) {
  return (
    RARITY_TIERS.find((tier) => price <= tier.maxPrice) ??
    RARITY_TIERS[RARITY_TIERS.length - 1]
  );
}

function priceFromScore(score, tier, slug) {
  const span = Math.max(1, tier.maxScore - tier.minScore);
  const basePosition = clamp((score - tier.minScore) / span, 0, 1);
  const positionNoise = stableUnit(`${slug}:position`) - 0.5;
  const jitterByTier = {
    Common: 0.16,
    Uncommon: 0.12,
    Rare: 0.08,
    Epic: 0.055,
    "Ultra Rare": 0.035,
    Legendary: 0.025,
    Mythic: 0.018,
    "Secret Rare": 0.012,
  };
  const position = clamp(
    basePosition + positionNoise * (jitterByTier[tier.name] ?? 0.04),
    0,
    1
  );
  const curved = Math.pow(position, 1.18);
  const range = tier.maxPrice - tier.minPrice;
  const floorSpreadByTier = {
    Common: 0.16,
    Uncommon: 0.12,
    Rare: 0.07,
    Epic: 0.04,
    "Ultra Rare": 0.025,
    Legendary: 0.015,
    Mythic: 0.01,
    "Secret Rare": 0.006,
  };
  const multiplierSpreadByTier = {
    Common: 0.34,
    Uncommon: 0.28,
    Rare: 0.18,
    Epic: 0.12,
    "Ultra Rare": 0.08,
    Legendary: 0.055,
    Mythic: 0.04,
    "Secret Rare": 0.028,
  };
  const floorSpread = floorSpreadByTier[tier.name] ?? 0.05;
  const multiplierSpread = multiplierSpreadByTier[tier.name] ?? 0.1;
  const floorNoise = stableUnit(`${slug}:floor`);
  const multiplierNoise = stableUnit(`${slug}:multiplier`) - 0.5;
  const raw =
    tier.minPrice +
    range * curved +
    range * floorSpread * floorNoise * (1 - Math.min(basePosition, 0.85));
  const variation = 1 + multiplierNoise * multiplierSpread;

  return clamp(roundMoney(raw * variation), tier.minPrice, tier.maxPrice);
}

function buildTreeHelpers(speciesById, childrenById) {
  const depthCache = new Map();
  const rootCache = new Map();
  const maxDepthCache = new Map();

  function depthOf(id) {
    if (depthCache.has(id)) return depthCache.get(id);
    const parentId = speciesById.get(id)?.evolvesFromId;
    const depth = parentId ? depthOf(parentId) + 1 : 0;
    depthCache.set(id, depth);
    return depth;
  }

  function rootOf(id) {
    if (rootCache.has(id)) return rootCache.get(id);
    const parentId = speciesById.get(id)?.evolvesFromId;
    const root = parentId ? rootOf(parentId) : id;
    rootCache.set(id, root);
    return root;
  }

  function maxDepthFrom(id) {
    if (maxDepthCache.has(id)) return maxDepthCache.get(id);
    const children = childrenById.get(id) ?? [];
    const maxDepth =
      children.length === 0
        ? depthOf(id)
        : Math.max(...children.map((childId) => maxDepthFrom(childId)));
    maxDepthCache.set(id, maxDepth);
    return maxDepth;
  }

  return { depthOf, rootOf, maxDepthFrom };
}

function scorePokemon({
  pokemon,
  rootPokemon,
  pokerogueBaseId,
  starterCosts,
  eggTiers,
  depth,
  familyMaxDepth,
  isFinalEvolution,
}) {
  const starterCost =
    starterCosts.get(pokerogueBaseId) ?? starterCosts.get(pokemon.id) ?? 1;
  const eggTier = eggTiers.get(pokerogueBaseId) ?? eggTiers.get(pokemon.id) ?? "COMMON";

  let score = STARTER_COST_SCORE[starterCost] ?? 5;
  score += EGG_TIER_BONUS[eggTier] ?? 0;
  score += depth * 7;

  if (familyMaxDepth === 0) score += 2;
  if (isFinalEvolution && familyMaxDepth > 0) score += 5;
  if (pokemon.isBaby) score -= 4;
  if (pokemon.isLegendary) score += 4;
  if (pokemon.isMythical) score += 12;

  score += POPULARITY_BOOSTS.get(pokemon.slug) ?? 0;
  if (rootPokemon && rootPokemon.id !== pokemon.id) {
    score += (POPULARITY_BOOSTS.get(rootPokemon.slug) ?? 0) * 0.35;
  }

  if (pokemon.isLegendary) score = Math.max(score, 84 + starterCost * 4);
  if (pokemon.isMythical) score = Math.max(score, 94 + starterCost * 4);
  if (CHASE_SCORE_FLOORS.has(pokemon.slug)) {
    score = Math.max(score, CHASE_SCORE_FLOORS.get(pokemon.slug));
  }
  if (starterCost === 10) score = Math.max(score, 205);
  if (starterCost >= 9 && (pokemon.isLegendary || pokemon.isMythical)) {
    score = Math.max(score, 132);
  }

  return clamp(score, 0, 205);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function toCsv(rows, columns) {
  const body = rows
    .map((row) => columns.map((column) => csvEscape(row[column])).join(","))
    .join("\n");
  return `${columns.join(",")}\n${body}\n`;
}

const [
  speciesIdText,
  eggTierText,
  starterCostText,
  pokeApiSpeciesText,
  pokeApiNamesText,
] = await Promise.all([
  fetchText(SOURCES.speciesIds),
  fetchText(SOURCES.eggTiers),
  fetchText(SOURCES.starterCosts),
  fetchText(SOURCES.pokeApiSpecies),
  fetchText(SOURCES.pokeApiNames),
]);

const speciesIds = parseSpeciesIds(speciesIdText);
const eggTiers = parseEggTiers(eggTierText, speciesIds);
const starterCosts = parseStarterCosts(starterCostText, speciesIds);
const pokeApiSpecies = parseCsv(pokeApiSpeciesText);
const pokeApiNames = parseCsv(pokeApiNamesText);

const germanNames = new Map(
  pokeApiNames
    .filter((row) => row.local_language_id === GERMAN_LANGUAGE_ID)
    .map((row) => [Number(row.pokemon_species_id), row.name])
);

const speciesById = new Map(
  pokeApiSpecies.map((row) => {
    const id = Number(row.id);
    return [
      id,
      {
        id,
        slug: row.identifier,
        name: germanNames.get(id) ?? row.identifier,
        evolvesFromId: row.evolves_from_species_id
          ? Number(row.evolves_from_species_id)
          : null,
        isBaby: row.is_baby === "1",
        isLegendary: row.is_legendary === "1",
        isMythical: row.is_mythical === "1",
      },
    ];
  })
);

const childrenById = new Map();
for (const pokemon of speciesById.values()) {
  if (!childrenById.has(pokemon.id)) childrenById.set(pokemon.id, []);
  if (pokemon.evolvesFromId) {
    if (!childrenById.has(pokemon.evolvesFromId)) {
      childrenById.set(pokemon.evolvesFromId, []);
    }
    childrenById.get(pokemon.evolvesFromId).push(pokemon.id);
  }
}

const { depthOf, rootOf, maxDepthFrom } = buildTreeHelpers(
  speciesById,
  childrenById
);

function findPokerogueBaseId(id) {
  let currentId = id;
  while (currentId) {
    if (starterCosts.has(currentId) || eggTiers.has(currentId)) {
      return currentId;
    }
    currentId = speciesById.get(currentId)?.evolvesFromId;
  }

  const rootId = rootOf(id);
  return starterCosts.has(rootId) || eggTiers.has(rootId) ? rootId : id;
}

const internalRows = [...speciesById.values()]
  .sort((a, b) => a.id - b.id)
  .map((pokemon) => {
    const rootId = rootOf(pokemon.id);
    const rootPokemon = speciesById.get(rootId);
    const pokerogueBaseId = findPokerogueBaseId(pokemon.id);
    const depth = depthOf(pokemon.id);
    const familyMaxDepth = maxDepthFrom(rootId);
    const isFinalEvolution = (childrenById.get(pokemon.id) ?? []).length === 0;
    const score = scorePokemon({
      pokemon,
      rootPokemon,
      pokerogueBaseId,
      starterCosts,
      eggTiers,
      depth,
      familyMaxDepth,
      isFinalEvolution,
    });
    const tier = findTierByScore(score);
    const price = priceFromScore(score, tier, pokemon.slug);

    return {
      id: pokemon.id,
      pokemon: pokemon.name,
      rarity: tier.name,
      price,
      _depth: depth,
      _parentId: pokemon.evolvesFromId,
    };
  });

const rowsById = new Map(internalRows.map((row) => [row.id, row]));
for (const row of internalRows.sort((a, b) => a._depth - b._depth || a.id - b.id)) {
  if (!row._parentId) continue;

  const parent = rowsById.get(row._parentId);
  if (!parent) continue;

  if (row.price <= parent.price) {
    row.price = roundMoney(parent.price * 1.14);
    const promotedTier = findTierByPrice(row.price);
    row.price = Math.max(row.price, promotedTier.minPrice);
    row.rarity = promotedTier.name;
  }
}

const outputRows = internalRows
  .sort((a, b) => a.id - b.id)
  .map((row) => ({
    id: row.id,
    pokemon: row.pokemon,
    rarity: row.rarity,
    preis: formatPrice(row.price),
  }));

function getVariantPrice(basePrice, gradeMultiplier, shiny = false) {
  const shinyMultiplier = shiny ? SHINY_MULTIPLIER : 1;
  return formatPrice(roundMoney(basePrice * gradeMultiplier * shinyMultiplier));
}

const variantWideRows = internalRows
  .sort((a, b) => a.id - b.id)
  .map((row) => {
    const result = {
      id: row.id,
      pokemon: row.pokemon,
      rarity: row.rarity,
    };

    for (const grade of GRADES) {
      result[grade.key] = getVariantPrice(row.price, grade.multiplier);
    }

    for (const grade of GRADES) {
      result[`shiny_${grade.key}`] = getVariantPrice(
        row.price,
        grade.multiplier,
        true
      );
    }

    return result;
  });

const variantLongRows = internalRows
  .sort((a, b) => a.id - b.id)
  .flatMap((row) => [
    ...GRADES.map((grade) => ({
      id: row.id,
      pokemon: row.pokemon,
      rarity: row.rarity,
      grade: grade.label,
      shiny: 0,
      preis: getVariantPrice(row.price, grade.multiplier),
    })),
    ...GRADES.map((grade) => ({
      id: row.id,
      pokemon: row.pokemon,
      rarity: row.rarity,
      grade: grade.label,
      shiny: 1,
      preis: getVariantPrice(row.price, grade.multiplier, true),
    })),
  ]);

const variantJsonRows = variantWideRows.map((row) => ({
  id: row.id,
  pokemon: row.pokemon,
  rarity: row.rarity,
  varianten: [
    ...GRADES.map((grade) => ({
      grade: grade.label,
      shiny: false,
      preis: row[grade.key],
    })),
    ...GRADES.map((grade) => ({
      grade: grade.label,
      shiny: true,
      preis: row[`shiny_${grade.key}`],
    })),
  ],
}));

const baseColumns = ["id", "pokemon", "rarity", "preis"];
const variantWideColumns = [
  "id",
  "pokemon",
  "rarity",
  ...GRADES.map((grade) => grade.key),
  ...GRADES.map((grade) => `shiny_${grade.key}`),
];
const variantLongColumns = ["id", "pokemon", "rarity", "grade", "shiny", "preis"];

await mkdir(dataDir, { recursive: true });
await Promise.all([
  writeFile(
    path.join(dataDir, "pokerogue_prices.csv"),
    toCsv(outputRows, baseColumns),
    "utf8"
  ),
  writeFile(
    path.join(dataDir, "pokerogue_prices.json"),
    `${JSON.stringify(outputRows, null, 2)}\n`,
    "utf8"
  ),
  writeFile(
    path.join(dataDir, "pokerogue_variant_prices_de.csv"),
    toCsv(variantWideRows, variantWideColumns),
    "utf8"
  ),
  writeFile(
    path.join(dataDir, "pokerogue_variant_prices_de_long.csv"),
    toCsv(variantLongRows, variantLongColumns),
    "utf8"
  ),
  writeFile(
    path.join(dataDir, "pokerogue_variant_prices_de.json"),
    `${JSON.stringify(variantJsonRows, null, 2)}\n`,
    "utf8"
  ),
]);

const summary = RARITY_TIERS.map((tier) => {
  const tierRows = outputRows.filter((row) => row.rarity === tier.name);
  const prices = tierRows.map((row) => Number(row.preis));
  return {
    rarity: tier.name,
    count: tierRows.length,
    min: prices.length ? Math.min(...prices).toFixed(2) : "-",
    max: prices.length ? Math.max(...prices).toFixed(2) : "-",
  };
});

console.table(summary);
console.log(`Generated ${outputRows.length} rows.`);
console.log(`Generated ${variantLongRows.length} fixed variant rows.`);
console.log(`Max secret price target: ${MAX_SECRET_PRICE.toFixed(2)}`);
