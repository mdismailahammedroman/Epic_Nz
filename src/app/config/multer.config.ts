/* eslint-disable no-useless-escape */
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: {
    public_id: (req: any, file: Express.Multer.File) => {
      const fileName = file.originalname
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/\./g, "-")
        .replace(/[^a-z0-9\-\.]/g, ""); // Sanitizing file name

      // Creating a unique file name with random string + timestamp
      const uniqueFileName =
        Math.random().toString(15).substring(2) +
        "-" +
        Date.now() +
        "-" +
        fileName;

      return uniqueFileName; // Return unique name for Cloudinary upload
    },
  },
});

export const multerUpload = multer({ storage: storage });
