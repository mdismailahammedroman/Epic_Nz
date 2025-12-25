import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config";

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload, // Your Cloudinary configuration
  params: {
    public_id: (req: any, file: Express.Multer.File) => {
      // Sanitizing the filename and making it unique
      const fileName = file.originalname
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/\./g, "-")
        .replace(/[^a-z0-9\-\.]/g, "");
      const uniqueFileName = `${Math.random()
        .toString(15)
        .substring(2)}-${Date.now()}-${fileName}`;
      return uniqueFileName;
    },
  },
});

export const multerUpload = multer({ storage }); // Multer setup with Cloudinary storage
