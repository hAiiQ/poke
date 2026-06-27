import React from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";

const STORAGE_KEY = "pokecase.chat.v1";
const defaultMessages = [
  {
    id: "welcome",
    author: "PokeCase",
    text: "Willkommen im Chat.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "drops",
    author: "System",
    text: "Neue Drops landen hier.",
    createdAt: new Date().toISOString(),
  },
];

export function ChatPanel({ currentUser }) {
  const [messages, setMessages] = React.useState(loadMessages);
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  function handleSubmit(event) {
    event.preventDefault();
    const text = draft.trim();

    if (!text) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        author: currentUser?.username ?? "Gast",
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
  }

  function clearMessages() {
    setMessages(defaultMessages);
  }

  return (
    <aside className="chat-panel" aria-label="Chat">
      <div className="chat-panel__head">
        <div>
          <MessageCircle aria-hidden="true" size={18} strokeWidth={2} />
          <strong>Chat</strong>
        </div>
        <button aria-label="Chat leeren" onClick={clearMessages} title="Chat leeren" type="button">
          <Trash2 aria-hidden="true" size={15} strokeWidth={2} />
        </button>
      </div>

      <div className="chat-panel__messages">
        {messages.slice(-30).map((message) => (
          <article className="chat-message" key={message.id}>
            <div>
              <strong>{message.author}</strong>
              <time dateTime={message.createdAt}>
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <p>{message.text}</p>
          </article>
        ))}
      </div>

      <form className="chat-panel__form" onSubmit={handleSubmit}>
        <input
          aria-label="Chat Nachricht"
          maxLength={140}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={currentUser ? "Nachricht" : "Als Gast schreiben"}
          type="text"
          value={draft}
        />
        <button aria-label="Senden" type="submit">
          <Send aria-hidden="true" size={16} strokeWidth={2} />
        </button>
      </form>
    </aside>
  );
}

function loadMessages() {
  try {
    const rawMessages = window.localStorage.getItem(STORAGE_KEY);
    if (!rawMessages) return defaultMessages;
    const parsedMessages = JSON.parse(rawMessages);

    if (!Array.isArray(parsedMessages)) return defaultMessages;

    return parsedMessages
      .map((message) => ({
        id: message.id ?? crypto.randomUUID(),
        author: String(message.author ?? "Gast").slice(0, 24),
        text: String(message.text ?? "").slice(0, 140),
        createdAt: message.createdAt ?? new Date().toISOString(),
      }))
      .filter((message) => message.text);
  } catch {
    return defaultMessages;
  }
}

function formatMessageTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
