import { isCoverColor, type CoverColor } from "./coverColors";

export type ListingDraft = {
  title: string;
  author: string;
  listingType: "sell" | "rent" | "exchange";
  price?: number;
  condition: "new" | "like-new" | "good" | "worn";
  coverColor: CoverColor;
  submitterEmail: string;
  description: string;
};
export type ChatMessage = { role: "user" | "assistant"; content: string };

const limits = {
  title: 200,
  author: 200,
  description: 500,
  submitterEmail: 254,
};
// Models often send "Like new", "Navy" or "€12"; normalize those instead of rejecting them.
const keyword = (value: unknown) =>
  typeof value === "string"
    ? value.trim().toLowerCase().replace(/\s+/g, "-")
    : value;
const amount = (value: unknown) =>
  typeof value === "string" &&
  /^\s*€?\s*\d+(\.\d+)?\s*(€|eur|euros?)?\s*$/i.test(value)
    ? Number(value.replace(/[^\d.]/g, ""))
    : value;

export function parseDraft(
  value: unknown,
):
  | { draft: ListingDraft; errors?: never }
  | { draft?: never; errors: string[] } {
  if (!value || typeof value !== "object")
    return { errors: ["No listing details were given."] };
  const input = value as Record<string, unknown>;
  const errors: string[] = [];
  const text: Record<string, string> = {};
  for (const [key, max] of Object.entries(limits)) {
    const field = input[key];
    if (typeof field !== "string" || !field.trim())
      errors.push(`${key} is missing.`);
    else if (field.trim().length > max)
      errors.push(`${key} must be ${max} characters or fewer.`);
    else text[key] = field.trim();
  }
  if (
    text.submitterEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.submitterEmail)
  )
    errors.push("submitterEmail is not a valid email address.");
  const listingType = keyword(input.listingType);
  if (!["sell", "rent", "exchange"].includes(listingType as string))
    errors.push("listingType must be sell, rent or exchange.");
  const condition = keyword(input.condition);
  if (!["new", "like-new", "good", "worn"].includes(condition as string))
    errors.push("condition must be new, like-new, good or worn.");
  const coverColor = keyword(input.coverColor);
  if (!isCoverColor(coverColor))
    errors.push("coverColor is not one of the offered colours.");
  const price = amount(input.price);
  if (
    listingType !== "exchange" &&
    (typeof price !== "number" || !Number.isFinite(price) || price < 0)
  )
    errors.push("price in EUR is required for sell or rent listings.");
  if (errors.length) return { errors };
  return {
    draft: {
      title: text.title,
      author: text.author,
      description: text.description,
      submitterEmail: text.submitterEmail,
      listingType: listingType as ListingDraft["listingType"],
      condition: condition as ListingDraft["condition"],
      coverColor: coverColor as CoverColor,
      ...(listingType === "exchange" ? {} : { price: price as number }),
    },
  };
}

export function validateDraft(value: unknown): ListingDraft | null {
  return parseDraft(value).draft ?? null;
}
