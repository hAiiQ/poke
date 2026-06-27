import React from "react";
import { ArrowLeft, Plus, Save, Search, Trash2 } from "lucide-react";
import { calculateExpectedCasePrice } from "../lib/casePricing.js";
import { getListedPokemon } from "./PokemonVariantPicker.jsx";
import {
  communityCaseTemplates,
  getCommunityCaseTemplate,
} from "../lib/communityCaseTemplates.js";
import { formatCurrency } from "../lib/format.js";
import {
  getPokemonById,
  getPokemonImage,
  getPokemonVariant,
  getVariantName,
  POKEMON_GRADES,
} from "../lib/pokemonCatalog.js";

const REQUIRED_TOTAL_CHANCE = 100;
const MINIMUM_DROP_COUNT = 2;
const CHANCE_DECIMALS = 4;
const CHANCE_STEP = "0.0001";

function createSelectedDrop(pokemon, grade = "Wild", shiny = false) {
  const variant = getPokemonVariant(pokemon.id, grade, shiny);

  return {
    id: crypto.randomUUID(),
    pokemonId: pokemon.id,
    grade,
    shiny,
    chance: "",
    value: variant?.price ?? 0,
  };
}

export function CommunityCaseBuilder({ currentUser, onCaseCreated, onSaveCase }) {
  const [caseName, setCaseName] = React.useState("");
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(
    communityCaseTemplates[0].id
  );
  const [selectedDrops, setSelectedDrops] = React.useState([]);
  const [pendingPokemon, setPendingPokemon] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [exactPrice, setExactPrice] = React.useState("");
  const [priceSort, setPriceSort] = React.useState("default");
  const [builderStep, setBuilderStep] = React.useState("drops");
  const [message, setMessage] = React.useState(null);

  const selectedTemplate = getCommunityCaseTemplate(selectedTemplateId);
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
  const preparedDrops = React.useMemo(
    () =>
      selectedDrops
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
    [selectedDrops]
  );
  const topDrop = getMostValuableDrop(preparedDrops);
  const totalChance = selectedDrops.reduce(
    (sum, drop) => sum + getChanceNumber(drop.chance),
    0
  );
  const roundedTotalChance = roundToChanceDecimals(totalChance);
  const chanceReady = roundedTotalChance === REQUIRED_TOTAL_CHANCE;
  const dropCountReady = preparedDrops.length >= MINIMUM_DROP_COUNT;
  const previewPrice = calculateExpectedCasePrice(preparedDrops, 0.1);
  const selectedVariantKeys = React.useMemo(
    () => new Set(selectedDrops.map((drop) => getDropVariantKey(drop))),
    [selectedDrops]
  );

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

    setSelectedDrops((currentDrops) => [
      ...currentDrops,
      createSelectedDrop(pendingPokemon, grade, shiny),
    ]);
    setPendingPokemon(null);
    setMessage(null);
  }

  function updateDropRow(rowId, patch) {
    setSelectedDrops((currentDrops) =>
      currentDrops.map((row) => {
        if (row.id !== rowId) return row;

        const nextRow = {
          ...row,
          ...patch,
        };
        const variant = getPokemonVariant(
          nextRow.pokemonId,
          nextRow.grade,
          nextRow.shiny
        );

        return {
          ...nextRow,
          value: variant?.price ?? 0,
        };
      })
    );
  }

  function updateDropChance(rowId, value) {
    updateDropRow(rowId, { chance: sanitizeChanceInput(value) });
  }

  function fillRemainingChance(rowId) {
    const otherChance = selectedDrops.reduce((sum, row) => {
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
    setSelectedDrops((currentDrops) =>
      currentDrops.filter((row) => row.id !== rowId)
    );
  }

  function resetForm() {
    setCaseName("");
    setSelectedTemplateId(communityCaseTemplates[0].id);
    setSelectedDrops([]);
    setPendingPokemon(null);
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setExactPrice("");
    setPriceSort("default");
    setBuilderStep("drops");
  }

  function goToDesignStep() {
    if (!currentUser) {
      setMessage({
        status: "error",
        text: "Bitte melde dich an, um Community Kisten zu erstellen.",
      });
      return;
    }

    if (!dropCountReady || !topDrop) {
      setMessage({
        status: "error",
        text: `Fuege mindestens ${MINIMUM_DROP_COUNT} Pokemon mit Chance hinzu.`,
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

    setMessage(null);
    setBuilderStep("design");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
      setMessage({
        status: "error",
        text: "Bitte melde dich an, um Community Kisten zu erstellen.",
      });
      return;
    }

    const name = caseName.trim();

    if (name.length < 3) {
      setMessage({
        status: "error",
        text: "Der Kistenname braucht mindestens 3 Zeichen.",
      });
      return;
    }

    if (!dropCountReady || !topDrop) {
      setMessage({
        status: "error",
        text: `Mindestens ${MINIMUM_DROP_COUNT} Drops brauchen Pokemon, Preis und Chance.`,
      });
      setBuilderStep("drops");
      return;
    }

    if (!chanceReady) {
      setMessage({
        status: "error",
        text: "Die Dropchancen muessen zusammen genau 100,00% ergeben.",
      });
      setBuilderStep("drops");
      return;
    }

    const caseItem = {
      id: `custom-${crypto.randomUUID()}`,
      name,
      category: "Community",
      communityTemplateId: selectedTemplate.id,
      coverImage: selectedTemplate.image,
      coverOverlayAlt: topDrop.pokemon,
      coverOverlayImage: topDrop.image,
      creatorId: currentUser.id,
      creatorName: currentUser.username,
      createdAt: new Date().toISOString(),
      rarity: topDrop.rarity ?? "Community",
      requirement: `Von ${currentUser.username}`,
      price: previewPrice,
      previewIds: preparedDrops.slice(0, 3).map((drop) => drop.pokemonId),
      previewSprites: preparedDrops
        .slice(0, 3)
        .map((drop) => drop.image ?? getPokemonImage(drop.pokemonId)),
      items: preparedDrops,
    };

    onSaveCase?.(caseItem);
    resetForm();
    setMessage({ status: "success", text: "Community Kiste erstellt." });
    onCaseCreated?.(caseItem);
  }

  if (!currentUser) {
    return (
      <section className="cases-section" aria-label="Community Kiste erstellen">
        <div className="community-case-builder community-case-builder--locked">
          <div>
            <span>COMMUNITY</span>
            <h2>Kiste erstellen</h2>
          </div>
          <a className="primary-button" href="#login">
            Anmelden
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="cases-section" aria-label="Community Kiste erstellen">
      <form className="community-case-builder" onSubmit={handleSubmit}>
        <div className="community-case-builder__head">
          <div>
            <span>COMMUNITY</span>
            <h2>Kiste erstellen</h2>
          </div>
          <strong>{formatCurrency(previewPrice)} Credits</strong>
        </div>

        <div className="community-builder-steps" aria-label="Erstellungsschritte">
          <span data-active={builderStep === "drops" ? "true" : "false"}>
            1 Drops
          </span>
          <span data-active={builderStep === "design" ? "true" : "false"}>
            2 Design
          </span>
        </div>

        {builderStep === "drops" ? (
          <div className="community-drop-layout">
            <section className="community-pokemon-panel" aria-label="Pokemon suchen">
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
                  <strong>{selectedDrops.length} Pokemon</strong>
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
                {selectedDrops.length ? (
                  selectedDrops.map((row, index) => {
                    const pokemon = getPokemonById(row.pokemonId);
                    const variant = getPokemonVariant(
                      row.pokemonId,
                      row.grade,
                      row.shiny
                    );
                    const image = getPokemonImage(row.pokemonId, row.shiny);
                    const isLastDrop = index === selectedDrops.length - 1;

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
                          <span>{formatCurrency(variant?.price ?? 0)} Credits</span>
                        </div>
                        <button
                          aria-label={`${pokemon?.name ?? "Pokemon"} entfernen`}
                          className="icon-button"
                          onClick={() => removeDropRow(row.id)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={17} strokeWidth={2} />
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">Noch keine Pokemon ausgewaehlt.</div>
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

              {message ? (
                <p className="form-message" data-status={message.status}>
                  {message.text}
                </p>
              ) : null}

              <button
                className="primary-button primary-button--full"
                onClick={goToDesignStep}
                type="button"
              >
                Weiter
              </button>
            </aside>
          </div>
        ) : (
          <div className="community-case-builder__layout">
            <div className="community-case-builder__form">
              <button
                className="secondary-button community-back-button"
                onClick={() => {
                  setMessage(null);
                  setBuilderStep("drops");
                }}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={17} strokeWidth={2} />
                Zurueck
              </button>

              <label className="field-label">
                Kistenname
                <input
                  className="text-input"
                  onChange={(event) => setCaseName(event.target.value)}
                  placeholder="z.B. hAiQ Mix"
                  type="text"
                  value={caseName}
                />
              </label>

              <div className="field-label">
                Kistenbild
                <div className="community-template-grid">
                  {communityCaseTemplates.map((template) => {
                    const isActive = selectedTemplateId === template.id;

                    return (
                      <button
                        aria-pressed={isActive}
                        className="community-template-option"
                        data-active={isActive ? "true" : "false"}
                        key={template.id}
                        onClick={() => setSelectedTemplateId(template.id)}
                        type="button"
                      >
                        <img alt="" src={template.image} />
                        <span>{template.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {message ? (
                <p className="form-message" data-status={message.status}>
                  {message.text}
                </p>
              ) : null}

              <button
                className="primary-button primary-button--full"
                disabled={!chanceReady || !dropCountReady}
                type="submit"
              >
                <Save aria-hidden="true" size={18} strokeWidth={2} />
                Kiste erstellen
              </button>
            </div>

            <aside className="community-case-preview">
              <span>Preview</span>
              <div className="community-case-preview__art">
                <img
                  alt=""
                  className="community-case-preview__cover"
                  src={selectedTemplate.image}
                />
                {topDrop ? (
                  <img
                    alt=""
                    className="community-case-preview__pokemon"
                    src={topDrop.image}
                  />
                ) : null}
              </div>
              <strong>{caseName.trim() || "Neue Community Kiste"}</strong>
              {topDrop ? <small>Top Drop: {topDrop.pokemon}</small> : null}
            </aside>
          </div>
        )}
      </form>
    </section>
  );
}

function PokemonVariantPicker({
  disabledVariantKeys = new Set(),
  onSelect,
  pokemon,
  selectedGrade = null,
  selectedShiny = null,
}) {
  return (
    <div
      className="community-variant-picker"
      aria-label={`${pokemon.name} Preis waehlen`}
    >
      <div className="community-variant-picker__head" aria-hidden="true">
        <span>Normal</span>
        <span>Shiny</span>
      </div>

      <div className="community-variant-picker__grid">
        {POKEMON_GRADES.flatMap((grade) =>
          [false, true].map((shiny) => {
            const variant = getPokemonVariant(pokemon.id, grade, shiny);
            const isDuplicate = disabledVariantKeys.has(
              getVariantKey(pokemon.id, grade, shiny)
            );
            const hasActiveSelection =
              selectedGrade !== null && selectedShiny !== null;
            const isActive =
              hasActiveSelection &&
              selectedGrade === grade &&
              selectedShiny === shiny;

            return (
              <button
                aria-pressed={isActive}
                className="community-variant-option"
                data-active={isActive ? "true" : "false"}
                data-duplicate={isDuplicate ? "true" : "false"}
                data-shiny={shiny ? "true" : "false"}
                disabled={!variant || isDuplicate}
                key={`${grade}-${shiny ? "shiny" : "normal"}`}
                onClick={() => {
                  if (variant && !isDuplicate) {
                    onSelect({ grade, shiny });
                  }
                }}
                type="button"
              >
                <span>{formatVariantLabel(grade, shiny)}</span>
                <strong>{formatCurrency(variant?.price ?? 0)}</strong>
                {isDuplicate ? <small>Schon drin</small> : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatPriceRange(priceRange) {
  return `${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}`;
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

function getVariantKey(pokemonId, grade, shiny) {
  return `${Number(pokemonId)}:${grade}:${Boolean(shiny) ? "shiny" : "normal"}`;
}

function formatVariantLabel(grade, shiny) {
  return `${grade} - ${shiny ? "Shiny" : "Normal"}`;
}

function getMostValuableDrop(drops) {
  return drops.reduce((topDrop, drop) => {
    if (!topDrop) return drop;
    return Number(drop.value ?? 0) > Number(topDrop.value ?? 0)
      ? drop
      : topDrop;
  }, null);
}

function formatChance(chance) {
  const numericChance = Number(chance);

  return `${numericChance.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: CHANCE_DECIMALS,
  })}%`;
}
