import config from "@payload-config";
import {
  REST_GET,
  REST_POST,
  REST_PATCH,
  REST_DELETE,
  REST_OPTIONS,
} from "@payloadcms/next/routes";
import { getPayload } from "payload";
import type { Where } from "payload";

const payloadContext = () => ({ params: Promise.resolve({ slug: ["books"] }) });

// The static search route must preserve the CMS collection REST operations.
export const POST = (request: Request) =>
  REST_POST(config)(request, payloadContext());
export const PATCH = (request: Request) =>
  REST_PATCH(config)(request, payloadContext());
export const DELETE = (request: Request) =>
  REST_DELETE(config)(request, payloadContext());
export const OPTIONS = (request: Request) =>
  REST_OPTIONS(config)(request, payloadContext());
// Payload's method factories use the same endpoint dispatcher; it reads the request method.
export const PUT = (request: Request) =>
  REST_PATCH(config)(request, payloadContext());

export async function GET(request: Request) {
  if (!new URL(request.url).searchParams.has("q"))
    return REST_GET(config)(request, payloadContext());
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length > 200)
    return Response.json(
      { error: "Search must be 200 characters or fewer." },
      { status: 400 },
    );
  const where: Where = { status: { equals: "approved" } };
  if (query)
    where.or = [
      { title: { contains: query } },
      { author: { contains: query } },
      { description: { contains: query } },
    ];
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "books",
      overrideAccess: false,
      where,
      depth: 1,
      limit: 20,
      sort: "-createdAt",
      select: {
        title: true,
        author: true,
        description: true,
        condition: true,
        price: true,
        listingType: true,
        coverColor: true,
        coverPhoto: true,
      },
    });
    return Response.json({ docs: result.docs, totalDocs: result.totalDocs });
  } catch {
    return Response.json(
      { error: "The shelves are unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
}
