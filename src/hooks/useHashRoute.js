import { useEffect, useMemo, useState } from "react";

const routes = new Set([
  "admin",
  "battles",
  "cases",
  "inventar",
  "login",
  "pokemon",
  "register",
]);

function readRoute() {
  const hash = window.location.hash.replace("#", "");
  if (hash.startsWith("case/")) {
    return {
      caseId: hash.replace("case/", ""),
      pokemonId: null,
      page: "cases",
    };
  }

  if (hash.startsWith("pokemon/")) {
    return {
      caseId: null,
      pokemonId: hash.replace("pokemon/", ""),
      page: "pokemon",
    };
  }

  return {
    caseId: null,
    pokemonId: null,
    page: routes.has(hash) ? hash : "cases",
  };
}

export function useHashRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    function handleHashChange() {
      setRoute(readRoute());
    }

    const hash = window.location.hash.replace("#", "");
    if (
      !routes.has(hash) &&
      !hash.startsWith("case/") &&
      !hash.startsWith("pokemon/")
    ) {
      window.history.replaceState(null, "", "#cases");
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return useMemo(() => route, [route]);
}
