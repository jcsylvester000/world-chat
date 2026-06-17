// Client-side service for Neon-backed Property Teaser drafts + usage. Talks to
// the /api/teaser/* routes; mirrors the rest of the app's USE_PRISMA pattern.
import { apiGet, apiSend, USE_PRISMA } from "@/lib/api";
import type { TeaserDraft, TeaserForm, TeaserUsage } from "@/lib/teaser/types";

export async function listDrafts(userId: string): Promise<TeaserDraft[]> {
  if (!USE_PRISMA) return [];
  return apiGet<TeaserDraft[]>(`/api/teaser/drafts?userId=${encodeURIComponent(userId)}`);
}

export async function saveDraft(
  userId: string,
  input: { id?: string; title: string; data: TeaserForm }
): Promise<TeaserDraft> {
  return apiSend<TeaserDraft>("/api/teaser/drafts", "POST", { userId, ...input });
}

export async function deleteDraft(userId: string, id: string): Promise<void> {
  await apiSend(`/api/teaser/drafts/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, "DELETE");
}

export async function getUsage(userId: string): Promise<TeaserUsage> {
  if (!USE_PRISMA) return { count: 0, unlimited: true };
  return apiGet<TeaserUsage>(`/api/teaser/usage?userId=${encodeURIComponent(userId)}`);
}

export async function recordUse(userId: string): Promise<TeaserUsage> {
  return apiSend<TeaserUsage>("/api/teaser/usage", "POST", { userId });
}
