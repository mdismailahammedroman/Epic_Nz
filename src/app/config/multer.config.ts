import { CloudinaryStorage } from "multer-storage-cloudinary";

import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config";

// Define Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload, // Using Cloudinary instance from cloudinary.config.ts
  params: {
    public_id: (req: any, file: Express.Multer.File) => {
      // Sanitize file name and make it URL-friendly
      const fileName = file.originalname
        .toLowerCase()
        .replace(/\s+/g, "-") // Replace spaces with dashes
        .replace(/\./g, "-") // Replace dots with dashes
        .replace(/[^a-z0-9\-\.]/g, ""); // Remove special characters

      // Create unique file name with timestamp and random string
      const uniqueFileName =
        Math.random().toString(15).substring(2) +
        "-" +
        Date.now() +
        "-" +
        fileName;

      return uniqueFileName;
    },
  },
});

// Set up Multer to use Cloudinary as the storage provider
export const multerUpload = multer({ storage: storage });
