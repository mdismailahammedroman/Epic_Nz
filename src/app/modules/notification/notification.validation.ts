import { z } from "zod";

const updateNotificationPreferencesSchema = z.object({
  body: z.object({
    // ✅ add channel because service checks channel.push
    channel: z
      .object({
        push: z.boolean().optional(),
        email: z.boolean().optional(),
        inApp: z.boolean().optional(),
      })
      .optional(),

    direct_sms: z.boolean().optional(),

    app: z
      .object({
        product_updates: z.boolean().optional(),
        special_offers: z.boolean().optional(),
      })
      .optional(),

    locationItem: z
      .object({
        nearbyAlerts: z.boolean().optional(),
        weatherAlerts: z.boolean().optional(),
        newSpotRecommendations: z.boolean().optional(),
      })
      .optional(),
  }),
});

const pushNotificationSchema = z.object({
  body: z.object({
    tokens: z.array(z.string()).min(1, "At least one token is required"),
    title: z.string().min(1, "Title is required"),
    body: z.string().min(1, "Body is required"),
    // ✅ keep strings (FCM requires string:string for data)
    data: z.record(z.string(), z.string()).optional(),
  }),
});

const notifyNearbyUsersSchema = z.object({
  body: z.object({
    locationId: z.string().min(1, "Location ID is required"),
  }),
});

export const NotificationValidation = {
  updateNotificationPreferencesSchema,
  pushNotificationSchema,
  notifyNearbyUsersSchema,
};
