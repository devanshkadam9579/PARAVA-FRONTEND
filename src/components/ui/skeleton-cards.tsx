import React from 'react';

/**
 * Base Shimmer Box
 */
export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200/80 rounded-2xl ${className}`} />
  );
}

/**
 * Vendor Card Skeleton (Exact 4:3 ratio matching AirbnbVendorCard)
 */
export function VendorCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col space-y-3 shrink-0 w-[260px] sm:w-[280px] md:w-[300px] lg:w-auto select-none ${className}`}>
      {/* 4:3 Aspect Ratio Photo Skeleton */}
      <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-gray-200/80 animate-pulse shadow-xs" />

      {/* Details info skeleton */}
      <div className="flex flex-col space-y-2 pt-1">
        <div className="flex items-center justify-between gap-2">
          <SkeletonBox className="h-4 w-3/5 rounded-md" />
          <SkeletonBox className="h-4 w-1/5 rounded-md" />
        </div>
        <SkeletonBox className="h-3 w-1/2 rounded-md" />
        <SkeletonBox className="h-4 w-2/5 rounded-md pt-0.5" />
      </div>
    </div>
  );
}

/**
 * Category Card Skeleton (Large image category)
 */
export function CategoryCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 shrink-0 w-[180px] sm:w-[200px] p-3 rounded-2xl border border-gray-100 bg-white select-none ${className}`}>
      <div className="w-full aspect-4/3 rounded-xl bg-gray-200/80 animate-pulse" />
      <SkeletonBox className="h-3.5 w-3/4 rounded-md mt-1" />
      <SkeletonBox className="h-2.5 w-1/2 rounded-md" />
    </div>
  );
}

/**
 * Service Package Card Skeleton
 */
export function ServiceCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 rounded-3xl border border-gray-100 bg-white flex flex-col sm:flex-row gap-4 select-none ${className}`}>
      <div className="w-full sm:w-32 aspect-4/3 sm:aspect-square rounded-2xl bg-gray-200/80 animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1.5">
          <SkeletonBox className="h-4 w-4/5 rounded-md" />
          <SkeletonBox className="h-3 w-full rounded-md" />
          <SkeletonBox className="h-3 w-2/3 rounded-md" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <SkeletonBox className="h-5 w-1/3 rounded-md" />
          <SkeletonBox className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Vendor Grid Skeleton (for loading marketplace feed)
 */
export function VendorGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
      {Array.from({ length: count }).map((_, idx) => (
        <VendorCardSkeleton key={idx} />
      ))}
    </div>
  );
}

/**
 * Vendor Detail View Skeleton
 */
export function VendorDetailSkeleton() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 py-6 space-y-8 animate-pulse">
      {/* Title Bar Skeleton */}
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-1/3 rounded-lg" />
        <SkeletonBox className="h-4 w-1/4 rounded-md" />
      </div>

      {/* 5-Photo Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[380px] sm:h-[480px] rounded-3xl overflow-hidden">
        <div className="md:col-span-2 h-full bg-gray-200" />
        <div className="hidden md:grid grid-cols-2 col-span-2 gap-2 h-full">
          <div className="bg-gray-200" />
          <div className="bg-gray-200" />
          <div className="bg-gray-200" />
          <div className="bg-gray-200" />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
        <div className="lg:col-span-7 space-y-6">
          <SkeletonBox className="h-24 w-full rounded-2xl" />
          <SkeletonBox className="h-40 w-full rounded-2xl" />
          <SkeletonBox className="h-64 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-5">
          <SkeletonBox className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
