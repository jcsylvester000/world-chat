import Badge from "@/components/ui/Badge";
import { TAG_NAMES, TAG_TONE } from "@/lib/constants";
import { humanizeTag } from "@/lib/utils";
import { HAS_ATS_TAG, type PropertyTag } from "@/lib/types";

function label(tag: string) {
  if (tag === HAS_ATS_TAG) return "✓ Has ATS";
  return TAG_NAMES[tag as PropertyTag] ?? humanizeTag(tag);
}
function tone(tag: string): "neutral" | "blue" | "green" | "amber" | "red" | "violet" {
  if (tag === HAS_ATS_TAG) return "green";
  return TAG_TONE[tag as PropertyTag] ?? "neutral";
}

export default function PropertyTags({ tags, limit }: { tags: string[]; limit?: number }) {
  const shown = limit ? tags.slice(0, limit) : tags;
  const rest = limit ? tags.length - shown.length : 0;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((tag) => (
        <Badge key={tag} tone={tone(tag)}>
          {label(tag)}
        </Badge>
      ))}
      {rest > 0 && <Badge tone="neutral">+{rest}</Badge>}
    </div>
  );
}
