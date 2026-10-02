import config from "@payload-config";
import { connection } from "next/server";
import { getPayload } from "payload";

import { MidnightLibrary } from "@/components/library/MidnightLibrary";

export default async function Home({ searchParams }: PageProps<"/">) {
  // Render per request so newly approved books appear without a redeploy.
  await connection();
  const { checkoutError } = await searchParams;

  const payload = await getPayload({ config });
  const { docs: books } = await payload.find({
    collection: "books",
    // Enforce the collection's public read rule, not just this filter.
    overrideAccess: false,
    where: { status: { equals: "approved" } },
    select: {
      title: true,
      author: true,
      price: true,
      listingType: true,
      coverPhoto: true,
      coverColor: true,
      description: true,
      condition: true,
    },
    depth: 1,
    sort: "-createdAt",
    limit: 100,
  });

  return (
    <MidnightLibrary
      books={books}
      checkoutError={
        typeof checkoutError === "string" ? checkoutError : undefined
      }
    />
  );
}
