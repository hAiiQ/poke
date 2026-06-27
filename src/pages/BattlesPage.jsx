import React from "react";
import { Swords, UsersRound } from "lucide-react";
import { SectionTitle } from "../components/SectionTitle.jsx";

export function BattlesPage() {
  return (
    <section className="page-section page-section--single" id="battles">
      <SectionTitle eyebrow="Battles" title="Battle Lobby" />

      <div className="battle-layout">
        <article className="battle-panel battle-panel--main">
          <div className="feature-panel__icon">
            <Swords aria-hidden="true" size={28} strokeWidth={2} />
          </div>
          <h3>Spieler Battles</h3>
          <p>Battle-Matches werden spaeter mit Einsatz, Gegner und Ergebnislogik verbunden.</p>
          <button className="primary-button primary-button--wide" type="button">
            Battle erstellen
          </button>
        </article>

        <article className="battle-panel">
          <div className="feature-panel__icon">
            <UsersRound aria-hidden="true" size={26} strokeWidth={2} />
          </div>
          <h3>Offene Lobbys</h3>
          <div className="empty-state">Keine offenen Battles</div>
        </article>
      </div>
    </section>
  );
}
