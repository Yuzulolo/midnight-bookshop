import type { Metadata } from "next";

import { BookshopPage } from "@/components/BookshopPage";

import { SubmitBookForm } from "./SubmitBookForm";

export const metadata: Metadata = {
  title: "Submit a book",
};

export default function SubmitPage() {
  return (
    <BookshopPage
      title="Submit a book"
      eyebrow="A story deserves another reader"
    >
      <p className="bookshop-page-copy">
        Listings are reviewed before they appear on the site.
      </p>
      <SubmitBookForm />
    </BookshopPage>
  );
}
