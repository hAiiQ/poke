import { setPokemonPriceOverrides } from "./pokemonCatalog.js";

const STORAGE_KEY = "pokecase.appState.v1";

const defaultState = {
  users: [],
  sessionUserId: null,
  counters: {
    casesOpened: 0,
    battlesPlayed: 0,
  },
  caseOverrides: {},
  customPrices: {},
  customCases: [],
  deletedCaseIds: [],
  inventory: [],
};

export function loadAppState() {
  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);
    if (!rawState) {
      setPokemonPriceOverrides(defaultState.customPrices);
      return defaultState;
    }
    const parsedState = JSON.parse(rawState);

    const normalizedState = {
      ...defaultState,
      ...parsedState,
      users: Array.isArray(parsedState.users)
        ? parsedState.users.map(normalizeUser).filter(Boolean)
        : defaultState.users,
      counters: {
        ...defaultState.counters,
        ...parsedState.counters,
      },
      caseOverrides:
        parsedState.caseOverrides && typeof parsedState.caseOverrides === "object"
          ? parsedState.caseOverrides
          : defaultState.caseOverrides,
      customPrices: normalizeCustomPrices(parsedState.customPrices),
      customCases: Array.isArray(parsedState.customCases)
        ? parsedState.customCases
        : defaultState.customCases,
      deletedCaseIds: Array.isArray(parsedState.deletedCaseIds)
        ? parsedState.deletedCaseIds.map(String)
        : defaultState.deletedCaseIds,
      inventory: Array.isArray(parsedState.inventory)
        ? parsedState.inventory.map(normalizeInventoryItem).filter(Boolean)
        : defaultState.inventory,
    };

    setPokemonPriceOverrides(normalizedState.customPrices);
    return normalizedState;
  } catch {
    setPokemonPriceOverrides(defaultState.customPrices);
    return defaultState;
  }
}

export function saveAppState(state) {
  setPokemonPriceOverrides(state.customPrices);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createUser({ passwordHash, username }) {
  return {
    id: crypto.randomUUID(),
    username: username.trim(),
    passwordHash,
    balance: 0,
    level: 1,
    xp: 0,
    createdAt: new Date().toISOString(),
  };
}

function normalizeUser(user) {
  if (!user || !user.id || !user.username) return null;

  return {
    ...user,
    balance: toNonNegativeNumber(user.balance),
    level: Math.max(1, Math.floor(Number(user.level) || 1)),
    xp: toNonNegativeNumber(user.xp),
  };
}

function toNonNegativeNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number * 100) / 100;
}

function normalizeInventoryItem(item) {
  if (!item || !item.pokemon) return null;

  return {
    ...item,
    id: item.id ?? crypto.randomUUID(),
    ownerId: item.ownerId ?? null,
    value: toNonNegativeNumber(item.value),
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
}

function normalizeCustomPrices(customPrices) {
  if (!customPrices || typeof customPrices !== "object" || Array.isArray(customPrices)) {
    return defaultState.customPrices;
  }

  return Object.fromEntries(
    Object.entries(customPrices)
      .map(([key, value]) => [key, toNonNegativeNumber(value)])
      .filter(([key, value]) => key && Number.isFinite(value))
  );
}

export async function hashPassword(password) {
  const encodedPassword = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedPassword);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
