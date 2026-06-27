import React from "react";
import { Search } from "lucide-react";
import { SectionTitle } from "../components/SectionTitle.jsx";
import { getBasePokemonPrice, getPokemonCatalog } from "../lib/pokemonCatalog.js";
import { getRarityTone } from "../lib/rarity.js";
import { PokemonDetailPage } from "./PokemonDetailPage.jsx";

const sortOptions = [
  { label: "Standard", value: "id" },
  { label: "Preis aufsteigend", value: "price-asc" },
  { label: "Preis absteigend", value: "price-desc" },
  { label: "Name", value: "name" },
];

export function PokemonPage({ pokemonId }) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortMode, setSortMode] = React.useState("id");
  const pokemonCatalog = getPokemonCatalog();
  const selectedPokemon = pokemonCatalog.find(
    (pokemon) => pokemon.id === Number(pokemonId)
  );

  const visiblePokemon = React.useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return pokemonCatalog
      .filter((pokemon) => {
        const matchesSearch =
          !search || pokemon.name.toLowerCase().includes(search);

        return matchesSearch;
      })
      .sort((leftPokemon, rightPokemon) => {
        if (sortMode === "price-asc") {
          return getBasePokemonPrice(leftPokemon) - getBasePokemonPrice(rightPokemon);
        }

        if (sortMode === "price-desc") {
          return getBasePokemonPrice(rightPokemon) - getBasePokemonPrice(leftPokemon);
        }

        if (sortMode === "name") {
          return leftPokemon.name.localeCompare(rightPokemon.name, "de");
        }

        return leftPokemon.id - rightPokemon.id;
      });
  }, [searchTerm, sortMode]);

  if (selectedPokemon) {
    return <PokemonDetailPage pokemon={selectedPokemon} />;
  }

  return (
    <section className="page-section page-section--single">
      <SectionTitle title="Index" />

      <div className="pokemon-toolbar">
        <label className="search-shell">
          <Search aria-hidden="true" size={18} strokeWidth={2} />
          <input
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Pokemon suchen"
            type="search"
            value={searchTerm}
          />
        </label>

        <label className="select-shell">
          <span>Sortieren</span>
          <select
            onChange={(event) => setSortMode(event.target.value)}
            value={sortMode}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="pokemon-grid">
        {visiblePokemon.map((pokemon) => (
          <a
            className="pokemon-card"
            data-rarity={getRarityTone(pokemon.rarity)}
            href={`#pokemon/${pokemon.id}`}
            key={pokemon.id}
          >
            <img alt={pokemon.name} loading="lazy" src={pokemon.image} />
            <div>
              <strong>{pokemon.name}</strong>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
