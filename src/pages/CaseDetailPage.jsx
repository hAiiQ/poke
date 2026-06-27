import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CaseLootTable } from "../components/CaseLootTable.jsx";
import { CaseOpeningReel } from "../components/CaseOpeningReel.jsx";
import { formatCurrency } from "../lib/format.js";
import { getRarityTone } from "../lib/rarity.js";

export function CaseDetailPage({
  caseItem,
  currentUser,
  onOpenCase,
  onSellInventoryItem,
}) {
  const priceLabel =
    caseItem.price === 0 ? "Free" : `${formatCurrency(caseItem.price)} Credits`;

  return (
    <>
      <section className="case-detail-hero" data-rarity={getRarityTone(caseItem.rarity)}>
        <div className="case-detail-hero__copy">
          <a className="back-link" href="#cases">
            <ArrowLeft aria-hidden="true" size={18} strokeWidth={2} />
            Kisten
          </a>
          <h1>{caseItem.name}</h1>

          <div className="fairness-line fairness-line--detail">
            <ShieldCheck aria-hidden="true" size={22} strokeWidth={2} />
            <span>Dropchancen sichtbar</span>
          </div>
        </div>

        <div className="case-detail-hero__stage">
          <CaseOpeningReel
            caseItem={caseItem}
            currentUser={currentUser}
            onOpenCase={onOpenCase}
            onSellInventoryItem={onSellInventoryItem}
            priceLabel={priceLabel}
          />
        </div>
      </section>

      <CaseLootTable caseItem={caseItem} />
    </>
  );
}
