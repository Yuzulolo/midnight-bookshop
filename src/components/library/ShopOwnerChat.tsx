"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { coverColors } from "@/lib/coverColors";
import {
  validateDraft,
  type ChatMessage,
  type ListingDraft,
} from "@/lib/bookshopChat";
import type { LibraryBook } from "./MidnightLibrary";

const greeting: ChatMessage = {
  role: "assistant",
  content: "What brings you to the Midnight Bookshop?",
};
export function ShopOwnerChat({
  onBook,
  open,
  setOpen,
}: {
  onBook: (book: LibraryBook) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<LibraryBook[]>([]);
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => abort.current?.abort(), []);
  async function send(text: string) {
    if (busy || submitting || !text.trim()) return;
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: text.trim() },
    ];
    if (next.length > 30) {
      setError(
        "This conversation is full. Start a new conversation to continue.",
      );
      return;
    }
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    setDraft(null);
    setMatches([]);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.error || "The owner could not answer. Please try again.",
        );
      if (typeof body.message !== "string")
        throw new Error("The owner’s reply was lost. Please try again.");
      setMessages([...next, { role: "assistant", content: body.message }]);
      setMatches(Array.isArray(body.books) ? body.books : []);
      setDraft(validateDraft(body.draft));
    } catch (err) {
      if (!controller.signal.aborted) {
        setMessages(messages);
        setInput(text);
        setError(
          err instanceof Error
            ? err.message
            : "Connection lost. Please try again.",
        );
      }
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }
  async function submitListing() {
    if (!draft || submitting) return;
    setSubmitting(true);
    setError("");
    const form = new FormData();
    Object.entries(draft).forEach(([key, value]) =>
      form.set(key, String(value)),
    );
    try {
      const response = await fetch("/api/book-submissions", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Your listing could not be submitted.");
      setDraft(null);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Your book has been submitted for review. Once approved, it will take its place on our shelves. Thank you for leaving a story with us.",
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit your book. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  const reply =
    [...messages].reverse().find((message) => message.role === "assistant")
      ?.content ?? greeting.content;
  return (
    <div
      className={`shop-owner-chat game-conversation ${open ? "is-open" : ""}`}
    >
      {!open ? (
        <button className="owner-chat-trigger" onClick={() => setOpen(true)}>
          ☾ Talk to the owner <span>↗</span>
        </button>
      ) : (
        <section
          aria-label="Conversation with the shop owner"
          className="game-dialogue-window"
        >
          <button
            className="game-dialogue-close"
            aria-label="Close dialogue"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
          <div className="game-dialogue-stage">
            <Image
              className="game-owner-portrait"
              src="/shop-owner-face.svg"
              width={72}
              height={88}
              alt="The shop owner"
            />
            <div className="game-dialogue-content">
              <p className="eyebrow">The shop owner</p>
              {busy ? (
                <p className="owner-thinking" role="status">
                  The owner considers your words…
                </p>
              ) : (
                <p className="game-dialogue-text" role="status">
                  {reply}
                </p>
              )}
              {!busy && !draft && (
                <nav
                  className="game-dialogue-choices"
                  aria-label="Choose your intention"
                >
                  <button
                    disabled={submitting}
                    onClick={() => send("Help me find a book.")}
                  >
                    Find a book <span>↗</span>
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => send("I would like to list a book.")}
                  >
                    List my book <span>↗</span>
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => send("How does the bookshop work?")}
                  >
                    How it works <span>↗</span>
                  </button>
                </nav>
              )}
            </div>
          </div>
          <div className="game-dialogue-details">
            {matches.length > 0 && (
              <ul className="chat-matches">
                {matches.map((book) => (
                  <li key={book.id}>
                    <button onClick={() => onBook(book)}>
                      <strong>{book.title}</strong>
                      <small>
                        {book.author} ·{" "}
                        {book.listingType === "exchange"
                          ? "For exchange"
                          : `${book.listingType === "rent" ? "Rent" : "Buy"} · €${book.price?.toFixed(2)}`}
                      </small>
                      <span>View book ↗</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {draft && (
              <section
                className="listing-review"
                aria-label="Review your listing"
              >
                <h3>Your book, before it joins us</h3>
                <dl>
                  <dt>Title</dt>
                  <dd>{draft.title}</dd>
                  <dt>Author</dt>
                  <dd>{draft.author}</dd>
                  <dt>Listing</dt>
                  <dd>
                    {draft.listingType}
                    {draft.price !== undefined
                      ? ` · €${draft.price.toFixed(2)}`
                      : ""}
                  </dd>
                  <dt>Condition</dt>
                  <dd>{draft.condition.replace("-", " ")}</dd>
                  <dt>Cover</dt>
                  <dd>{coverColors[draft.coverColor].label}</dd>
                  <dt>Email</dt>
                  <dd>{draft.submitterEmail}</dd>
                  <dt>Description</dt>
                  <dd>{draft.description}</dd>
                </dl>
                <p>Submitted books await approval.</p>
                <button
                  className="enter-button"
                  disabled={submitting}
                  onClick={submitListing}
                >
                  {submitting ? "Submitting…" : "Submit for review"} ↗
                </button>
                <button
                  className="edit-listing"
                  disabled={submitting}
                  onClick={() => {
                    setDraft(null);
                    setInput("I would like to change ");
                    inputRef.current?.focus();
                  }}
                >
                  Change details
                </button>
              </section>
            )}
            {error && (
              <div className="chat-error" role="alert">
                <p>{error}</p>
                <Link href="/submit">Use the listing form ↗</Link>
              </div>
            )}
          </div>
          {!busy && (
            <form
              className="owner-chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <label className="sr-only" htmlFor="owner-message">
                Message the shop owner
              </label>
              <input
                ref={inputRef}
                id="owner-message"
                value={input}
                maxLength={3000}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me what you seek…"
                disabled={busy || submitting}
              />
              <button
                type="submit"
                disabled={busy || submitting || !input.trim()}
                aria-label="Send message"
              >
                ↑
              </button>
            </form>
          )}
          <div className="chat-footnote">
            <span>AI shop owner · Replies via OpenRouter</span>
            <button
              disabled={busy || submitting}
              onClick={() => {
                setMessages([greeting]);
                setDraft(null);
                setMatches([]);
                setError("");
                setInput("");
              }}
            >
              Start again
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
