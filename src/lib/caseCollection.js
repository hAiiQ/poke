import { cases as standardCases } from "../config/cases.js";
import { getCommunityCaseTemplate } from "./communityCaseTemplates.js";
import { getPokemonImage } from "./pokemonCatalog.js";

export function getCaseCollection({
  caseOverrides = {},
  customCases = [],
  deletedCaseIds = [],
} = {}) {
  const deletedCaseIdSet = new Set(deletedCaseIds.map(String));
  const editableStandardCases = standardCases
    .filter((caseItem) => !deletedCaseIdSet.has(String(caseItem.id)))
    .map((caseItem) => {
      const override = caseOverrides[caseItem.id];

      return withResolvedCommunityArt({
        ...(override ?? caseItem),
        id: caseItem.id,
        isCustom: false,
        isEdited: Boolean(override),
        originalCase: caseItem,
      });
    });

  return [
    ...editableStandardCases,
    ...customCases
      .filter((caseItem) => !deletedCaseIdSet.has(String(caseItem.id)))
      .map((caseItem) =>
        withResolvedCommunityArt({
          ...caseItem,
          isCustom: true,
          isEdited: true,
          originalCase: null,
        })
      ),
  ];
}

export function isCustomCaseId(caseId) {
  return String(caseId).startsWith("custom-");
}

function withResolvedCommunityArt(caseItem) {
  if (caseItem.category !== "Community" && !caseItem.communityTemplateId) {
    return caseItem;
  }

  const template = getCommunityCaseTemplate(caseItem.communityTemplateId);
  const topDrop = getMostValuableDrop(caseItem.items ?? []);

  return {
    ...caseItem,
    coverImage: template?.image ?? caseItem.coverImage,
    coverOverlayAlt: topDrop?.pokemon ?? caseItem.coverOverlayAlt,
    coverOverlayImage: topDrop
      ? getDropImage(topDrop)
      : caseItem.coverOverlayImage,
  };
}

function getMostValuableDrop(items) {
  return items.reduce((topDrop, item) => {
    if (!topDrop) return item;
    return Number(item.value ?? 0) > Number(topDrop.value ?? 0)
      ? item
      : topDrop;
  }, null);
}

function getDropImage(drop) {
  if (drop.image) return drop.image;
  if (drop.pokemonId) return getPokemonImage(drop.pokemonId, drop.shiny);
  return null;
}
