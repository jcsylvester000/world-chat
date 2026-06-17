import type { NearbyResult } from "@/lib/teaser/overpass";

// The full editable state of one Property Teaser (stored as JSON on Neon).
export interface TeaserForm {
  name: string;
  priceNum: string;
  address: string;
  lat: number;
  lng: number;
  hideLocation: boolean;
  description: string;
  lotSize: string;
  floorNotes: string;
  tags: string[];
  photos: string[];
  selectedCats: string[];
  radiusKm: number;
  nearby: NearbyResult | null;
}

export interface TeaserDraft {
  id: string;
  userId: string;
  title: string;
  data: TeaserForm;
  createdAt: string;
  updatedAt: string;
}

export interface TeaserUsage {
  count: number;
  unlimited: boolean;
}

// Plan limits for the Property Teaser. Premium/admin are unlimited.
export const BASIC_TEASER_USE_CAP = 2; // exports a Basic account may make
export const BASIC_TEASER_DRAFT_CAP = 1; // saved drafts a Basic account may keep
