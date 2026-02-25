/* eslint-disable @typescript-eslint/no-explicit-any */
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: async (_req: any, file: Express.Multer.File) => {
    const sanitizedName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-.]/g, "");

    const uniqueFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${sanitizedName}`;

    return {
      folder: "uploads",
      public_id: uniqueFileName,
      resource_type: "image",
      type: "upload",          // ✅ CRITICAL FIX
      access_mode: "public",   // ✅ CRITICAL FIX
      format: "webp",
      transformation: [{ quality: "auto" }],
    };
  },
});

export const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 5MB
  },
});
