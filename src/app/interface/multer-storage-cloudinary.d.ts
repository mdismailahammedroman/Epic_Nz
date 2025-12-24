import { StorageEngine } from "multer";
import { UploadApiResponse } from "cloudinary";

// Improve Cloudinary storage configuration types
declare module "multer-storage-cloudinary" {
  interface CloudinaryStorageOptions {
    cloudinary: any;
    params: any; // Refine types later if needed
  }

  function CloudinaryStorage(options: CloudinaryStorageOptions): StorageEngine;

  export = CloudinaryStorage;
}
