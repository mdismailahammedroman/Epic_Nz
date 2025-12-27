import { Schema, model } from "mongoose";
import { ILocation } from "./location.interface"; // Assuming the interface is in location.interface.ts

const locationSchema = new Schema<ILocation>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ["epic_photo_spots", "hike", "campground", "freedom_camping"],
    required: true,
  },
  coordinates: {
    type: { type: String, default: "Point" }, // 'Point' type for 2dsphere index
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  description: { type: String, required: true },
  image_url: { type: String, required: true },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Create geospatial index for the coordinates field
locationSchema.index({ coordinates: "2dsphere" });

const Location = model<ILocation>("Location", locationSchema);

export default Location;
