import React from "react";
import { formatCurrency } from "../lib/format.js";
import {
  getPokemonCatalog,
  getPokemonVariant,
  POKEMON_GRADES,
} from "../lib/pokemonCatalog.js";

export function PokemonVariantPicker({
  disabledVariantKeys = new Set(),
  onSelect,
  pokemon,
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

            return (
              <button
                className="community-variant-option"
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

export function getPokemonPriceRange(pokemon) {
  const prices = pokemon.variants
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price));

  if (!prices.length) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function getListedPokemon({
  exactPrice,
  maxPrice,
  minPrice,
  priceSort,
  searchTerm,
}) {
  const exact = parsePriceInput(exactPrice);
  const min = parsePriceInput(minPrice);
  const max = parsePriceInput(maxPrice);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return pokemonSort(
    pokemonCatalogWithPriceRange().filter((pokemon) => {
      const { min: lowestPrice, max: highestPrice } = pokemon.priceRange;

      if (
        normalizedSearch &&
        !pokemon.name.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (minPrice !== "" && Number.isFinite(min) && highestPrice < min) {
        return false;
      }

      if (maxPrice !== "" && Number.isFinite(max) && lowestPrice > max) {
        return false;
      }

      if (exactPrice !== "" && Number.isFinite(exact)) {
        return pokemon.variants.some((variant) =>
          pricesMatch(variant.price, exact)
        );
      }

      return true;
    }),
    priceSort
  );
}

export function getVariantKey(pokemonId, grade, shiny) {
  return `${Number(pokemonId)}:${grade}:${shiny ? "shiny" : "normal"}`;
}

export function formatVariantLabel(grade, shiny) {
  return `${grade} - ${shiny ? "Shiny" : "Normal"}`;
}

function pokemonCatalogWithPriceRange() {
  return getPokemonCatalog().map((pokemon) => ({
    ...pokemon,
    priceRange: getPokemonPriceRange(pokemon),
  }));
}

function pokemonSort(pokemonList, priceSort) {
  return [...pokemonList].sort((firstPokemon, secondPokemon) => {
    if (priceSort === "price-asc") {
      return (
        firstPokemon.priceRange.min - secondPokemon.priceRange.min ||
        firstPokemon.name.localeCompare(secondPokemon.name, "de")
      );
    }

    if (priceSort === "price-desc") {
      return (
        secondPokemon.priceRange.max - firstPokemon.priceRange.max ||
        firstPokemon.name.localeCompare(secondPokemon.name, "de")
      );
    }

    return firstPokemon.id - secondPokemon.id;
  });
}

function parsePriceInput(value) {
  if (value === "") return Number.NaN;
  return Number(String(value).replace(",", "."));
}

function pricesMatch(price, exactPrice) {
  return Math.abs(Number(price) - exactPrice) < 0.000001;
}
