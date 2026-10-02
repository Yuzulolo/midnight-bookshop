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

export function validateDraft(value: unknown): ListingDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Record<string, unknown>;
  for (const key of ["title", "author", "description", "submitterEmail"]) {
    if (typeof draft[key] !== "string" || !draft[key].trim()) return null;
  }
  if (
    (draft.title as string).length > 200 ||
    (draft.author as string).length > 200 ||
    (draft.description as string).length > 500 ||
    (draft.submitterEmail as string).length > 254
  )
    return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.submitterEmail as string))
    return null;
  if (
    !["sell", "rent", "exchange"].includes(draft.listingType as string) ||
    !["new", "like-new", "good", "worn"].includes(draft.condition as string) ||
    !isCoverColor(draft.coverColor)
  )
    return null;
  if (
    draft.listingType !== "exchange" &&
    (typeof draft.price !== "number" ||
      !Number.isFinite(draft.price) ||
      draft.price < 0)
  )
    return null;
  return {
    title: (draft.title as string).trim(),
    author: (draft.author as string).trim(),
    description: (draft.description as string).trim(),
    submitterEmail: (draft.submitterEmail as string).trim(),
    listingType: draft.listingType as ListingDraft["listingType"],
    condition: draft.condition as ListingDraft["condition"],
    coverColor: draft.coverColor,
    ...(draft.listingType === "exchange"
      ? {}
      : { price: draft.price as number }),
  };
}
