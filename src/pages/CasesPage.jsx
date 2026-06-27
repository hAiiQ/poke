import React from "react";
import { Package, Trash2, Users } from "lucide-react";
import { CaseCard } from "../components/CaseCard.jsx";
import { CommunityCaseBuilder } from "../components/CommunityCaseBuilder.jsx";
import { CasesGrid } from "../components/CasesGrid.jsx";
import { SectionTitle } from "../components/SectionTitle.jsx";
import { getCaseCollection } from "../lib/caseCollection.js";
import { CaseDetailPage } from "./CaseDetailPage.jsx";

const mainTabs = [
  { id: "cases", label: "KISTEN", icon: Package },
  { id: "community", label: "COMMUNITY", icon: Users },
];

const caseCategoryTabs = [
  { id: "all", label: "ALLE KISTEN" },
  { id: "event", label: "EVENT KISTEN" },
  { id: "level", label: "LEVEL KISTEN" },
  { id: "community", label: "COMMUNITY KISTEN" },
];

const communityTabs = [
  { id: "mine", label: "DEINE KISTEN" },
  { id: "create", label: "KISTE ERSTELLEN" },
];

export function CasesPage({
  caseId,
  caseOverrides = {},
  customCases = [],
  currentUser,
  deletedCaseIds = [],
  onDeleteCase,
  onOpenCase,
  onSellInventoryItem,
  onSaveCase,
}) {
  const [activeMainTab, setActiveMainTab] = React.useState("cases");
  const [activeCaseCategory, setActiveCaseCategory] = React.useState("all");
  const [activeCommunityTab, setActiveCommunityTab] = React.useState("mine");
  const allCases = React.useMemo(
    () => getCaseCollection({ caseOverrides, customCases, deletedCaseIds }),
    [caseOverrides, customCases, deletedCaseIds]
  );
  const selectedCase = allCases.find((caseItem) => caseItem.id === caseId);
  const eventCases = allCases.filter(isEventCase);
  const levelCases = allCases.filter(isLevelCase);
  const communityCases = allCases.filter(isCommunityCase);
  const ownCommunityCases = currentUser
    ? communityCases.filter((caseItem) => caseItem.creatorId === currentUser.id)
    : [];
  const visibleCases = getVisibleCases({
    activeCaseCategory,
    activeCommunityTab,
    activeMainTab,
    allCases,
    communityCases,
    eventCases,
    levelCases,
    ownCommunityCases,
  });
  const activeTitle = getActiveTitle({
    activeCaseCategory,
    activeCommunityTab,
    activeMainTab,
  });
  const emptyMessage = getEmptyMessage({
    activeCaseCategory,
    activeCommunityTab,
    activeMainTab,
  });

  if (selectedCase) {
    return (
      <CaseDetailPage
        caseItem={selectedCase}
        currentUser={currentUser}
        onOpenCase={onOpenCase}
        onSellInventoryItem={onSellInventoryItem}
      />
    );
  }

  return (
    <>
      <div className="case-home-tabs">
        <div className="case-home-main-tabs" role="tablist" aria-label="Case Bereich">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMainTab === tab.id;

            return (
              <button
                aria-selected={isActive}
                className="case-home-main-tab"
                data-active={isActive ? "true" : "false"}
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                role="tab"
                type="button"
              >
                <Icon aria-hidden="true" size={21} strokeWidth={2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="case-home-subtabs" role="tablist" aria-label="Case Kategorien">
          {(activeMainTab === "community" ? communityTabs : caseCategoryTabs).map((tab) => {
            const isActive =
              activeMainTab === "community"
                ? activeCommunityTab === tab.id
                : activeCaseCategory === tab.id;

            return (
              <button
                aria-selected={isActive}
                className="case-home-subtab"
                data-active={isActive ? "true" : "false"}
                key={tab.id}
                onClick={() => {
                  if (activeMainTab === "community") {
                    setActiveCommunityTab(tab.id);
                    return;
                  }

                  setActiveCaseCategory(tab.id);
                }}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeMainTab === "community" && activeCommunityTab === "create" ? (
        <CommunityCaseBuilder
          currentUser={currentUser}
          onCaseCreated={() => setActiveCommunityTab("mine")}
          onSaveCase={onSaveCase}
        />
      ) : activeMainTab === "community" && activeCommunityTab === "mine" ? (
        <OwnCommunityCases
          cases={ownCommunityCases}
          currentUser={currentUser}
          emptyMessage={emptyMessage}
          onDeleteCase={onDeleteCase}
          title={activeTitle}
        />
      ) : activeMainTab === "cases" && activeCaseCategory === "all" ? (
        <GroupedCases cases={allCases} emptyMessage={emptyMessage} />
      ) : (
        <CasesGrid
          cases={visibleCases}
          emptyMessage={emptyMessage}
          title={activeTitle}
        />
      )}
    </>
  );
}

function GroupedCases({ cases, emptyMessage }) {
  const groups = [
    {
      id: "pokecase",
      title: "PokeCase Kisten",
      cases: cases.filter(isPokeCaseCase),
    },
    {
      id: "event",
      title: "Event Kisten",
      cases: cases.filter(isEventCase),
    },
    {
      id: "level",
      title: "Level Kisten",
      cases: cases.filter(isLevelCase),
    },
    {
      id: "community",
      title: "Community Kisten",
      cases: cases.filter(isCommunityCase),
    },
  ].filter((group) => group.cases.length);

  return (
    <section className="cases-section case-groups" aria-label="Alle Kisten">
      {groups.length ? (
        groups.map((group) => (
          <div className="case-group" key={group.id}>
            <SectionTitle title={group.title} />
            <div className="cases-grid">
              {group.cases.map((caseItem) => (
                <CaseCard caseItem={caseItem} key={caseItem.id} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state empty-state--large">{emptyMessage}</div>
      )}
    </section>
  );
}

function OwnCommunityCases({
  cases,
  currentUser,
  emptyMessage,
  onDeleteCase,
  title,
}) {
  function handleDelete(caseItem) {
    onDeleteCase?.(caseItem.id);
  }

  return (
    <section className="cases-section" aria-label={title}>
      <SectionTitle title={title} />

      {!currentUser ? (
        <div className="empty-state empty-state--large">
          Melde dich an, um deine eigenen Kisten zu sehen.
        </div>
      ) : cases.length ? (
        <div className="cases-grid">
          {cases.map((caseItem) => (
            <div className="own-case-card" key={caseItem.id}>
              <CaseCard caseItem={caseItem} />
              <button
                aria-label={`${caseItem.name} loeschen`}
                className="icon-button own-case-card__delete"
                onClick={() => handleDelete(caseItem)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={17} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state empty-state--large">{emptyMessage}</div>
      )}
    </section>
  );
}

function getVisibleCases({
  activeCaseCategory,
  activeCommunityTab,
  activeMainTab,
  allCases,
  communityCases,
  eventCases,
  levelCases,
  ownCommunityCases,
}) {
  if (activeMainTab === "community") {
    return activeCommunityTab === "mine" ? ownCommunityCases : [];
  }

  if (activeCaseCategory === "event") {
    return eventCases;
  }

  if (activeCaseCategory === "level") {
    return levelCases;
  }

  if (activeCaseCategory === "community") {
    return communityCases;
  }

  return allCases;
}

function getActiveTitle({
  activeCaseCategory,
  activeCommunityTab,
  activeMainTab,
}) {
  if (activeMainTab === "community") {
    return activeCommunityTab === "mine" ? "Deine Kisten" : "Kiste erstellen";
  }

  if (activeCaseCategory === "event") {
    return "Event Kisten";
  }

  if (activeCaseCategory === "level") {
    return "Level Kisten";
  }

  if (activeCaseCategory === "community") {
    return "Community Kisten";
  }

  return "Alle Kisten";
}

function getEmptyMessage({
  activeCaseCategory,
  activeCommunityTab,
  activeMainTab,
}) {
  if (activeMainTab === "community") {
    return activeCommunityTab === "mine"
      ? "Du hast noch keine eigenen Kisten erstellt."
      : "Der Kisten-Editor wird hier als naechstes aufgebaut.";
  }

  if (activeCaseCategory === "event") {
    return "Aktuell gibt es noch keine Event Kisten.";
  }

  if (activeCaseCategory === "level") {
    return "Aktuell gibt es noch keine Level Kisten.";
  }

  if (activeCaseCategory === "community") {
    return "Aktuell gibt es noch keine Community Kisten.";
  }

  return "Keine Kisten gefunden.";
}

function isCommunityCase(caseItem) {
  return (
    Boolean(caseItem.isCustom) ||
    ["Community", "Community Kiste"].includes(caseItem.category)
  );
}

function isEventCase(caseItem) {
  return ["Event", "Event Kiste"].includes(caseItem.category);
}

function isLevelCase(caseItem) {
  return caseItem.category === "Level";
}

function isPokeCaseCase(caseItem) {
  return (
    !isEventCase(caseItem) &&
    !isLevelCase(caseItem) &&
    !isCommunityCase(caseItem)
  );
}
