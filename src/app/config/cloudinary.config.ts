/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import stream from "stream";
import { envVar } from "./envVar";
import AppError from "../errorHelper/AppError";

// Cloudinary config
cloudinary.config({
  cloud_name: envVar?.CLOUDINARY.CLOUDINARY_NAME,
  api_key: envVar.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVar.CLOUDINARY.CLOUDINARY_SECRET,
});

// Upload buffer to Cloudinary
export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  fileName: string
): Promise<UploadApiResponse> => {
  try {
    return new Promise((resolve, reject) => {
      const public_id = `${fileName}-${Date.now()}`;

      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            public_id,
            folder: "locations", // A folder specifically for location images
          },
          (error, result) => {
            if (error)
              return reject(
                new AppError(500, "Cloudinary upload failed", error.message)
              );
            resolve(result as UploadApiResponse);
          }
        )
        .end(buffer);
    });
  } catch (error: any) {
    throw new AppError(500, `Error uploading file: ${error.message}`);
  }
};

export const deleteImageFromCLoudinary = async (url: string) => {
  try {
    const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp|avif)$/i;
    const match = url.match(regex);

    if (match && match[1]) {
      const public_id = match[1];
      await cloudinary.uploader.destroy(public_id); // Delete from Cloudinary
    }
  } catch (error: any) {
    throw new AppError(401, "Cloudinary image deletion failed", error.message);
  }
};
export const cloudinaryUpload = cloudinary;
