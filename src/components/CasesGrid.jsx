import React from "react";
import { CaseCard } from "./CaseCard.jsx";
import { SectionTitle } from "./SectionTitle.jsx";

export function CasesGrid({
  cases,
  emptyMessage = "Keine Kisten gefunden.",
  title = "Kisten",
}) {
  return (
    <section className="cases-section" aria-label={title}>
      <SectionTitle title={title} />

      {cases.length ? (
        <div className="cases-grid">
          {cases.map((caseItem) => (
            <CaseCard caseItem={caseItem} key={caseItem.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state empty-state--large">{emptyMessage}</div>
      )}
    </section>
  );
}
