import React from "react";
import { LockKeyhole, UserRound } from "lucide-react";
import { formatCurrency } from "../lib/format.js";

export function LoginPanel({ currentUser, onLogin }) {
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState("idle");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = Object.fromEntries(new FormData(form));
    setIsSubmitting(true);
    const result = await onLogin(formData);
    setIsSubmitting(false);
    setStatus(result.ok ? "success" : "error");
    setMessage(result.message);

    if (result.ok) {
      form.reset();
      window.location.hash = "#cases";
    }
  }

  if (currentUser) {
    return (
      <section className="registration-panel account-panel" aria-label="Account">
        <div className="registration-panel__header">
          <h2>{currentUser.username}</h2>
        </div>
        <div className="account-summary">
          <div>
            <span>Level</span>
            <strong>{currentUser.level}</strong>
          </div>
          <div>
            <span>XP</span>
            <strong>{currentUser.xp}</strong>
          </div>
          <div>
            <span>Credits</span>
            <strong>{formatCurrency(currentUser.balance ?? 0)}</strong>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="registration-panel"
      id="login"
      aria-labelledby="login-title"
    >
      <div className="registration-panel__header">
        <h2 id="login-title">Anmelden</h2>
      </div>

      <form className="registration-form" onSubmit={handleSubmit}>
        <label>
          <span>Username</span>
          <div className="input-shell">
            <UserRound aria-hidden="true" size={18} strokeWidth={2} />
            <input
              autoComplete="username"
              name="username"
              placeholder="Trainername"
              type="text"
            />
          </div>
        </label>

        <label>
          <span>Passwort</span>
          <div className="input-shell">
            <LockKeyhole aria-hidden="true" size={18} strokeWidth={2} />
            <input
              autoComplete="current-password"
              name="password"
              placeholder="Passwort"
              type="password"
            />
          </div>
        </label>

        {message ? (
          <p className="form-message" data-status={status}>
            {message}
          </p>
        ) : null}

        <button
          className="primary-button primary-button--full"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Melde an..." : "Anmelden"}
        </button>
      </form>
    </section>
  );
}
