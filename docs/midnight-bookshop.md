# The Midnight Bookshop

The homepage opens directly into the illustrated 3D shop. Drag or focus the canvas and use arrow keys to look around. Room buttons move between the counter, west stacks, stairs and upper gallery. Select a book spine or use the catalogue to open its CMS details and existing checkout. Select the seated shop owner to reopen chat.

## Local chat setup

Add this server-only variable to `.env.local`, then restart `npm run dev`:

```dotenv
OPENROUTER_API_KEY=your_openrouter_key
```

Never use a `NEXT_PUBLIC_` key. The new `POST /api/chat` route calls OpenRouter's chat completions endpoint with `anthropic/claude-haiku-4.5`. The browser sends only user/assistant conversation messages. OpenRouter receives the conversation, including listing details entered into chat. Conversations are kept in browser component state, not written to the CMS.

The owner's `search_books` tool invokes the `GET /api/books?q=...` route handler directly on the server. The route selects public book fields, enforces Payload read access and returns only approved listings. This avoids a deployment-dependent internal HTTP request. Requests without `q` and collection write methods delegate to Payload’s existing REST dispatcher, preserving admin queries, writes and access checks.

The `prepare_listing` tool validates title, author, listing type, price, condition, cover colour, email and description. It returns a review card; it does not write anything. **Submit for review** sends multipart form data to the existing `/api/book-submissions` endpoint, which forces pending status. Exchanges remain inactive for checkout, as before. Uploaded covers still take precedence over generated covers.

Without an API key, chat displays a useful unavailable message and links to the listing form; catalogue search and existing book checkout continue to work. Provider failures retain the visitor's message for retry.

## Verification

```sh
node --test tests/bookshop-chat.test.mjs
npx tsc --noEmit
npm run lint
```

The eight isolated tests exercise public CMS search, role validation, missing configuration, OpenRouter tool round trips, listing preparation/validation and provider errors. They mock CMS/provider boundaries and never create listings, charge Stripe or call a paid model.

Live AI replies require an OpenRouter key. Browser interaction and visual QA require computer-use permission. Keep work on `design/midnight-library`; no production deployment is part of this change.
