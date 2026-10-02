"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import type { Book, Media } from "@/payload-types";
import { LibraryScene, type Place } from "./LibraryScene";
import { ShopOwnerChat } from "./ShopOwnerChat";

export type LibraryBook = Pick<
  Book,
  | "id"
  | "title"
  | "author"
  | "price"
  | "listingType"
  | "coverColor"
  | "coverPhoto"
  | "description"
  | "condition"
>;
const rooms: { id: Place; label: string; mark: string }[] = [
  { id: "hall", label: "Shop floor", mark: "01" },
  { id: "shelves", label: "West stacks", mark: "02" },
  { id: "stairs", label: "Spiral staircase", mark: "03" },
  { id: "gallery", label: "Upper gallery", mark: "04" },
];

export function MidnightLibrary({
  books,
  checkoutError,
}: {
  books: LibraryBook[];
  checkoutError?: string;
}) {
  const [ownerChatOpen, setOwnerChatOpen] = useState(true);
  const [failed, setFailed] = useState(false);
  const [place, setPlace] = useState<Place>("hall");
  const [panel, setPanel] = useState<"catalogue" | "map" | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LibraryBook | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const catalogueButton = useRef<HTMLButtonElement>(null);
  const selectedFrom = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (selected) closeButton.current?.focus();
  }, [selected]);
  function openBook(book: LibraryBook) {
    selectedFrom.current = document.activeElement as HTMLElement;
    setSelected(book);
  }
  function closeBook() {
    setSelected(null);
    selectedFrom.current?.focus();
  }
  const filtered = books.filter((book) =>
    `${book.title} ${book.author}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className="midnight-library midnight-bookshop">
      <LibraryScene
        place={place}
        count={books.length}
        onBook={(index) => openBook(books[index])}
        onOwner={() => setOwnerChatOpen(true)}
        onError={() => {
          setFailed(true);
          setPanel("catalogue");
        }}
      />
      <div className="paper-grain" aria-hidden="true" />
      <div className="library-vignette" aria-hidden="true" />
      <header className="library-header">
        <Link className="library-brand" href="/" aria-label="Bookit home">
          BOOKIT<span>──── ✥ ────</span>
        </Link>
        <div className="header-actions">
          <Link href="/submit" className="submit-link">
            List a book
          </Link>
          <button
            ref={catalogueButton}
            className="search-trigger"
            onClick={() => {
              setPanel(panel === "catalogue" ? null : "catalogue");
            }}
            aria-expanded={panel === "catalogue"}
          >
            <span aria-hidden="true">⌕</span> Find a book{" "}
            <span className="key-hint">↗</span>
          </button>
        </div>
      </header>
      <ShopOwnerChat
        onBook={openBook}
        open={ownerChatOpen}
        setOpen={setOwnerChatOpen}
      />
      {checkoutError && (
        <div className="checkout-error" role="alert">
          {checkoutError}
        </div>
      )}
      {failed && (
        <p className="webgl-message" role="status">
          The 3D bookshop is unavailable on this device. Every book is still
          accessible in the catalogue.
        </p>
      )}
      <footer className="library-footer">
        <div className="room-caption">
          <h1>The Midnight Bookshop</h1>
          <span className="ornament">──── ✥ ────</span>
          <p>
            {place === "gallery" ? "Floor 02" : "Floor 01"}{" "}
            <span> / {rooms.find((room) => room.id === place)?.label}</span>
          </p>
        </div>
        <div className="explore-controls">
          <p>Drag to look · Select a spine to discover</p>
          <nav aria-label="Explore the bookshop">
            {rooms.map((room) => (
              <button
                key={room.id}
                aria-current={place === room.id ? "location" : undefined}
                onClick={() => setPlace(room.id)}
              >
                {room.label}
              </button>
            ))}
          </nav>
        </div>
        <button
          className="map-trigger"
          aria-label="Open room map"
          aria-expanded={panel === "map"}
          onClick={() => {
            setPanel(panel === "map" ? null : "map");
          }}
        >
          <svg
            width="27"
            height="27"
            viewBox="0 0 28 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            aria-hidden="true"
          >
            <path d="M3 7l7-3 8 3 7-3v18l-7 3-8-3-7 3V7zM10 4v18M18 7v18" />
          </svg>
        </button>
      </footer>
      {panel && (
        <aside
          className="library-panel"
          aria-label={panel === "map" ? "Room navigation" : "Book catalogue"}
        >
          <button
            className="panel-close"
            aria-label="Close panel"
            onClick={() => {
              setPanel(null);
              catalogueButton.current?.focus();
            }}
          >
            ×
          </button>
          <p className="eyebrow">
            {panel === "map" ? "Find your way" : "The collection"}
          </p>
          <h2>
            {panel === "map"
              ? "The shop, floor by floor"
              : "Stories on the shelves"}
          </h2>
          {panel === "map" ? (
            <>
              <div className="room-map" aria-hidden="true">
                <span>Ⅱ · Upper gallery</span>
                <i>↗</i>
                <span>Ⅰ · Shop floor</span>
              </div>
              <p className="panel-copy">
                One room. Two floors. A thousand possible beginnings.
              </p>
              <nav className="map-nav" aria-label="Room destinations">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => {
                      setPlace(room.id);
                      setPanel(null);
                    }}
                  >
                    <span>{room.mark}</span>
                    {room.label}
                    <span>↗</span>
                  </button>
                ))}
              </nav>
            </>
          ) : (
            <>
              <label className="catalogue-search">
                Search title or author
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What are you looking for?"
                />
              </label>
              <p className="result-count" aria-live="polite">
                {filtered.length} {filtered.length === 1 ? "book" : "books"}{" "}
                waiting to be found
              </p>
              {!filtered.length && (
                <p className="panel-copy">
                  {books.length
                    ? "No books match your search. Try another title or author."
                    : "The shelves are waiting for their first approved book."}
                </p>
              )}
              <ul className="catalogue-list">
                {filtered.map((book) => (
                  <li key={book.id}>
                    <button onClick={() => openBook(book)}>
                      <span className="catalogue-spine" aria-hidden="true">
                        ✥
                      </span>
                      <span>
                        <strong>{book.title}</strong>
                        <small>{book.author}</small>
                      </span>
                      <span>↗</span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link className="catalogue-submit" href="/submit">
                Add your story to the shelves ↗
              </Link>
            </>
          )}
        </aside>
      )}
      {selected && (
        <div className="book-backdrop" onClick={closeBook}>
          <section
            className="book-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeBook();
              if (e.key === "Tab") {
                const nodes = e.currentTarget.querySelectorAll<HTMLElement>(
                  'button, a[href], input:not([type="hidden"])',
                );
                const first = nodes[0],
                  last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              ref={closeButton}
              className="panel-close"
              aria-label="Close book details"
              onClick={closeBook}
            >
              ×
            </button>
            <div className="selected-cover">
              {typeof selected.coverPhoto === "object" &&
              (selected.coverPhoto as Media)?.url ? (
                <Image
                  src={(selected.coverPhoto as Media).url!}
                  alt={(selected.coverPhoto as Media).alt || selected.title}
                  width={300}
                  height={450}
                />
              ) : (
                <BookCover
                  title={selected.title}
                  author={selected.author}
                  color={selected.coverColor}
                />
              )}
            </div>
            <div className="book-information">
              <p className="eyebrow">Found in the Midnight Bookshop</p>
              <h2 id="book-title">{selected.title}</h2>
              <p className="book-author">{selected.author}</p>
              <p>{selected.description}</p>
              <p className="book-condition">
                Condition · {selected.condition.replace("-", " ")}
              </p>
              <p className="book-price">
                {selected.listingType === "exchange"
                  ? "For exchange"
                  : `${selected.listingType === "rent" ? "For rent" : "For sale"} · €${selected.price?.toFixed(2)}`}
              </p>
              {selected.listingType === "exchange" ? (
                <p>Exchange listings aren’t active yet.</p>
              ) : (
                <form action="/api/checkout" method="post">
                  <input type="hidden" name="bookId" value={selected.id} />
                  <button className="enter-button" type="submit">
                    {selected.listingType === "rent"
                      ? "Rent this book"
                      : "Make it yours"}{" "}
                    ↗
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
