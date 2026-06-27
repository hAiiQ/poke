import React from "react";
import { formatCurrency } from "../lib/format.js";
import { getPokemonById, getPokemonImage } from "../lib/pokemonCatalog.js";
import { getRarityTone } from "../lib/rarity.js";

export function CaseLootTable({ caseItem }) {
  const sortedItems = [...caseItem.items].sort((a, b) => b.value - a.value);

  return (
    <section className="loot-section" aria-labelledby="loot-title">
      <div className="section-title section-title--compact">
        <span className="section-title__eyebrow">Drops</span>
        <h2 id="loot-title">In dieser Kiste</h2>
      </div>

      <div className="loot-grid">
        {sortedItems.map((item, index) => {
          const rarity = getDropRarity(item, caseItem);
          const image = getDropImage(item, caseItem);
          const fallbackImage = getDropFallbackImage(item, caseItem);

          return (
            <article
              className="loot-card"
              data-rarity={getRarityTone(rarity)}
              data-shiny={item.shiny ? "true" : "false"}
              key={item.id ?? `${item.pokemon}-${item.grade ?? "base"}-${index}`}
            >
              <div className="loot-card__media">
                <b className="loot-card__chance">{formatChance(item.chance)}</b>
                <img
                  alt={item.pokemon}
                  data-fallback={fallbackImage}
                  loading="lazy"
                  onError={handleImageFallback}
                  src={image}
                />
                {item.shiny ? <span>Shiny</span> : null}
                <em className="loot-card__value">
                  {formatCurrency(item.value)} Credits
                </em>
              </div>
              <div className="loot-card__copy">
                <strong>{item.pokemon}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getDropRarity(item, caseItem) {
  const pokemon = item.pokemonId ? getPokemonById(item.pokemonId) : null;
  return item.rarity ?? pokemon?.rarity ?? caseItem.rarity;
}

function getDropImage(item, caseItem) {
  if (item.pokemonId && item.shiny) return getPokemonImage(item.pokemonId, true);
  if (item.image) return item.image;
  if (item.pokemonId) return getPokemonImage(item.pokemonId);
  return caseItem.coverImage ?? getPokemonImage(caseItem.previewIds?.[0] ?? 1);
}

function getDropFallbackImage(item, caseItem) {
  if (item.pokemonId) return getPokemonImage(item.pokemonId);
  return caseItem.coverImage ?? getPokemonImage(caseItem.previewIds?.[0] ?? 1);
}

function handleImageFallback(event) {
  const fallbackImage = event.currentTarget.dataset.fallback;
  if (!fallbackImage || event.currentTarget.src === fallbackImage) return;
  event.currentTarget.src = fallbackImage;
}

function formatChance(chance) {
  return `${Number(chance).toLocaleString("de-DE", {
    minimumFractionDigits: chance < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}%`;
}
