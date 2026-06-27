import React from "react";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "../lib/format.js";
import { POKEMON_GRADES } from "../lib/pokemonCatalog.js";
import { getRarityTone } from "../lib/rarity.js";

export function PokemonDetailPage({ pokemon }) {
  return (
    <section className="pokemon-detail page-section page-section--single">
      <a className="back-link" href="#pokemon">
        <ArrowLeft aria-hidden="true" size={18} strokeWidth={2} />
        Index
      </a>

      <div className="pokemon-detail__hero">
        <div
          className="pokemon-detail__image"
          data-rarity={getRarityTone(pokemon.rarity)}
        >
          <img alt={pokemon.name} src={pokemon.image} />
        </div>

        <div className="pokemon-detail__copy">
          <h1>{pokemon.name}</h1>
        </div>
      </div>

      <div className="pokemon-price-table">
        <div className="pokemon-price-table__head">
          <span>Form</span>
          <span>Normal</span>
          <span>Shiny</span>
        </div>

        {POKEMON_GRADES.map((grade) => {
          const normalVariant = pokemon.variants.find(
            (variant) => variant.grade === grade && !variant.shiny
          );
          const shinyVariant = pokemon.variants.find(
            (variant) => variant.grade === grade && variant.shiny
          );

          return (
            <div className="pokemon-price-row" key={grade}>
              <strong>{grade}</strong>
              <span>{formatCurrency(normalVariant?.price ?? 0)} Credits</span>
              <span>{formatCurrency(shinyVariant?.price ?? 0)} Credits</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
