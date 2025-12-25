import { z } from "zod";
import { Role } from "./user.interface";

export const createUserZodSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    address: z.string().optional(),
    role: z.nativeEnum(Role).optional(),

    // profileImage comes from multer → optional
    profileImage: z.string().optional(),
  }),
});

export const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    profileImage: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
  }),
});
export const passwordZodSchema = z.object({
  newPassword: z
    .string({ error: "Password shuld be string type!" })
    .min(6, "Password length shuld be at least 6!")
    .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/, {
      message:
        "Password must be at least 1 uppercase character, 1 special character, 1 number!",
    }),
});
