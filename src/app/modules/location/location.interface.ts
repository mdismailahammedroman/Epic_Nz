import { Types } from "mongoose";

export interface ILocation {
  user_id: Types.ObjectId;
  name: string;
  category: "epic_photo_spots" | "hike" | "campground" | "freedom_camping"; // Category of the location
  coordinates: { type: { type: String }; coordinates: [number, number] }; // GeoJSON coordinates [longitude, latitude]
  description: string;
  image_url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: Date;
  updated_at: Date;
}
