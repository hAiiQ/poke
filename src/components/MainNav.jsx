import React from "react";
import {
  Backpack,
  BookOpen,
  Box,
  ChevronDown,
  LogIn,
  LogOut,
  Settings2,
  Swords,
  UserPlus,
} from "lucide-react";
import logoImage from "../../pictures/logo.png";
import { formatCurrency } from "../lib/format.js";

const navItems = [
  { label: "Kisten", route: "cases", icon: Box },
  { label: "Battles", route: "battles", icon: Swords },
  { label: "Inventar", route: "inventar", icon: Backpack },
  { label: "Index", route: "pokemon", icon: BookOpen },
  { label: "Admin", route: "admin", icon: Settings2, adminOnly: true },
];

export function MainNav({ currentRoute, currentUser, isAdmin, onLogout }) {
  return (
    <header className="main-nav">
      <a className="brand" href="#cases" aria-label="PokeCase Startseite">
        <img className="brand__logo" alt="PokeCase" src={logoImage} />
      </a>

      <nav className="main-nav__links" aria-label="Hauptnavigation">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;

            return (
              <a
                className="main-nav__link"
                data-active={isActive ? "true" : "false"}
                href={`#${item.route}`}
                key={item.label}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={2} />
                <span>{item.label}</span>
              </a>
            );
          })}
      </nav>

      <div className="main-nav__actions">
        <button className="language-button" type="button" aria-label="Sprache">
          DE
          <ChevronDown aria-hidden="true" size={16} strokeWidth={2} />
        </button>
        {currentUser ? (
          <button className="account-button" type="button" onClick={onLogout}>
            <span className="account-button__name">{currentUser.username}</span>
            <span className="account-button__stats">
              Lvl {currentUser.level} | {currentUser.xp} XP |{" "}
              {formatCurrency(currentUser.balance ?? 0)} C
            </span>
            <LogOut aria-hidden="true" size={18} strokeWidth={2} />
          </button>
        ) : (
          <div className="auth-actions">
            <a className="secondary-link-button" href="#login">
              <LogIn aria-hidden="true" size={18} strokeWidth={2} />
              Anmelden
            </a>
            <a className="secondary-link-button" href="#register">
              <UserPlus aria-hidden="true" size={18} strokeWidth={2} />
              Registrieren
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
