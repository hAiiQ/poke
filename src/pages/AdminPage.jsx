import React from "react";
import {
  Box,
  Edit3,
  Eye,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import {
  formatVariantLabel,
  getListedPokemon,
  getVariantKey,
  PokemonVariantPicker,
} from "../components/PokemonVariantPicker.jsx";
import { SectionTitle } from "../components/SectionTitle.jsx";
import { calculateExpectedCasePrice } from "../lib/casePricing.js";
import { getCaseCollection } from "../lib/caseCollection.js";
import { formatCurrency } from "../lib/format.js";
import {
  getClosestVariant,
  getPokemonById,
  getPokemonByName,
  getPokemonCatalog,
  getPokemonImage,
  getPokemonPriceOverrideKey,
  getPokemonVariant,
  getVariantName,
  POKEMON_GRADES,
} from "../lib/pokemonCatalog.js";

const REQUIRED_TOTAL_CHANCE = 100;
const MINIMUM_DROP_COUNT = 2;
const CHANCE_DECIMALS = 4;
const CHANCE_STEP = 10 ** -CHANCE_DECIMALS;
const ADMIN_USERNAME = "hAiQ";
const CASE_TYPE_OPTIONS = [
  { label: "Normale Kiste", value: "Case", icon: Box },
  { label: "Level Kiste", value: "Level", icon: Trophy },
  { label: "Community Kiste", value: "Community", icon: Users },
];
const CASE_MANAGEMENT_FILTERS = [
  { id: "all", label: "Alle" },
  { id: "normal", label: "Normal" },
  { id: "level", label: "Level" },
  { id: "community", label: "Community" },
  { id: "standard", label: "Standard" },
  { id: "custom", label: "Custom" },
];

function createDropRow(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    pokemonId: 1,
    grade: "Wild",
    shiny: false,
    chance: "",
    ...overrides,
  };
}

export function AdminPage({
  caseOverrides,
  currentUser,
  customPrices = {},
  customCases,
  deletedCaseIds = [],
  onDeleteCase,
  onDeleteUser,
  onGrantBalance,
  onResetCase,
  onResetPokemonPricesForPokemon,
  onSaveCase,
  onSavePokemonPrices,
  onUpdateUser,
  users = [],
}) {
  const editableCases = React.useMemo(
    () => getCaseCollection({ caseOverrides, customCases, deletedCaseIds }),
    [caseOverrides, customCases, deletedCaseIds]
  );
  const sortedUsers = React.useMemo(
    () =>
      [...users].sort((firstUser, secondUser) => {
        if (firstUser.username === ADMIN_USERNAME) return -1;
        if (secondUser.username === ADMIN_USERNAME) return 1;
        return firstUser.username.localeCompare(secondUser.username, "de");
      }),
    [users]
  );
  const [editingCaseId, setEditingCaseId] = React.useState(null);
  const [activeAdminSection, setActiveAdminSection] = React.useState("cases");
  const [activeCaseManageCategory, setActiveCaseManageCategory] =
    React.useState("all");
  const [caseName, setCaseName] = React.useState("");
  const [caseCategory, setCaseCategory] = React.useState("Case");
  const [coverImage, setCoverImage] = React.useState("");
  const [dropRows, setDropRows] = React.useState([]);
  const [pendingPokemon, setPendingPokemon] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [exactPrice, setExactPrice] = React.useState("");
  const [priceSort, setPriceSort] = React.useState("default");
  const [pricePokemonId, setPricePokemonId] = React.useState(1);
  const [priceSearchTerm, setPriceSearchTerm] = React.useState("");
  const [priceMinPrice, setPriceMinPrice] = React.useState("");
  const [priceMaxPrice, setPriceMaxPrice] = React.useState("");
  const [priceExactPrice, setPriceExactPrice] = React.useState("");
  const [priceManagerSort, setPriceManagerSort] = React.useState("default");
  const [priceDrafts, setPriceDrafts] = React.useState({});
  const [priceMessage, setPriceMessage] = React.useState(null);
  const [message, setMessage] = React.useState(null);
  const [accountDrafts, setAccountDrafts] = React.useState({});
  const [accountMessage, setAccountMessage] = React.useState(null);
  const editingCase =
    editableCases.find((caseItem) => caseItem.id === editingCaseId) ?? null;
  const caseManagementCounts = React.useMemo(
    () => getCaseManagementCounts(editableCases),
    [editableCases]
  );
  const managedCases = React.useMemo(
    () =>
      editableCases.filter((caseItem) =>
        matchesCaseManagementCategory(caseItem, activeCaseManageCategory)
      ),
    [activeCaseManageCategory, editableCases]
  );
  const listedPokemon = React.useMemo(
    () =>
      getListedPokemon({
        exactPrice,
        maxPrice,
        minPrice,
        priceSort,
        searchTerm,
      }),
    [exactPrice, maxPrice, minPrice, priceSort, searchTerm]
  );
  const listedPricePokemon = React.useMemo(
    () =>
      getListedPokemon({
        exactPrice: priceExactPrice,
        maxPrice: priceMaxPrice,
        minPrice: priceMinPrice,
        priceSort: priceManagerSort,
        searchTerm: priceSearchTerm,
      }),
    [
      priceExactPrice,
      priceManagerSort,
      priceMaxPrice,
      priceMinPrice,
      priceSearchTerm,
    ]
  );
  const selectedPricePokemon =
    getPokemonById(pricePokemonId) ??
    listedPricePokemon[0] ??
    getPokemonCatalog()[0] ??
    null;

  const preparedDrops = React.useMemo(
    () =>
      dropRows
        .map((row) => {
          const pokemon = getPokemonById(row.pokemonId);
          const variant = getPokemonVariant(row.pokemonId, row.grade, row.shiny);
          const chance = Number(row.chance);

          if (!pokemon || !variant || !Number.isFinite(chance) || chance <= 0) {
            return null;
          }

          return {
            id: row.id,
            pokemon: getVariantName({
              pokemon: pokemon.name,
              grade: row.grade,
              shiny: row.shiny,
            }),
            pokemonId: pokemon.id,
            grade: row.grade,
            image: getPokemonImage(pokemon.id, row.shiny),
            rarity: pokemon.rarity,
            shiny: row.shiny,
            value: variant.price,
            chance,
            weight: chance,
          };
        })
        .filter(Boolean),
    [dropRows]
  );

  const totalChance = preparedDrops.reduce(
    (sum, drop) => sum + Number(drop.chance),
    0
  );
  const roundedTotalChance = roundToChanceDecimals(totalChance);
  const chanceReady = roundedTotalChance === REQUIRED_TOTAL_CHANCE;
  const dropCountReady = preparedDrops.length >= MINIMUM_DROP_COUNT;
  const hasDuplicateDrops = hasDuplicateVariants(dropRows);
  const previewPrice = calculateExpectedCasePrice(preparedDrops, 0.1);
  const selectedVariantKeys = React.useMemo(
    () => new Set(dropRows.map(getDropVariantKey)),
    [dropRows]
  );

  React.useEffect(() => {
    if (!selectedPricePokemon) return;

    setPriceDrafts(getPriceDraftsFromPokemon(selectedPricePokemon));
    setPriceMessage(null);
  }, [customPrices, selectedPricePokemon?.id]);

  function updateDropRow(rowId, patch) {
    const currentRow = dropRows.find((row) => row.id === rowId);
    const changesVariant =
      Object.hasOwn(patch, "pokemonId") ||
      Object.hasOwn(patch, "grade") ||
      Object.hasOwn(patch, "shiny");

    if (currentRow && changesVariant) {
      const nextRow = { ...currentRow, ...patch };
      const nextVariantKey = getDropVariantKey(nextRow);
      const duplicatesAnotherRow = dropRows.some(
        (row) => row.id !== rowId && getDropVariantKey(row) === nextVariantKey
      );

      if (duplicatesAnotherRow) {
        setMessage({
          status: "error",
          text: "Diese Pokemon-Variante ist schon in der Kiste.",
        });
        return;
      }
    }

    setDropRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...patch,
            }
          : row
      )
    );

    if (changesVariant) {
      setMessage(null);
    }
  }

  function selectPokemon(pokemon) {
    setPendingPokemon(pokemon);
    setMessage(null);
  }

  function addPokemonWithVariant({ grade, shiny }) {
    if (!pendingPokemon) return;

    const variantKey = getVariantKey(pendingPokemon.id, grade, shiny);

    if (selectedVariantKeys.has(variantKey)) {
      setMessage({
        status: "error",
        text: "Diese Pokemon-Variante ist schon in der Kiste.",
      });
      return;
    }

    setDropRows((currentRows) => [
      ...currentRows,
      createDropRow({
        pokemonId: pendingPokemon.id,
        grade,
        shiny,
      }),
    ]);
    setPendingPokemon(null);
    setMessage(null);
  }

  function updateDropChance(rowId, value) {
    updateDropRow(rowId, { chance: sanitizeChanceInput(value) });
  }

  function fillRemainingChance(rowId) {
    const otherChance = dropRows.reduce((sum, row) => {
      if (row.id === rowId) return sum;
      return sum + getChanceNumber(row.chance);
    }, 0);
    const remainingChance = Math.max(
      0,
      REQUIRED_TOTAL_CHANCE - otherChance
    );

    updateDropRow(rowId, {
      chance: formatChanceInputValue(remainingChance),
    });
    setMessage(null);
  }

  function removeDropRow(rowId) {
    setDropRows((currentRows) =>
      currentRows.filter((row) => row.id !== rowId)
    );
  }

  function startNewCase() {
    setEditingCaseId(null);
    setCaseName("");
    setCaseCategory("Case");
    setCoverImage("");
    setDropRows([]);
    setPendingPokemon(null);
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setExactPrice("");
    setPriceSort("default");
    setMessage(null);
  }

  function editCase(caseItem) {
    setEditingCaseId(caseItem.id);
    setCaseName(caseItem.name);
    setCaseCategory(getCaseEditorCategory(caseItem.category));
    setCoverImage(caseItem.coverImage ?? "");
    setDropRows(caseItem.items.map(caseItemToDropRow));
    setPendingPokemon(null);
    setMessage(null);
  }

  function handleResetCase(caseItem) {
    onResetCase(caseItem.id);
    if (editingCaseId === caseItem.id) {
      editCase(caseItem.originalCase);
    }
    setMessage({ status: "success", text: "Standard-Kiste zurueckgesetzt." });
  }

  function handleDeleteCase(caseItem) {
    const result = onDeleteCase(caseItem.id);

    if (editingCaseId === caseItem.id) {
      startNewCase();
    }

    setMessage({
      status: result?.ok === false ? "error" : "success",
      text: result?.message ?? "Kiste geloescht.",
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const name = caseName.trim();

    if (name.length < 3) {
      setMessage({
        status: "error",
        text: "Case Name braucht mindestens 3 Zeichen.",
      });
      return;
    }

    if (!dropCountReady) {
      setMessage({
        status: "error",
        text: `Mindestens ${MINIMUM_DROP_COUNT} Drops brauchen eine Chance.`,
      });
      return;
    }

    if (hasDuplicateDrops) {
      setMessage({
        status: "error",
        text: "Jede Pokemon-, Form- und Shiny-Kombination darf nur einmal vorkommen.",
      });
      return;
    }

    if (!chanceReady) {
      setMessage({
        status: "error",
        text: "Die Dropchancen muessen zusammen genau 100,00% ergeben.",
      });
      return;
    }

    const firstDrop = preparedDrops[0];
    const caseItem = {
      id: editingCase?.id ?? `custom-${crypto.randomUUID()}`,
      name,
      category: caseCategory,
      rarity: editingCase?.rarity ?? "Custom",
      requirement: getCaseRequirement(caseCategory, editingCase, currentUser),
      price: previewPrice,
      coverImage: coverImage.trim() || firstDrop.image || getPokemonImage(firstDrop.pokemonId),
      previewIds: preparedDrops.slice(0, 3).map((drop) => drop.pokemonId),
      previewSprites: preparedDrops
        .slice(0, 3)
        .map((drop) => drop.image ?? getPokemonImage(drop.pokemonId)),
      items: preparedDrops,
    };

    onSaveCase(caseItem);
    if (!editingCase) {
      startNewCase();
    }
    setMessage({ status: "success", text: "Case gespeichert." });
  }

  function getAccountDraft(user, field) {
    const draftValue = accountDrafts[user.id]?.[field];
    if (draftValue !== undefined) return draftValue;
    if (field === "grant") return "";
    if (field === "level") return String(user.level ?? 1);
    return String(user[field] ?? 0);
  }

  function updateAccountDraft(userId, patch) {
    setAccountDrafts((currentDrafts) => ({
      ...currentDrafts,
      [userId]: {
        ...currentDrafts[userId],
        ...patch,
      },
    }));
  }

  function clearAccountDraft(userId, fields) {
    setAccountDrafts((currentDrafts) => {
      const nextUserDraft = { ...currentDrafts[userId] };

      fields.forEach((field) => {
        delete nextUserDraft[field];
      });

      return {
        ...currentDrafts,
        [userId]: nextUserDraft,
      };
    });
  }

  function handleSaveAccount(user) {
    const result = onUpdateUser(user.id, {
      balance: getAccountDraft(user, "balance"),
      level: getAccountDraft(user, "level"),
      xp: getAccountDraft(user, "xp"),
    });

    setAccountMessage({
      status: result.ok ? "success" : "error",
      text: result.message,
    });
    clearAccountDraft(user.id, ["balance", "level", "xp"]);
  }

  function handleGrantBalance(user) {
    const result = onGrantBalance(user.id, getAccountDraft(user, "grant"));

    setAccountMessage({
      status: result.ok ? "success" : "error",
      text: result.message,
    });

    if (result.ok) {
      clearAccountDraft(user.id, ["grant"]);
    }
  }

  function handleDeleteUser(user) {
    const result = onDeleteUser(user.id);

    setAccountMessage({
      status: result.ok ? "success" : "error",
      text: result.message,
    });
  }

  function selectPricePokemon(pokemon) {
    setPricePokemonId(pokemon.id);
    setPriceMessage(null);
  }

  function updatePriceDraft(variantKey, value) {
    setPriceDrafts((currentDrafts) => ({
      ...currentDrafts,
      [variantKey]: sanitizePriceDraftInput(value),
    }));
  }

  function handleSavePokemonPrices() {
    if (!selectedPricePokemon) return;

    const priceRows = getPokemonPriceRows(selectedPricePokemon).map((row) => ({
      pokemonId: selectedPricePokemon.id,
      grade: row.grade,
      shiny: row.shiny,
      price: priceDrafts[row.key] ?? row.price,
    }));
    const hasInvalidPrice = priceRows.some(
      (row) => !isPositivePrice(row.price)
    );

    if (hasInvalidPrice) {
      setPriceMessage({
        status: "error",
        text: "Bitte fuer jede Variante einen positiven Preis eingeben.",
      });
      return;
    }

    const result = onSavePokemonPrices(priceRows);
    setPriceMessage({
      status: result.ok ? "success" : "error",
      text: result.message,
    });
  }

  function handleResetPokemonPrices() {
    if (!selectedPricePokemon) return;

    const result = onResetPokemonPricesForPokemon(selectedPricePokemon.id);
    setPriceDrafts(getPriceDraftsFromPokemon(getPokemonById(selectedPricePokemon.id)));
    setPriceMessage({
      status: result.ok ? "success" : "error",
      text: result.message,
    });
  }

  return (
    <section className="page-section page-section--single">
      <SectionTitle title="Admin" />

      <div className="admin-mode-tabs" role="tablist" aria-label="Admin Bereiche">
        <button
          aria-selected={activeAdminSection === "cases"}
          className="tab-button"
          data-active={activeAdminSection === "cases" ? "true" : "false"}
          onClick={() => setActiveAdminSection("cases")}
          role="tab"
          type="button"
        >
          Kisten
        </button>
        <button
          aria-selected={activeAdminSection === "users"}
          className="tab-button"
          data-active={activeAdminSection === "users" ? "true" : "false"}
          onClick={() => setActiveAdminSection("users")}
          role="tab"
          type="button"
        >
          User Management
        </button>
        <button
          aria-selected={activeAdminSection === "prices"}
          className="tab-button"
          data-active={activeAdminSection === "prices" ? "true" : "false"}
          onClick={() => setActiveAdminSection("prices")}
          role="tab"
          type="button"
        >
          Preise
        </button>
      </div>

      {activeAdminSection === "cases" ? (
      <div className="admin-layout">
        <form className="admin-panel" onSubmit={handleSubmit}>
          <div className="admin-panel__head">
            <div>
              <h3>{editingCase ? "Kiste bearbeiten" : "Neue Kiste"}</h3>
              {editingCase ? (
                <span>{editingCase.isCustom ? "Eigene Kiste" : "Standard-Kiste"}</span>
              ) : null}
            </div>
            <strong>{formatCurrency(previewPrice)} Credits</strong>
          </div>

          <label className="field-label">
            Case Name
            <input
              className="text-input"
              onChange={(event) => setCaseName(event.target.value)}
              placeholder="z.B. Starter Mix"
              type="text"
              value={caseName}
            />
          </label>

          <div className="field-label">
            Kistentyp
            <div className="case-type-toggle" role="radiogroup" aria-label="Kistentyp">
              {CASE_TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = caseCategory === option.value;

                return (
                  <button
                    aria-checked={isActive}
                    className="case-type-option"
                    data-active={isActive ? "true" : "false"}
                    key={option.value}
                    onClick={() => setCaseCategory(option.value)}
                    role="radio"
                    type="button"
                  >
                    <Icon aria-hidden="true" size={17} strokeWidth={2} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="field-label">
            Cover Link
            <input
              className="text-input"
              onChange={(event) => setCoverImage(event.target.value)}
              placeholder="https://..."
              type="url"
              value={coverImage}
            />
          </label>

          <div className="admin-panel__head">
            <h3>Drops</h3>
          </div>

          <div className="community-drop-layout admin-drop-layout">
            <section
              className="community-pokemon-panel"
              aria-label="Pokemon suchen"
            >
              <div className="community-filter-bar">
                <label className="input-shell community-search-shell">
                  <Search aria-hidden="true" size={17} strokeWidth={2} />
                  <input
                    aria-label="Pokemon suchen"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Pokemon suchen"
                    type="search"
                    value={searchTerm}
                  />
                </label>

                <div className="community-price-filter">
                  <label>
                    Min
                    <input
                      className="text-input"
                      inputMode="decimal"
                      onChange={(event) => setMinPrice(event.target.value)}
                      placeholder="0"
                      type="text"
                      value={minPrice}
                    />
                  </label>
                  <label>
                    Max
                    <input
                      className="text-input"
                      inputMode="decimal"
                      onChange={(event) => setMaxPrice(event.target.value)}
                      placeholder="9999"
                      type="text"
                      value={maxPrice}
                    />
                  </label>
                  <label>
                    Exakt
                    <input
                      className="text-input"
                      inputMode="decimal"
                      onChange={(event) => setExactPrice(event.target.value)}
                      placeholder="0,30"
                      type="text"
                      value={exactPrice}
                    />
                  </label>
                  <label>
                    Sortierung
                    <select
                      className="select-input"
                      onChange={(event) => setPriceSort(event.target.value)}
                      value={priceSort}
                    >
                      <option value="default">Pokedex</option>
                      <option value="price-asc">Preis niedrig</option>
                      <option value="price-desc">Preis hoch</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="community-pokemon-list">
                {listedPokemon.map((pokemon) => (
                  <button
                    className="community-pokemon-row"
                    data-active={
                      pendingPokemon?.id === pokemon.id ? "true" : "false"
                    }
                    key={pokemon.id}
                    onClick={() => selectPokemon(pokemon)}
                    type="button"
                  >
                    <img alt="" loading="lazy" src={pokemon.image} />
                    <span>
                      <strong>{pokemon.name}</strong>
                    </span>
                    <b>{formatPriceRange(pokemon.priceRange)}</b>
                    <Plus aria-hidden="true" size={17} strokeWidth={2.2} />
                  </button>
                ))}
              </div>
            </section>

            <aside className="community-odds-panel" aria-label="Dropchancen">
              <div className="community-odds-panel__head">
                <div>
                  <span>Auswahl</span>
                  <strong>{dropRows.length} Pokemon</strong>
                </div>
                <b>{formatChance(roundedTotalChance)}</b>
              </div>

              {pendingPokemon ? (
                <div className="community-pending-choice">
                  <div className="community-pending-choice__head">
                    <img alt="" src={pendingPokemon.image} />
                    <div>
                      <span>Preis waehlen</span>
                      <strong>{pendingPokemon.name}</strong>
                    </div>
                  </div>
                  <PokemonVariantPicker
                    disabledVariantKeys={selectedVariantKeys}
                    pokemon={pendingPokemon}
                    onSelect={addPokemonWithVariant}
                  />
                </div>
              ) : null}

              <div className="community-selected-drops">
                {dropRows.length ? (
                  dropRows.map((row, index) => {
                    const pokemon = getPokemonById(row.pokemonId);
                    const variant = getPokemonVariant(
                      row.pokemonId,
                      row.grade,
                      row.shiny
                    );
                    const image = getPokemonImage(row.pokemonId, row.shiny);
                    const isLastDrop = index === dropRows.length - 1;

                    return (
                      <article className="community-selected-drop" key={row.id}>
                        <div className="community-chance-control">
                          <label>
                            <span>Chance %</span>
                            <input
                              className="text-input"
                              inputMode="decimal"
                              max="100"
                              min="0"
                              onChange={(event) =>
                                updateDropChance(row.id, event.target.value)
                              }
                              placeholder="0.0000"
                              step={CHANCE_STEP}
                              type="number"
                              value={row.chance}
                            />
                          </label>
                          {isLastDrop ? (
                            <button
                              className="community-fill-chance-button"
                              onClick={() => fillRemainingChance(row.id)}
                              type="button"
                            >
                              Rest
                            </button>
                          ) : null}
                        </div>
                        <img alt="" src={image} />
                        <div className="community-selected-drop__main">
                          <strong>{pokemon?.name ?? "Pokemon"}</strong>
                          <small>
                            {formatVariantLabel(row.grade, row.shiny)}
                          </small>
                          <span>
                            {formatCurrency(variant?.price ?? 0)} Credits
                          </span>
                        </div>
                        <button
                          aria-label={`${pokemon?.name ?? "Pokemon"} entfernen`}
                          className="icon-button"
                          onClick={() => removeDropRow(row.id)}
                          type="button"
                        >
                          <Trash2
                            aria-hidden="true"
                            size={17}
                            strokeWidth={2}
                          />
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    Noch keine Pokemon ausgewaehlt.
                  </div>
                )}
              </div>

              <div className="chance-summary" data-ready={chanceReady}>
                <span>Gesamtchance</span>
                <strong>{formatChance(roundedTotalChance)}</strong>
              </div>

              <div className="chance-summary" data-ready={dropCountReady}>
                <span>Pokemon</span>
                <strong>
                  {Math.min(preparedDrops.length, MINIMUM_DROP_COUNT)}/
                  {MINIMUM_DROP_COUNT}
                </strong>
              </div>
            </aside>
          </div>

          {message ? (
            <p className="form-message" data-status={message.status}>
              {message.text}
            </p>
          ) : null}

          <div className="admin-form-actions">
            <button
              className="primary-button primary-button--full"
              disabled={!chanceReady || !dropCountReady || hasDuplicateDrops}
              type="submit"
            >
              <Save aria-hidden="true" size={18} strokeWidth={2} />
              Speichern
            </button>
            <button className="secondary-button" onClick={startNewCase} type="button">
              <Plus aria-hidden="true" size={17} strokeWidth={2} />
              Neue Kiste
            </button>
          </div>
        </form>

        <aside className="admin-panel admin-panel--side">
          <div className="admin-panel__head">
            <div>
              <h3>Kisten verwalten</h3>
              <span>Kategorie waehlen und direkt bearbeiten.</span>
            </div>
            <strong>{managedCases.length}</strong>
          </div>

          <div
            className="case-manage-categories"
            role="tablist"
            aria-label="Kisten Kategorien"
          >
            {CASE_MANAGEMENT_FILTERS.map((filter) => {
              const isActive = activeCaseManageCategory === filter.id;

              return (
                <button
                  aria-selected={isActive}
                  className="case-manage-category"
                  data-active={isActive ? "true" : "false"}
                  key={filter.id}
                  onClick={() => setActiveCaseManageCategory(filter.id)}
                  role="tab"
                  type="button"
                >
                  <span>{filter.label}</span>
                  <b>{caseManagementCounts[filter.id] ?? 0}</b>
                </button>
              );
            })}
          </div>

          <div className="custom-case-list">
            {managedCases.length ? (
              managedCases.map((caseItem) => (
                <div
                  className="case-manage-item"
                  data-active={editingCaseId === caseItem.id ? "true" : "false"}
                  key={caseItem.id}
                >
                  <div className="case-manage-item__body">
                    <strong>{caseItem.name}</strong>
                    <span>{formatCurrency(caseItem.price)} Credits</span>
                    <small>
                      {getCaseTypeLabel(caseItem.category)} |{" "}
                      {getCaseOriginLabel(caseItem)} |{" "}
                      {(caseItem.items ?? []).length} Drops
                    </small>
                  </div>

                  <div className="case-manage-actions">
                    <button
                      aria-label={`${caseItem.name} bearbeiten`}
                      className="icon-button"
                      onClick={() => editCase(caseItem)}
                      type="button"
                    >
                      <Edit3 aria-hidden="true" size={17} strokeWidth={2} />
                    </button>
                    <a
                      aria-label={`${caseItem.name} anzeigen`}
                      className="icon-button"
                      href={`#case/${caseItem.id}`}
                    >
                      <Eye aria-hidden="true" size={17} strokeWidth={2} />
                    </a>
                    {!caseItem.isCustom && caseItem.isEdited ? (
                      <button
                        aria-label={`${caseItem.name} zuruecksetzen`}
                        className="icon-button"
                        onClick={() => handleResetCase(caseItem)}
                        type="button"
                      >
                        <RotateCcw aria-hidden="true" size={17} strokeWidth={2} />
                      </button>
                    ) : null}
                    <button
                      aria-label={`${caseItem.name} loeschen`}
                      className="icon-button"
                      onClick={() => handleDeleteCase(caseItem)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={17} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                In dieser Kategorie gibt es noch keine Kisten.
              </div>
            )}
          </div>
        </aside>
      </div>
      ) : null}

      {activeAdminSection === "prices" ? (
        <section className="admin-panel admin-price-manager" aria-label="Custom Preise verwalten">
          <div className="admin-panel__head">
            <div>
              <h3>Custom Preise</h3>
              <span>Admin-Preise fuer einzelne Pokemon-Varianten ueberschreiben.</span>
            </div>
            <strong>{Object.keys(customPrices ?? {}).length}</strong>
          </div>

          <div className="admin-price-layout">
            <section className="community-pokemon-panel" aria-label="Pokemon fuer Preise suchen">
              <div className="community-filter-bar">
                <label className="input-shell community-search-shell">
                  <Search aria-hidden="true" size={17} strokeWidth={2} />
                  <input
                    aria-label="Pokemon suchen"
                    onChange={(event) => setPriceSearchTerm(event.target.value)}
                    placeholder="Pokemon suchen"
                    type="search"
                    value={priceSearchTerm}
                  />
                </label>

                <div className="community-price-filter">
                  <label>
                    Min
                    <input
                      className="text-input"
                      inputMode="decimal"
                      onChange={(event) => setPriceMinPrice(event.target.value)}
                      placeholder="0"
                      type="text"
                      value={priceMinPrice}
                    />
                  </label>
                  <label>
                    Max
                    <input
                      className="text-input"
                      inputMode="decimal"
                      onChange={(event) => setPriceMaxPrice(event.target.value)}
                      placeholder="9999"
                      type="text"
                      value={priceMaxPrice}
                    />
                  </label>
                  <label>
                    Exakt
                    <input
                      className="text-input"
                      inputMode="decimal"
                      onChange={(event) => setPriceExactPrice(event.target.value)}
                      placeholder="0,30"
                      type="text"
                      value={priceExactPrice}
                    />
                  </label>
                  <label>
                    Sortierung
                    <select
                      className="select-input"
                      onChange={(event) => setPriceManagerSort(event.target.value)}
                      value={priceManagerSort}
                    >
                      <option value="default">Pokedex</option>
                      <option value="price-asc">Preis niedrig</option>
                      <option value="price-desc">Preis hoch</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="community-pokemon-list">
                {listedPricePokemon.map((pokemon) => (
                  <button
                    className="community-pokemon-row"
                    data-active={
                      selectedPricePokemon?.id === pokemon.id ? "true" : "false"
                    }
                    key={pokemon.id}
                    onClick={() => selectPricePokemon(pokemon)}
                    type="button"
                  >
                    <img alt="" loading="lazy" src={pokemon.image} />
                    <span>
                      <strong>{pokemon.name}</strong>
                    </span>
                    <b>{formatPriceRange(pokemon.priceRange)}</b>
                    <Plus aria-hidden="true" size={17} strokeWidth={2.2} />
                  </button>
                ))}
              </div>
            </section>

            <aside className="admin-price-editor" aria-label="Variantenpreise bearbeiten">
              {selectedPricePokemon ? (
                <>
                  <div className="admin-price-editor__head">
                    <img alt="" src={selectedPricePokemon.image} />
                    <div>
                      <span>Preis Editor</span>
                      <strong>{selectedPricePokemon.name}</strong>
                    </div>
                    <div className="admin-price-editor__actions">
                      <button
                        className="primary-button"
                        onClick={handleSavePokemonPrices}
                        type="button"
                      >
                        <Save aria-hidden="true" size={18} strokeWidth={2} />
                        Speichern
                      </button>
                      <button
                        className="secondary-button"
                        onClick={handleResetPokemonPrices}
                        type="button"
                      >
                        <RotateCcw aria-hidden="true" size={17} strokeWidth={2} />
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="admin-price-grid">
                    <div className="admin-price-grid__head" aria-hidden="true">
                      <span>Form</span>
                      <span>Normal</span>
                      <span>Shiny</span>
                    </div>

                    {POKEMON_GRADES.map((grade) => (
                      <div className="admin-price-row" key={grade}>
                        <strong>{grade}</strong>
                        {[false, true].map((shiny) => {
                          const key = getPokemonPriceOverrideKey(
                            selectedPricePokemon.id,
                            grade,
                            shiny
                          );
                          const variant = getPokemonVariant(
                            selectedPricePokemon.id,
                            grade,
                            shiny
                          );

                          return (
                            <label
                              className="admin-price-input"
                              data-custom={variant?.hasCustomPrice ? "true" : "false"}
                              key={key}
                            >
                              <input
                                className="text-input"
                                inputMode="decimal"
                                min="0.01"
                                onChange={(event) =>
                                  updatePriceDraft(key, event.target.value)
                                }
                                step="0.01"
                                type="number"
                                value={priceDrafts[key] ?? ""}
                              />
                              <small>
                                Basis {formatCurrency(variant?.basePrice ?? 0)}
                              </small>
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {priceMessage ? (
                    <p className="form-message" data-status={priceMessage.status}>
                      {priceMessage.text}
                    </p>
                  ) : null}

                </>
              ) : (
                <div className="empty-state">Waehle ein Pokemon aus.</div>
              )}
            </aside>
          </div>
        </section>
      ) : null}

      {activeAdminSection === "users" ? (
      <section className="admin-panel admin-accounts" aria-label="Accounts verwalten">
        <div className="admin-panel__head">
          <div>
            <h3>Accounts verwalten</h3>
            <span>Nur {ADMIN_USERNAME} hat Zugriff auf diese Seite.</span>
          </div>
          <strong>{users.length}</strong>
        </div>

        {accountMessage ? (
          <p className="form-message" data-status={accountMessage.status}>
            {accountMessage.text}
          </p>
        ) : null}

        <div className="account-admin-list">
          {sortedUsers.length ? (
            sortedUsers.map((user) => {
              const isProtectedAdmin = user.username === ADMIN_USERNAME;

              return (
                <article
                  className="account-admin-card"
                  data-user-id={user.id}
                  data-username={user.username}
                  key={user.id}
                >
                  <div className="account-admin-card__identity">
                    <strong>{user.username}</strong>
                    <small>
                      Level {user.level ?? 1} | {user.xp ?? 0} XP |{" "}
                      {formatCurrency(user.balance ?? 0)} Credits
                    </small>
                  </div>

                  <div className="account-admin-fields">
                    <label className="field-label">
                      Credits
                      <input
                        className="text-input"
                        data-account-field="balance"
                        min="0"
                        onChange={(event) =>
                          updateAccountDraft(user.id, {
                            balance: event.target.value,
                          })
                        }
                        step="0.01"
                        type="number"
                        value={getAccountDraft(user, "balance")}
                      />
                    </label>

                    <label className="field-label">
                      Level
                      <input
                        className="text-input"
                        data-account-field="level"
                        min="1"
                        onChange={(event) =>
                          updateAccountDraft(user.id, { level: event.target.value })
                        }
                        step="1"
                        type="number"
                        value={getAccountDraft(user, "level")}
                      />
                    </label>

                    <label className="field-label">
                      XP
                      <input
                        className="text-input"
                        data-account-field="xp"
                        min="0"
                        onChange={(event) =>
                          updateAccountDraft(user.id, { xp: event.target.value })
                        }
                        step="1"
                        type="number"
                        value={getAccountDraft(user, "xp")}
                      />
                    </label>

                    <label className="field-label">
                      Credits geben
                      <input
                        className="text-input"
                        data-account-field="grant"
                        min="0.01"
                        onChange={(event) =>
                          updateAccountDraft(user.id, { grant: event.target.value })
                        }
                        placeholder="0.00"
                        step="0.01"
                        type="number"
                        value={getAccountDraft(user, "grant")}
                      />
                    </label>
                  </div>

                  <div className="account-admin-actions">
                    <button
                      className="secondary-button"
                      data-account-action="grant"
                      onClick={() => handleGrantBalance(user)}
                      type="button"
                    >
                      <Plus aria-hidden="true" size={17} strokeWidth={2} />
                      Geben
                    </button>
                    <button
                      className="secondary-button"
                      data-account-action="save"
                      onClick={() => handleSaveAccount(user)}
                      type="button"
                    >
                      <Save aria-hidden="true" size={17} strokeWidth={2} />
                      Speichern
                    </button>
                    <button
                      aria-label={`${user.username} loeschen`}
                      className="icon-button"
                      data-account-action="delete"
                      disabled={isProtectedAdmin}
                      onClick={() => handleDeleteUser(user)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={17} strokeWidth={2} />
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state">Noch keine Accounts vorhanden.</div>
          )}
        </div>
      </section>
      ) : null}
    </section>
  );
}

function caseItemToDropRow(item) {
  const pokemon = resolvePokemon(item);
  const variant =
    item.grade && typeof item.shiny === "boolean"
      ? getPokemonVariant(pokemon?.id, item.grade, item.shiny)
      : getClosestVariant(pokemon, item.value);

  return {
    id: crypto.randomUUID(),
    pokemonId: pokemon?.id ?? 1,
    grade: variant?.grade ?? "Kampfbereit",
    shiny: variant?.shiny ?? false,
    chance: formatChanceInput(item.chance ?? item.weight ?? 0),
  };
}

function resolvePokemon(item) {
  if (item.pokemonId) return getPokemonById(item.pokemonId);

  const pokemonName = String(item.pokemon)
    .replace(/^Shiny\s+/i, "")
    .split(" - ")[0]
    .trim();

  return getPokemonByName(pokemonName) ?? getPokemonById(1);
}

function getCaseEditorCategory(category) {
  if (category === "Level") return "Level";
  if (category === "Community" || category === "Community Kiste") {
    return "Community";
  }
  return "Case";
}

function getCaseRequirement(category, editingCase, currentUser) {
  if (category === "Level") {
    return editingCase?.category === "Level"
      ? editingCase.requirement ?? "Level"
      : "Level";
  }

  if (category === "Community") {
    return (
      editingCase?.requirement ??
      `Von ${currentUser?.username ?? ADMIN_USERNAME}`
    );
  }

  return editingCase?.category === "Level" ? "Offen" : editingCase?.requirement ?? "Offen";
}

function getCaseTypeLabel(category) {
  if (category === "Community" || category === "Community Kiste") {
    return "Community Kiste";
  }
  return category === "Level" ? "Level Kiste" : "Normale Kiste";
}

function getCaseOriginLabel(caseItem) {
  if (caseItem.isCustom) return "Custom";
  return caseItem.isEdited ? "Standard bearbeitet" : "Standard";
}

function getCaseManagementCounts(cases) {
  return CASE_MANAGEMENT_FILTERS.reduce((counts, filter) => {
    counts[filter.id] = cases.filter((caseItem) =>
      matchesCaseManagementCategory(caseItem, filter.id)
    ).length;
    return counts;
  }, {});
}

function matchesCaseManagementCategory(caseItem, categoryId) {
  if (categoryId === "all") return true;
  if (categoryId === "level") return caseItem.category === "Level";
  if (categoryId === "community") {
    return caseItem.category === "Community" || caseItem.category === "Community Kiste";
  }
  if (categoryId === "standard") return !caseItem.isCustom;
  if (categoryId === "custom") return Boolean(caseItem.isCustom);

  return (
    caseItem.category !== "Level" &&
    caseItem.category !== "Community" &&
    caseItem.category !== "Community Kiste"
  );
}

function formatChance(value) {
  return `${Number(value).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: CHANCE_DECIMALS,
  })}%`;
}

function formatChanceInput(value) {
  return formatChanceInputValue(value);
}

function getChanceNumber(value) {
  const chance = Number(value);
  return Number.isFinite(chance) ? chance : 0;
}

function roundToChanceDecimals(value) {
  const factor = 10 ** CHANCE_DECIMALS;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function sanitizeChanceInput(value) {
  const normalizedValue = String(value).replace(",", ".");

  if (!normalizedValue) return "";

  const [whole = "", fraction] = normalizedValue.split(".");
  const safeWhole = whole.replace(/\D/g, "");

  if (fraction === undefined) {
    return safeWhole;
  }

  const safeFraction = fraction.replace(/\D/g, "").slice(0, CHANCE_DECIMALS);
  return `${safeWhole}.${safeFraction}`;
}

function formatChanceInputValue(value) {
  return roundToChanceDecimals(value)
    .toFixed(CHANCE_DECIMALS)
    .replace(/\.?0+$/, "");
}

function getDropVariantKey(drop) {
  return getVariantKey(drop.pokemonId, drop.grade, drop.shiny);
}

function hasDuplicateVariants(rows) {
  const variantKeys = rows.map(getDropVariantKey);
  return new Set(variantKeys).size !== variantKeys.length;
}

function formatPriceRange(priceRange) {
  return `${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}`;
}

function getPriceDraftsFromPokemon(pokemon) {
  if (!pokemon) return {};

  return Object.fromEntries(
    getPokemonPriceRows(pokemon).map((row) => [
      row.key,
      formatPriceDraftValue(row.price),
    ])
  );
}

function getPokemonPriceRows(pokemon) {
  return POKEMON_GRADES.flatMap((grade) =>
    [false, true].map((shiny) => {
      const variant =
        pokemon.variants.find(
          (item) => item.grade === grade && item.shiny === shiny
        ) ?? null;

      return {
        key: getPokemonPriceOverrideKey(pokemon.id, grade, shiny),
        grade,
        shiny,
        price: variant?.price ?? 0,
      };
    })
  );
}

function sanitizePriceDraftInput(value) {
  const normalizedValue = String(value).replace(",", ".");

  if (!normalizedValue) return "";

  const [whole = "", fraction] = normalizedValue.split(".");
  const safeWhole = whole.replace(/\D/g, "");

  if (fraction === undefined) {
    return safeWhole;
  }

  const safeFraction = fraction.replace(/\D/g, "").slice(0, 2);
  return `${safeWhole}.${safeFraction}`;
}

function formatPriceDraftValue(value) {
  return Number(value)
    .toFixed(2)
    .replace(/\.?0+$/, "");
}

function isPositivePrice(value) {
  const price = Number(String(value).replace(",", "."));
  return Number.isFinite(price) && price > 0;
}
