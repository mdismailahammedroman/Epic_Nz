/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import stream from "stream";
import { envVar } from "./envVar";
import AppError from "../errorHelper/AppError";
import sharp from "sharp";

// Cloudinary config
cloudinary.config({
  cloud_name: envVar?.CLOUDINARY.CLOUDINARY_NAME,
  api_key: envVar.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVar.CLOUDINARY.CLOUDINARY_SECRET,
});

// Upload buffer → optimize → Cloudinary
export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  folder = "locations",
): Promise<UploadApiResponse> => {
  try {
    // Optimize image before upload (HUGE speed + size win)
    const optimizedBuffer = await sharp(buffer)
      .resize(1200)
      .jpeg({ quality: 80 })
      .toBuffer();

    return await new Promise((resolve, reject) => {
      const passThrough = new stream.PassThrough();
      passThrough.end(optimizedBuffer);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          type: "upload",          // ✅ VERY IMPORTANT
          access_mode: "public",   // ✅ ENSURE PUBLIC
          format: "webp",
          transformation: [{ quality: "auto" }],
        },
        (error, result) => {
          if (error)
            return reject(
              new AppError(500, "Cloudinary upload failed", error.message),
            );

          resolve(result as UploadApiResponse);
        },
      );

      passThrough.pipe(uploadStream);
    });
  } catch (error: any) {
    throw new AppError(500, "Image upload error", error.message);
  }
};

// Delete image using public_id (FAST)
export const deleteImageFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    throw new AppError(500, "Cloudinary image deletion failed", error.message);
  }
};

export const cloudinaryUpload = cloudinary;
