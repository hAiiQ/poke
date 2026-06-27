import React from "react";
import { LoginPanel } from "../components/LoginPanel.jsx";

export function LoginPage({ currentUser, onLogin }) {
  return (
    <section className="register-page">
      <div className="register-page__panel">
        <LoginPanel currentUser={currentUser} onLogin={onLogin} />
      </div>
    </section>
  );
}
