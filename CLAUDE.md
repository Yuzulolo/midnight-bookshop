# The Midnight Bookshop

A secondhand book marketplace for people in Berlin/Germany, built with Next.js, 
Payload CMS, and Stripe Checkout.

## What this is
Visitors browse secondhand books and buy or rent them through Stripe Checkout 
(sandbox mode). Anyone can submit a book they want to sell, rent, or offer for 
exchange through a chat interface with the shop owner or a direct submission form. 
Submissions land as "pending" and are only published when the shop owner approves 
them through the Payload admin panel.

## Two required halves
- **CMS**: A Payload Books collection (title, author, price, condition, listing type, 
  description, cover photo/generated cover). Anyone can view approved books. Only a 
  logged-in admin can create, edit, delete, or approve/publish submissions.
- **Payments**: Stripe hosted Checkout in sandbox mode. An order is marked paid only 
  when Stripe's webhook confirms payment server-side — never just because the buyer 
  reached the thank-you page.

## Optional tasks completed
- **Orders collection in Payload** (medium): paid orders are recorded and visible in 
  the admin panel, written only when the webhook confirms payment.

## Future scope (not built in this sprint)
- Peer-to-peer exchange: users propose trades from their own collections, with an 
  offer/accept/decline flow and return-date tracking
- 3D bookshop walkthrough: navigate the shop with arrow keys, browse shelves
- Auto-generated book descriptions via LLM when submitting
- Per-user accounts with owned listings (Stripe Connect for seller payouts)
