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

## How to run locally

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/TuringCollegeSubmissions/yuzeli-AFA.BAI.4.7.git
   cd yuzeli-AFA.BAI.4.7
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
