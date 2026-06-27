import React from "react";
import { formatCurrency } from "../lib/format.js";
import { getRarityTone } from "../lib/rarity.js";

export function CaseCard({ caseItem }) {
  const priceLabel = `${formatCurrency(caseItem.price)} Credits`;

  return (
    <a
      className="case-card case-card--link"
      data-community={caseItem.coverOverlayImage ? "true" : "false"}
      data-rarity={getRarityTone(caseItem.rarity)}
      href={`#case/${caseItem.id}`}
    >
      <img
        alt={`${caseItem.name} Cover`}
        className="case-card__image"
        loading="lazy"
        src={caseItem.coverImage}
      />
      {caseItem.coverOverlayImage ? (
        <img
          alt=""
          className="case-card__overlay"
          loading="lazy"
          src={caseItem.coverOverlayImage}
        />
      ) : null}

      <div className="case-card__content">
        <h3>{caseItem.name}</h3>
        <strong>{priceLabel}</strong>
      </div>
    </a>
  );
}
