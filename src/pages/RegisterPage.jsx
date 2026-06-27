import React from "react";
import { RegistrationPanel } from "../components/RegistrationPanel.jsx";

export function RegisterPage({ currentUser, onRegister }) {
  return (
    <section className="register-page">
      <div className="register-page__panel">
        <RegistrationPanel currentUser={currentUser} onRegister={onRegister} />
      </div>
    </section>
  );
}
