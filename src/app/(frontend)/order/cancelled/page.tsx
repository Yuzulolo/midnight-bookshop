import type { Metadata } from "next";
import Link from "next/link";
import { BookshopPage } from "@/components/BookshopPage";

export const metadata: Metadata = {
  title: "Checkout cancelled",
};

export default function OrderCancelledPage() {
  return (
    <BookshopPage
      title="Checkout cancelled"
      eyebrow="The story can wait"
      compact
    >
      <p className="bookshop-page-copy">
        No payment was taken. You can try again whenever you like.
      </p>
      <Link href="/" className="bookshop-button bookshop-return">
        Back to books
      </Link>
    </BookshopPage>
  );
}
