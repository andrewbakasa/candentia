"use client";

import { AuditLog } from "@prisma/client";
import { ActivityIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { ActivityItem } from "@/components/activity-item";

interface ActivityProps {
  items: AuditLog[];
};

export const Activity = ({
  items,
}: ActivityProps) => {
  return (
    <div className="flex items-start gap-x-3 w-full">
      <ActivityIcon className="h-5 w-5 mt-0.5 text-neutral-700" />
      <div className="w-full">
        <p className="font-semibold text-neutral-700 mb-2">
          Activity
        </p>
        <ol className="max-h-[190px] overflow-y-scroll mt-2 space-y-4">
          {items && items?.map((item) => (
            <ActivityItem
              key={item.id}
              data={item}
            />
          ))}
        </ol>
      </div>
    </div>
  );
};

// Activity.Skeleton = function ActivitySkeleton() {
//   return (
//     <div className="flex items-start gap-x-3 w-full">
//       <Skeleton className="h-6 w-6 bg-neutral-200" />
//       <div className="w-full">
//         <Skeleton className="w-24 h-6 mb-2 bg-neutral-200" />
//         <Skeleton className="w-full h-10 bg-neutral-200" />
//       </div>
//     </div>
//   );
// };

Activity.Skeleton = function ActivitySkeleton() {
    return (
      <div className="flex items-start gap-x-3 w-full">
        <Skeleton className="h-5 w-5 mt-0.5 text-neutral-200" /> {/* Icon Skeleton */}
        <div className="w-full">
          <Skeleton className="w-24 h-6 mb-2 bg-neutral-200" /> {/* Title Skeleton */}
          <ol className="max-h-[190px] overflow-y-scroll mt-2 space-y-4">
            {/* Skeleton for each ActivityItem (repeat as needed) */}
            <li className="flex gap-x-2"> {/* Mimic ActivityItem layout */}
                  <Skeleton className="h-8 w-8 rounded-full bg-neutral-200" /> {/* Avatar Placeholder */}
                  <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 bg-neutral-200 mb-1" /> {/* Description Placeholder */}
                      <Skeleton className="h-3 w-1/2 bg-neutral-200" /> {/* Timestamp Placeholder */}
                  </div>
              </li>
              <li className="flex gap-x-2"> {/* Mimic ActivityItem layout */}
                  <Skeleton className="h-8 w-8 rounded-full bg-neutral-200" /> {/* Avatar Placeholder */}
                  <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 bg-neutral-200 mb-1" /> {/* Description Placeholder */}
                      <Skeleton className="h-3 w-1/2 bg-neutral-200" /> {/* Timestamp Placeholder */}
                  </div>
              </li>
              <li className="flex gap-x-2"> {/* Mimic ActivityItem layout */}
                  <Skeleton className="h-8 w-8 rounded-full bg-neutral-200" /> {/* Avatar Placeholder */}
                  <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 bg-neutral-200 mb-1" /> {/* Description Placeholder */}
                      <Skeleton className="h-3 w-1/2 bg-neutral-200" /> {/* Timestamp Placeholder */}
                  </div>
              </li>
          </ol>
        </div>
      </div>
    );
  };
