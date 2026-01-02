import z from "zod";
import { CategoryEnum } from "./location.interface";

const createLocationValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        message: "Place name is required",
      })
      .min(3, "Name must be at least 3 characters long"),

    // Coerce converts string " -45.03" -> number -45.03
    latitude: z.coerce
      .number({
        message: "Latitude is required",
      })
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90"),

    longitude: z.coerce
      .number({
        message: "Longitude is required",
      })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),

    category: z.enum(CategoryEnum, {
      message: "Valid category is required",
    }),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters long")
      .optional(),
  }),
});

export const LocationValidation = {
  createLocationValidationSchema,
};
