/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/multer-storage-cloudinary.d.ts
declare module "multer-storage-cloudinary" {
  import { StorageEngine } from "multer";
  import { Cloudinary } from "cloudinary";

  interface CloudinaryStorageOptions {
    cloudinary: Cloudinary; // Cloudinary instance from the 'cloudinary' package
    params: Record<string, any>; // Refine this further if you know the params' structure
  }

  // CloudinaryStorage class extends StorageEngine from multer
  class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
    _handleFile(
      req: any,
      file: Express.Multer.File,
      callback: (error: any, info?: any) => void,
    ): void;
    _removeFile(
      req: any,
      file: Express.Multer.File,
      callback: (error: any) => void,
    ): void;
  }

  export { CloudinaryStorage };
}
