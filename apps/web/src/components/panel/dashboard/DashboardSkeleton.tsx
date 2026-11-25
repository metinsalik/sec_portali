import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 pb-10">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-3.5 w-80 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="p-3 rounded-lg border border-border bg-card flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-52 rounded-lg flex-1 min-w-[200px]" />
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      {/* Main KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-lg border-border shadow-xs">
            <CardContent className="p-3.5 space-y-2">
              <div className="flex justify-between items-center">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-3 w-32 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource Gaps Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-lg border-border shadow-xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-6 w-14 rounded-md" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-3 w-36 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Chart and Financial Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-3 rounded-lg border-border shadow-xs">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44 rounded-md" />
                <Skeleton className="h-3 w-64 rounded-md" />
              </div>
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <Skeleton className="h-[240px] w-full rounded-lg" />
          </CardContent>
        </Card>

        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-lg border-border shadow-xs">
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-28 rounded-md" />
                  <Skeleton className="h-5 w-32 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-3 w-44 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
