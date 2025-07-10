import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Controls Skeleton */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </Card>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32 mb-4" />
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <div className="p-4">
                    <div className="flex gap-3">
                      <Skeleton className="w-16 h-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Map Skeleton */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <Skeleton className="w-full h-full rounded-lg" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}