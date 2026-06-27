import React from "react";
import { ChatPanel } from "./components/ChatPanel.jsx";
import { MainNav } from "./components/MainNav.jsx";
import { TopStatsBar } from "./components/TopStatsBar.jsx";
import { useAppState } from "./hooks/useAppState.js";
import { useHashRoute } from "./hooks/useHashRoute.js";
import { BattlesPage } from "./pages/BattlesPage.jsx";
import { CasesPage } from "./pages/CasesPage.jsx";
import { InventoryPage } from "./pages/InventoryPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";

const ADMIN_USERNAME = "hAiQ";

const AdminPage = React.lazy(() =>
  import("./pages/AdminPage.jsx").then((module) => ({
    default: module.AdminPage,
  }))
);
const PokemonPage = React.lazy(() =>
  import("./pages/PokemonPage.jsx").then((module) => ({
    default: module.PokemonPage,
  }))
);

export function App() {
  const route = useHashRoute();
  const {
    caseOverrides,
    currentUser,
    customPrices,
    customCases,
    deletedCaseIds,
    deleteUserAccount,
    deleteCase,
    grantUserBalance,
    inventory,
    loginUser,
    logout,
    openCase,
    registerUser,
    resetCaseOverride,
    resetPokemonPricesForPokemon,
    saveCase,
    savePokemonPrices,
    sellInventoryItem,
    stats,
    updateUserAccount,
    users,
  } = useAppState();
  const isAdmin = currentUser?.username === ADMIN_USERNAME;

  React.useEffect(() => {
    if (!("scrollRestoration" in window.history)) return undefined;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  React.useLayoutEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [route.caseId, route.page, route.pokemonId]);

  React.useEffect(() => {
    const isAuthPage = route.page === "login" || route.page === "register";

    if (currentUser && isAuthPage) {
      window.location.hash = "#cases";
    }
  }, [currentUser, route.page]);

  React.useEffect(() => {
    if (route.page === "admin" && !isAdmin) {
      window.location.hash = "#cases";
    }
  }, [isAdmin, route.page]);

  return (
    <div className="app-shell">
      <TopStatsBar stats={stats} />
      <div className="nav-wrap">
        <MainNav
          currentRoute={route.page}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onLogout={logout}
        />
      </div>

      <div className="app-layout">
        <ChatPanel currentUser={currentUser} />

        <React.Suspense fallback={<div className="route-loader" />}>
          <main>
            {route.page === "cases" ? (
              <CasesPage
                caseId={route.caseId}
                caseOverrides={caseOverrides}
                customCases={customCases}
                currentUser={currentUser}
                deletedCaseIds={deletedCaseIds}
                onOpenCase={openCase}
                onSellInventoryItem={sellInventoryItem}
                onDeleteCase={deleteCase}
                onSaveCase={saveCase}
                stats={stats}
              />
            ) : null}
            {route.page === "battles" ? <BattlesPage /> : null}
            {route.page === "inventar" ? <InventoryPage inventory={inventory} /> : null}
            {route.page === "pokemon" ? (
              <PokemonPage pokemonId={route.pokemonId} />
            ) : null}
            {route.page === "admin" && isAdmin ? (
              <AdminPage
                caseOverrides={caseOverrides}
                customPrices={customPrices}
                customCases={customCases}
                currentUser={currentUser}
                deletedCaseIds={deletedCaseIds}
                onDeleteCase={deleteCase}
                onDeleteUser={deleteUserAccount}
                onGrantBalance={grantUserBalance}
                onResetCase={resetCaseOverride}
                onResetPokemonPricesForPokemon={resetPokemonPricesForPokemon}
                onSaveCase={saveCase}
                onSavePokemonPrices={savePokemonPrices}
                onUpdateUser={updateUserAccount}
                users={users}
              />
            ) : null}
            {route.page === "register" ? (
              <RegisterPage currentUser={currentUser} onRegister={registerUser} />
            ) : null}
            {route.page === "login" ? (
              <LoginPage currentUser={currentUser} onLogin={loginUser} />
            ) : null}
          </main>
        </React.Suspense>
      </div>
    </div>
  );
}
