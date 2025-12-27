import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Epic Spot", "Hike", "Campground", "Freedom Camping"]),
  coordinates: z.object({
    lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
    lon: z
      .number()
      .min(-180)
      .max(180, "Longitude must be between -180 and 180"),
  }),
  description: z.string().optional(),
  images: z
    .array(z.string().url("Must be a valid image URL"))
    .nonempty("At least one image is required"),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
