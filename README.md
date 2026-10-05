# The Midnight Bookshop

A secondhand book marketplace where visitors can browse, buy, rent, or list books 
for exchange. Built with Next.js, Payload CMS, and Stripe Checkout.

## What the shop sells
Secondhand books — listed for sale, rent, or exchange. Visitors can browse approved 
listings and purchase through Stripe Checkout (sandbox mode). Anyone can submit a 
book to sell, rent, or offer for exchange. Submissions are reviewed and approved by 
the shop owner through the admin panel.

## How the owner edits content
The owner manages all content through the Payload CMS admin panel at `/admin`. From 
there, the owner can:
- Review and approve book submissions (pending → approved), or delete unwanted ones
- Create, edit, or delete book listings directly
- View paid orders
- Upload cover photos (books without photos display a generated cover)

Changes made in the admin panel go live immediately with no redeploy needed.

## Shop owner chat guardrails
Visitors can chat with the shop owner (an LLM via OpenRouter) to find or list books. 
The chat is limited to the bookshop:
- **Topic lock**: the owner only discusses searching for books, listing books for 
  sale/rent/exchange, recommendations, and how the platform works. Anything else 
  (homework, coding, general knowledge, creative writing, personal advice) is politely 
  declined: *"I'm just a humble bookshop owner — I only know about books! How can I 
  help you find or list one?"*
- **No persona overrides**: instructions that try to change the owner's rules or 
  personality are ignored.
- **History limit**: only the last 10 messages are sent to the model.
- **Reply length**: replies are capped at 300 tokens, or 500 when the visitor is 
  listing a book (the listing card needs room for the full details).
- **Friendly errors**: if OpenRouter fails, visitors see *"The shop owner stepped away 
  for a moment, please try again"* instead of the raw error.
- **No side effects**: the owner can only search approved books and prepare a listing 
  for review. It cannot submit, publish, charge, or delete anything; the visitor 
  submits the listing, and it waits for admin approval.

## How to run locally

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/Yuzulolo/midnight-bookshop.git
   cd midnight-bookshop
   npm install
   ```

2. Create `.env.local` with these variables:
   - `DATABASE_URI` — Supabase Postgres connection string (Project Settings → Database → Connection string → Transaction pooler, port 6543)
   - `PAYLOAD_SECRET` — any random string (generate with `openssl rand -base64 32`)
   - `STRIPE_SECRET_KEY` — Stripe test key starting with `sk_test_` (Stripe Dashboard → Developers → API keys)
   - `STRIPE_WEBHOOK_SECRET` — from `stripe listen` (see step 4)
   - `OPENROUTER_API_KEY` — OpenRouter API key for the shop owner chat feature

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. For webhook testing, in a separate terminal:

   ```bash
   stripe listen --all-snapshot --forward-to localhost:3000/api/webhooks/stripe
   ```

5. Open `http://localhost:3000` for the shop, `http://localhost:3000/admin` for the admin panel.

## Optional tasks completed
- **Orders collection in Payload** (medium): each paid order is recorded in an Orders 
  collection visible in the admin panel. Orders are only created by server-side code 
  and marked paid only when the Stripe webhook confirms payment.
