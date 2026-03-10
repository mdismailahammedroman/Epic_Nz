import z from "zod";
import {
  CategoryEnum,
  IAnimalClearance,
  INetworkQuality,
  IWaterTheaterType,
} from "./location.interface";

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
      .min(5, "Description must be at least 5 characters long")
      .optional(),

    // Water Theater Type
    watererType: z.enum(IWaterTheaterType, {
      message: "Valid WaterTheaterType is required",
    }),

    // Animal Clearance
    animalClearance: z.enum(IAnimalClearance, {
      message: "Valid Animal Clearance is required",
    }),

    // Network Quality
    networkQuality: z.enum(INetworkQuality, {
      message: "Valid Network Quality is required",
    }),
  }),
});

const updateLocationValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters long")
      .optional(),

    latitude: z.coerce
      .number()
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .optional(),

    longitude: z.coerce
      .number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .optional(),

    category: z.nativeEnum(CategoryEnum).optional(),

    description: z
      .string()
      .min(5, "Description must be at least 5 characters long")
      .optional(),

    watererType: z.nativeEnum(IWaterTheaterType).optional(),

    animalClearance: z.nativeEnum(IAnimalClearance).optional(),

    networkQuality: z.nativeEnum(INetworkQuality).optional(),
  }),
});
export const LocationValidation = {
  createLocationValidationSchema,
  updateLocationValidationSchema,
};
