import React from "react";
import { ArrowDownUp, Backpack } from "lucide-react";
import { SectionTitle } from "../components/SectionTitle.jsx";
import { formatCurrency } from "../lib/format.js";
import { getPokemonImage } from "../lib/pokemonCatalog.js";
import { getRarityTone } from "../lib/rarity.js";

const sortOptions = [
  { value: "newest", label: "Neueste" },
  { value: "value-desc", label: "Wert absteigend" },
  { value: "value-asc", label: "Wert aufsteigend" },
];

export function InventoryPage({ inventory }) {
  const [sortBy, setSortBy] = React.useState("newest");
  const sortedInventory = React.useMemo(
    () => sortInventory(inventory, sortBy),
    [inventory, sortBy]
  );

  return (
    <section className="page-section page-section--single" id="inventar">
      <SectionTitle eyebrow="Inventar" title="Inventar" />

      <div className="inventory-toolbar">
        <div className="inventory-toolbar__summary">
          <Backpack aria-hidden="true" size={20} strokeWidth={2} />
          <strong>{sortedInventory.length}</strong>
          <span>Skins</span>
        </div>

        <label className="select-shell">
          <ArrowDownUp aria-hidden="true" size={18} strokeWidth={2} />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="inventory-grid">
        {sortedInventory.length ? (
          sortedInventory.map((item) => (
            <article
              className="inventory-item"
              data-rarity={getRarityTone(item.rarity)}
              data-shiny={item.shiny ? "true" : "false"}
              key={item.id}
            >
              {getInventoryImage(item) ? (
                <img alt="" src={getInventoryImage(item)} />
              ) : null}
              <strong>{item.pokemon}</strong>
              <small>{item.caseName}</small>
              <b>{formatCurrency(item.value)} Credits</b>
            </article>
          ))
        ) : (
          <div className="empty-state empty-state--large">
            Dein Inventar ist noch leer.
          </div>
        )}
      </div>
    </section>
  );
}

function getInventoryImage(item) {
  if (item.pokemonId && item.shiny) return getPokemonImage(item.pokemonId, true);
  return item.image ?? null;
}

function sortInventory(items, sortBy) {
  const sortedItems = [...items];

  if (sortBy === "value-desc") {
    return sortedItems.sort((a, b) => Number(b.value) - Number(a.value));
  }

  if (sortBy === "value-asc") {
    return sortedItems.sort((a, b) => Number(a.value) - Number(b.value));
  }

  if (sortBy === "rarity") {
    return sortedItems.sort((a, b) =>
      String(a.rarity).localeCompare(String(b.rarity), "de")
    );
  }

  return sortedItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
