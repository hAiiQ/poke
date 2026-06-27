import React from "react";
import { Backpack, Clock3, Swords, TrendingUp } from "lucide-react";
import { levelRules } from "../config/levelRules.js";

const panels = [
  {
    id: "battles",
    title: "Battles",
    icon: Swords,
    metric: "PvP Cases",
    text: "Spieler treten mit gezogenen Pokémon gegeneinander an.",
  },
  {
    id: "inventar",
    title: "Inventar",
    icon: Backpack,
    metric: "Sortierung",
    text: "Skins, Shiny-Varianten, Grades und Werte.",
  },
  {
    id: "level-cases",
    title: "Level Cases",
    icon: Clock3,
    metric: `${levelRules.unlockIntervalMinutes} Minuten`,
    text: "Neue Free-Öffnung ab Level 10, 20, 30 und später weiter.",
  },
  {
    id: "level-system",
    title: "Level System",
    icon: TrendingUp,
    metric: `${levelRules.xpPerCurrencySpent} XP`,
    text: "XP basiert auf bezahlten Öffnungen; Free Cases geben keine XP.",
  },
];

export function FeaturePanels() {
  return (
    <section className="feature-panels" aria-label="Geplante Systeme">
      {panels.map((panel) => {
        const Icon = panel.icon;

        return (
          <article className="feature-panel" id={panel.id} key={panel.id}>
            <div className="feature-panel__icon">
              <Icon aria-hidden="true" size={22} strokeWidth={2} />
            </div>
            <div>
              <span>{panel.metric}</span>
              <h3>{panel.title}</h3>
              <p>{panel.text}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
