import { z } from "zod";

export const UpdateUser = z.object({  
  id: z.string(),
  isAdmin: z.optional(
    z.boolean(),
  ),  
  cardReadMode: z.optional(
    z.boolean(),
  ),
  showMobileView: z.optional(
    z.boolean(),
  ),
  showBGImage: z.optional(
    z.boolean(),
  ),
  cardYscroll: z.optional(
    z.boolean(),
  ),
  cardShowTitle: z.optional(
    z.boolean(),
  ),
  notificationToaster: z.optional(
    z.boolean(),
  ),
  togglePendingTasksOrAll: z.optional(
    z.boolean(),
  ),  
  toggleRecentTaskorAll: z.optional(
    z.boolean(),
  ),
  toggleOverdueorAll: z.optional(
    z.boolean(),
  ),  
  toggleInverse: z.optional(
    z.boolean(),
  ),  
  toggleInverseTable: z.optional(
    z.boolean(),
  ),
  emptyListShow: z.optional(
    z.boolean(),
  ),
  
  showMyProjectsOnLoad: z.optional(
    z.boolean(),
  ),
  collapseBoards: z.optional(
    z.boolean(),
  ),
  roles: z.optional(
    z.array(z.string()),
  ), 
  pageSize: z.optional(
    z.coerce.number(),
  ),
  recentDays: z.optional(
    z.coerce.number({
      required_error: "Value is required",
      invalid_type_error: "Value is required",
    }).min(1, {
      message: "Value is is less than 1",
    }).max(365,{
      message: "Value is greater thaan 30",
    }),
  ),
});
