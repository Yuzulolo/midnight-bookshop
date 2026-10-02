"use client";

import { useState } from "react";

import { BookCover } from "@/components/BookCover";
import {
  type CoverColor,
  coverColors,
  defaultCoverColor,
} from "@/lib/coverColors";

type ListingType = "sell" | "rent" | "exchange";

const inputClass = "bookshop-input";

export function SubmitBookForm() {
  const [listingType, setListingType] = useState<ListingType>("sell");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverColor, setCoverColor] = useState<CoverColor>(defaultCoverColor);
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError(null);

    const response = await fetch("/api/book-submissions", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });

    if (response.ok) {
      setState("done");
      return;
    }

    const body = await response.json().catch(() => null);
    setError(body?.error ?? "Something went wrong. Please try again.");
    setState("idle");
  }

  if (state === "done") {
    return (
      <p className="bookshop-notice bookshop-notice--success">
        Thanks! Your book has been submitted and is waiting for review.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bookshop-form">
      <label>
        Title
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </label>

      <label>
        Author
        <input
          name="author"
          required
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className={inputClass}
        />
      </label>

      <label>
        Listing type
        <select
          name="listingType"
          value={listingType}
          onChange={(e) => setListingType(e.target.value as ListingType)}
          className={inputClass}
        >
          <option value="sell">Sell</option>
          <option value="rent">Rent</option>
          <option value="exchange">Exchange</option>
        </select>
      </label>

      {listingType !== "exchange" && (
        <label>
          Price
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            className={inputClass}
          />
        </label>
      )}

      {listingType === "exchange" && (
        <label>
          What would you like in exchange?
          <input name="desiredExchangeFor" className={inputClass} />
        </label>
      )}

      {listingType !== "sell" && (
        <label>
          Return by
          <input name="returnBy" type="date" className={inputClass} />
        </label>
      )}

      <label>
        Short description
        <textarea
          name="description"
          required
          maxLength={500}
          rows={4}
          className={inputClass}
        />
      </label>

      <label>
        Condition
        <select
          name="condition"
          required
          defaultValue="good"
          className={inputClass}
        >
          <option value="new">New</option>
          <option value="like-new">Like new</option>
          <option value="good">Good</option>
          <option value="worn">Worn</option>
        </select>
      </label>

      <fieldset>
        <legend>Cover colour</legend>
        <p className="text-sm bookshop-field-hint">
          We make the cover for you from the title and author.
        </p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="w-36 shrink-0">
            <BookCover title={title} author={author} color={coverColor} />
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(coverColors).map(
              ([value, { label, background }]) => (
                <label
                  key={value}
                  className="flex cursor-pointer flex-col items-center gap-1 text-xs"
                >
                  <input
                    type="radio"
                    name="coverColor"
                    value={value}
                    checked={coverColor === value}
                    onChange={() => setCoverColor(value as CoverColor)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="h-10 w-10 rounded-full border border-[#998765] ring-offset-2 ring-offset-[#121a27] peer-checked:ring-2 peer-checked:ring-[#c6a465] peer-focus-visible:ring-2 peer-focus-visible:ring-[#e7dfc6]"
                    style={{ backgroundColor: background }}
                  />
                  {label}
                </label>
              ),
            )}
          </div>
        </div>
      </fieldset>

      <label>
        Cover photo <span className="bookshop-field-hint">(optional)</span>
        <span className="block text-sm bookshop-field-hint">
          If you add a photo, it&apos;s shown instead of the generated cover.
        </span>
        <input
          name="coverPhoto"
          type="file"
          accept="image/*"
          className="bookshop-file"
        />
      </label>

      <label>
        Your email
        <input
          name="submitterEmail"
          type="email"
          required
          className={inputClass}
        />
      </label>

      {error && (
        <p className="bookshop-notice bookshop-notice--error">{error}</p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="bookshop-button"
      >
        {state === "submitting" ? "Submitting…" : "Submit book"}
      </button>
    </form>
  );
}
