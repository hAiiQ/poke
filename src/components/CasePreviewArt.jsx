import React from "react";

export function CasePreviewArt({ caseItem, sprites = [], name }) {
  if (caseItem?.coverOverlayImage) {
    return (
      <div className="case-art case-art--community" aria-label={`${name} Vorschau`}>
        <img
          alt=""
          className="case-art__cover"
          src={caseItem.coverImage}
        />
        <img
          alt=""
          className="case-art__overlay"
          src={caseItem.coverOverlayImage}
        />
        <div className="case-art__glow" />
      </div>
    );
  }

  return (
    <div className="case-art" aria-label={`${name} Vorschau`}>
      <div className="case-art__lid" />
      <div className="case-art__body">
        {sprites.slice(0, 3).map((sprite, index) => (
          <img
            alt=""
            className="case-art__sprite"
            data-slot={index}
            key={sprite}
            src={sprite}
          />
        ))}
      </div>
      <div className="case-art__glow" />
    </div>
  );
}
