// ─── Prisma-backed Reviews repository (SERVER ONLY) ─────────────
// Buyer reviews of brokers across three dimensions. Writing is gated to users
// who have a confirmed viewing with the broker (an actual interaction).
import type { Review as DbReview } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { BrokerReviewsBundle, Review } from "@/lib/types";

function toReview(r: DbReview): Review {
  return {
    id: r.id,
    brokerId: r.brokerId,
    brokerEmail: r.brokerEmail,
    reviewerId: r.reviewerId,
    reviewerName: r.reviewerName,
    reviewerEmail: r.reviewerEmail,
    communication: r.communication,
    knowledge: r.knowledge,
    honesty: r.honesty,
    overall: r.overall,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getBrokerReviews(brokerId: string, viewerId?: string): Promise<BrokerReviewsBundle> {
  const rows = await prisma.review.findMany({ where: { brokerId }, orderBy: { createdAt: "desc" } });
  const reviews = rows.map(toReview);
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.overall, 0) / count) * 10) / 10 : 0;
  const myReview = viewerId ? reviews.find((r) => r.reviewerId === viewerId) ?? null : null;
  let canReview = false;
  if (viewerId && viewerId !== brokerId) {
    const confirmed = await prisma.viewing.findFirst({
      where: { requesterId: viewerId, ownerId: brokerId, status: "confirmed" },
    });
    canReview = !!confirmed;
  }
  return { average, count, reviews, canReview, myReview };
}

export type ReviewInput = {
  brokerId: string;
  brokerEmail: string;
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
  communication: number;
  knowledge: number;
  honesty: number;
  comment: string;
};

export async function upsertReview(input: ReviewInput): Promise<Review> {
  const overall = Math.round(((input.communication + input.knowledge + input.honesty) / 3) * 10) / 10;
  const row = await prisma.review.upsert({
    where: { brokerId_reviewerId: { brokerId: input.brokerId, reviewerId: input.reviewerId } },
    create: { ...input, overall },
    update: {
      communication: input.communication,
      knowledge: input.knowledge,
      honesty: input.honesty,
      comment: input.comment,
      overall,
    },
  });
  return toReview(row);
}
