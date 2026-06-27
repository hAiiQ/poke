import React from "react";
import { statItems } from "../config/statItems.js";
import { formatShortNumber } from "../lib/format.js";

export function TopStatsBar({ stats }) {
  return (
    <div className="top-stats" aria-label="Plattform-Statistiken">
      <div className="top-stats__inner">
        {statItems.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="top-stats__item" data-tone={stat.tone} key={stat.label}>
              <Icon aria-hidden="true" size={16} strokeWidth={2} />
              <strong>{formatShortNumber(stats[stat.key] ?? 0)}</strong>
              <span>{stat.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
