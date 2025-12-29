import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
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

export const multerUpload = multer({ storage }); // <-- Ensure you export this
