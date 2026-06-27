import { useEffect, useMemo, useState } from "react";
import {
  createUser,
  hashPassword,
  loadAppState,
  saveAppState,
} from "../lib/appStorage.js";
import { pickWeightedDrop, prepareDrop } from "../lib/caseOpening.js";
import { isCustomCaseId } from "../lib/caseCollection.js";
import { formatCurrency } from "../lib/format.js";
import {
  getPokemonImage,
  getPokemonPriceOverrideKey,
  setPokemonPriceOverrides,
} from "../lib/pokemonCatalog.js";

export function useAppState() {
  const [state, setState] = useState(loadAppState);
  setPokemonPriceOverrides(state.customPrices);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.sessionUserId) ?? null,
    [state.sessionUserId, state.users]
  );
  const inventory = useMemo(
    () =>
      currentUser
        ? state.inventory.filter(
            (item) => !item.ownerId || item.ownerId === currentUser.id
          )
        : [],
    [currentUser, state.inventory]
  );

  const stats = useMemo(
    () => ({
      online: 1,
      registered: state.users.length,
      casesOpened: state.counters.casesOpened,
      battlesPlayed: state.counters.battlesPlayed,
    }),
    [state.counters.battlesPlayed, state.counters.casesOpened, state.users.length]
  );

  async function registerUser(formData) {
    const username = formData.username.trim();
    const password = formData.password.trim();

    if (username.length < 3) {
      return { ok: false, message: "Username braucht mindestens 3 Zeichen." };
    }

    if (password.length < 6) {
      return { ok: false, message: "Passwort braucht mindestens 6 Zeichen." };
    }

    if (
      state.users.some(
        (user) => user.username.toLowerCase() === username.toLowerCase()
      )
    ) {
      return { ok: false, message: "Dieser Username ist bereits registriert." };
    }

    const passwordHash = await hashPassword(password);
    const user = createUser({ passwordHash, username });

    setState((currentState) => ({
      ...currentState,
      users: [...currentState.users, user],
      sessionUserId: user.id,
    }));

    return { ok: true, message: "Account erstellt." };
  }

  async function loginUser(formData) {
    const username = formData.username.trim();
    const password = formData.password.trim();

    if (!username) {
      return { ok: false, message: "Username fehlt." };
    }

    if (!password) {
      return { ok: false, message: "Passwort fehlt." };
    }

    const user = state.users.find(
      (existingUser) =>
        existingUser.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return { ok: false, message: "Account nicht gefunden." };
    }

    const passwordHash = await hashPassword(password);

    if (!user.passwordHash) {
      setState((currentState) => ({
        ...currentState,
        sessionUserId: user.id,
        users: currentState.users.map((existingUser) =>
          existingUser.id === user.id
            ? {
                ...existingUser,
                passwordHash,
              }
            : existingUser
        ),
      }));

      return { ok: true, message: "Angemeldet." };
    }

    if (user.passwordHash !== passwordHash) {
      return { ok: false, message: "Passwort ist falsch." };
    }

    setState((currentState) => ({
      ...currentState,
      sessionUserId: user.id,
    }));

    return { ok: true, message: "Angemeldet." };
  }

  function logout() {
    setState((currentState) => ({
      ...currentState,
      sessionUserId: null,
    }));
  }

  function saveCase(caseItem) {
    setState((currentState) => ({
      ...currentState,
      deletedCaseIds: currentState.deletedCaseIds.filter(
        (caseId) => caseId !== caseItem.id
      ),
      caseOverrides: isCustomCaseId(caseItem.id)
        ? currentState.caseOverrides
        : {
            ...currentState.caseOverrides,
            [caseItem.id]: caseItem,
          },
      customCases: isCustomCaseId(caseItem.id)
        ? upsertCase(currentState.customCases, caseItem)
        : currentState.customCases,
    }));
  }

  function deleteCase(caseId) {
    const normalizedCaseId = String(caseId);

    setState((currentState) => {
      const nextOverrides = { ...currentState.caseOverrides };
      delete nextOverrides[normalizedCaseId];

      return {
        ...currentState,
        caseOverrides: nextOverrides,
        customCases: currentState.customCases.filter(
          (caseItem) => caseItem.id !== normalizedCaseId
        ),
        deletedCaseIds: isCustomCaseId(normalizedCaseId)
          ? currentState.deletedCaseIds
          : Array.from(
              new Set([...currentState.deletedCaseIds, normalizedCaseId])
            ),
      };
    });

    return { ok: true, message: "Kiste geloescht." };
  }

  function resetCaseOverride(caseId) {
    setState((currentState) => {
      const nextOverrides = { ...currentState.caseOverrides };
      delete nextOverrides[caseId];

      return {
        ...currentState,
        caseOverrides: nextOverrides,
      };
    });
  }

  function savePokemonPrices(priceRows) {
    const rows = Array.isArray(priceRows) ? priceRows : [];
    const sanitizedRows = rows
      .map((row) => ({
        key: getPokemonPriceOverrideKey(row.pokemonId, row.grade, row.shiny),
        value: sanitizePositiveCurrency(row.price),
      }))
      .filter((row) => row.key && Number.isFinite(row.value));

    if (!sanitizedRows.length || sanitizedRows.length !== rows.length) {
      return { ok: false, message: "Bitte nur positive Preise eingeben." };
    }

    setState((currentState) => {
      const customPrices = {
        ...currentState.customPrices,
        ...Object.fromEntries(
          sanitizedRows.map((row) => [row.key, row.value])
        ),
      };
      setPokemonPriceOverrides(customPrices);

      return {
        ...currentState,
        customPrices,
      };
    });

    return { ok: true, message: "Custom Preise gespeichert." };
  }

  function resetPokemonPricesForPokemon(pokemonId) {
    const keyPrefix = `${Number(pokemonId)}:`;

    setState((currentState) => {
      const customPrices = Object.fromEntries(
        Object.entries(currentState.customPrices ?? {}).filter(
          ([key]) => !key.startsWith(keyPrefix)
        )
      );
      setPokemonPriceOverrides(customPrices);

      return {
        ...currentState,
        customPrices,
      };
    });

    return { ok: true, message: "Preise fuer dieses Pokemon zurueckgesetzt." };
  }

  function updateUserAccount(userId, updates) {
    const targetUser = state.users.find((user) => user.id === userId);

    if (!targetUser) {
      return { ok: false, message: "Account nicht gefunden." };
    }

    setState((currentState) => ({
      ...currentState,
      users: currentState.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              balance:
                updates.balance === undefined
                  ? user.balance
                  : sanitizeCurrency(updates.balance),
              level:
                updates.level === undefined
                  ? user.level
                  : sanitizeLevel(updates.level),
              xp:
                updates.xp === undefined ? user.xp : sanitizeCurrency(updates.xp),
            }
          : user
      ),
    }));

    return { ok: true, message: "Account gespeichert." };
  }

  function grantUserBalance(userId, amount) {
    const targetUser = state.users.find((user) => user.id === userId);
    const creditAmount = Number(amount);

    if (!targetUser) {
      return { ok: false, message: "Account nicht gefunden." };
    }

    if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
      return { ok: false, message: "Bitte einen positiven Credit-Betrag eingeben." };
    }

    setState((currentState) => ({
      ...currentState,
      users: currentState.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              balance: sanitizeCurrency((user.balance ?? 0) + creditAmount),
            }
          : user
      ),
    }));

    return { ok: true, message: "Credits wurden gutgeschrieben." };
  }

  function deleteUserAccount(userId) {
    const targetUser = state.users.find((user) => user.id === userId);

    if (!targetUser) {
      return { ok: false, message: "Account nicht gefunden." };
    }

    if (targetUser.username === "hAiQ") {
      return { ok: false, message: "Der Admin-Account kann nicht geloescht werden." };
    }

    setState((currentState) => ({
      ...currentState,
      sessionUserId:
        currentState.sessionUserId === userId ? null : currentState.sessionUserId,
      users: currentState.users.filter((user) => user.id !== userId),
    }));

    return { ok: true, message: "Account geloescht." };
  }

  function openCase(caseItem) {
    const activeUser = state.users.find(
      (user) => user.id === state.sessionUserId
    );

    if (!activeUser) {
      return {
        ok: false,
        message: "Bitte melde dich an, um Kisten zu oeffnen.",
      };
    }

    if (!caseItem?.items?.length) {
      return { ok: false, message: "Diese Kiste hat keine Drops." };
    }

    const price = sanitizeCurrency(caseItem.price ?? 0);
    const balance = sanitizeCurrency(activeUser.balance ?? 0);

    if (balance < price) {
      return {
        ok: false,
        message: `Nicht genug Credits. Dir fehlen ${formatCurrency(
          price - balance
        )} Credits.`,
      };
    }

    const winningDrop = prepareDrop(pickWeightedDrop(caseItem.items), caseItem);

    if (!winningDrop) {
      return { ok: false, message: "Es konnte kein Drop gezogen werden." };
    }

    const inventoryItem = createInventoryItem({
      caseItem,
      drop: winningDrop,
      ownerId: activeUser.id,
    });
    const nextState = {
      ...state,
      counters: {
        ...state.counters,
        casesOpened: state.counters.casesOpened + 1,
      },
      inventory: [inventoryItem, ...state.inventory],
      users: state.users.map((user) =>
        user.id === activeUser.id
          ? {
              ...user,
              balance: sanitizeCurrency((user.balance ?? 0) - price),
            }
          : user
      ),
    };

    saveAppState(nextState);
    setState(nextState);

    return {
      ok: true,
      drop: winningDrop,
      item: inventoryItem,
      message: "Pokemon wurde ins Inventar gelegt.",
    };
  }

  function sellInventoryItem(itemId) {
    if (!currentUser) {
      return { ok: false, message: "Bitte melde dich an." };
    }

    const inventoryItem = state.inventory.find((item) => item.id === itemId);

    if (!inventoryItem) {
      return { ok: false, message: "Item nicht gefunden." };
    }

    if (inventoryItem.ownerId && inventoryItem.ownerId !== currentUser.id) {
      return { ok: false, message: "Dieses Item gehoert nicht zu deinem Account." };
    }

    const nextState = {
      ...state,
      inventory: state.inventory.filter((item) => item.id !== itemId),
      users: state.users.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              balance: sanitizeCurrency(
                (user.balance ?? 0) + (inventoryItem.value ?? 0)
              ),
            }
          : user
      ),
    };

    saveAppState(nextState);
    setState(nextState);

    return {
      ok: true,
      message: `${inventoryItem.pokemon} verkauft.`,
    };
  }

  return {
    caseOverrides: state.caseOverrides,
    currentUser,
    customPrices: state.customPrices,
    customCases: state.customCases,
    deletedCaseIds: state.deletedCaseIds,
    deleteUserAccount,
    deleteCase,
    grantUserBalance,
    inventory,
    loginUser,
    openCase,
    resetCaseOverride,
    resetPokemonPricesForPokemon,
    saveCase,
    savePokemonPrices,
    stats,
    registerUser,
    logout,
    updateUserAccount,
    users: state.users,
    sellInventoryItem,
  };
}

function upsertCase(cases, caseItem) {
  const existingIndex = cases.findIndex((item) => item.id === caseItem.id);
  if (existingIndex === -1) return [...cases, caseItem];

  return cases.map((item) => (item.id === caseItem.id ? caseItem : item));
}

function sanitizeCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number * 100) / 100;
}

function sanitizePositiveCurrency(value) {
  const number = Number(String(value).replace(",", "."));
  if (!Number.isFinite(number) || number <= 0) return Number.NaN;
  return Math.round(number * 100) / 100;
}

function sanitizeLevel(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) return 1;
  return Math.floor(number);
}

function createInventoryItem({ caseItem, drop, ownerId }) {
  return {
    id: crypto.randomUUID(),
    ownerId,
    caseId: caseItem.id,
    caseName: caseItem.name,
    pokemon: drop.pokemon,
    pokemonId: drop.pokemonId ?? null,
    grade: drop.grade ?? null,
    shiny: Boolean(drop.shiny),
    rarity: drop.rarity ?? drop.grade ?? caseItem.rarity,
    value: sanitizeCurrency(drop.value),
    image:
      drop.pokemonId && drop.shiny
        ? getPokemonImage(drop.pokemonId, true)
        : drop.image ?? null,
    createdAt: new Date().toISOString(),
  };
}
