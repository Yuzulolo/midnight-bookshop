import type { Metadata } from "next";
import Link from "next/link";
import { BookshopPage } from "@/components/BookshopPage";

export const metadata: Metadata = {
  title: "Payment processing",
};

// Deliberately does not touch the order: reaching this page is not proof of payment.
// The order is marked paid only when Stripe's verified webhook arrives.
export default function OrderSuccessPage() {
  return (
    <BookshopPage
      title="Thanks for your order!"
      eyebrow="Your next chapter"
      compact
    >
      <p className="bookshop-page-copy">
        Your payment is being processed. Your order will be confirmed as soon as
        Stripe confirms the payment.
      </p>
      <Link href="/" className="bookshop-button bookshop-return">
        Back to books
      </Link>
    </BookshopPage>
  );
}
