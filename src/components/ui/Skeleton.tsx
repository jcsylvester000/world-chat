import { cn } from "@/lib/utils";

// Shimmer placeholder for loading states (better perceived speed than a spinner).
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

// A property-card-shaped skeleton for listing grids.
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

// A compact list-row skeleton.
export function ListRowSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-white p-2">
      <Skeleton className="h-16 w-20 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
