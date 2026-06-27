import React from "react";

export function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="section-title">
      {eyebrow ? <span className="section-title__eyebrow">{eyebrow}</span> : null}
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}
