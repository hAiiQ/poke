import React from "react";
import { Gift, ShieldCheck } from "lucide-react";
import { formatCurrency } from "../lib/format.js";
import { CasePreviewArt } from "./CasePreviewArt.jsx";

export function FeaturedCase({ featuredCase }) {
  return (
    <section className="featured-case" id="free-case" aria-labelledby="featured-title">
      <div className="featured-case__copy">
        <h1 id="featured-title">{featuredCase.name}</h1>
        <p className="featured-case__subline">Tägliche Einstiegskiste</p>

        <div className="fairness-line">
          <ShieldCheck aria-hidden="true" size={22} strokeWidth={2} />
          <span>Fairness transparent</span>
        </div>
      </div>

      <div className="featured-case__stage">
        <div className="stage-frame">
          <span className="stage-marker stage-marker--top" />
          <CasePreviewArt
            name={featuredCase.name}
            sprites={featuredCase.previewSprites}
          />
          <span className="stage-marker stage-marker--bottom" />
        </div>

        <div className="open-panel">
          <strong>{featuredCase.price === 0 ? "Free" : formatCurrency(featuredCase.price)}</strong>
          <button className="primary-button primary-button--wide" type="button">
            <Gift aria-hidden="true" size={18} strokeWidth={2} />
            Öffnen
          </button>
        </div>
      </div>
    </section>
  );
}
