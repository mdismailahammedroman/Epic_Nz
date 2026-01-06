/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config"; // Ensure Cloudinary config is correct

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload, // This should be the instance of Cloudinary
  params: {
    public_id: (req: any, file: Express.Multer.File) => {
      const fileName = file.originalname
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/\./g, "-")
        .replace(/[^a-z0-9\-\.]/g, "");
      return `${Math.random()
        .toString(15)
        .substring(2)}-${Date.now()}-${fileName}`;
    },
  },
});

export const multerUpload = multer({ storage }); // Ensure multer is configured to use Cloudinary storage
