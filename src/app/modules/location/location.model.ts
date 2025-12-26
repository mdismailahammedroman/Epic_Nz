import mongoose, { Schema } from "mongoose";
import { ILocationModel } from "./location.interface";

const locationSchema = new Schema<ILocationModel>(
  {
    name: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
    },
    type: {
      type: String,
      enum: ["Epic Spot", "Hike", "Campground", "Freedom Camping"],
      required: true,
    },
    description: { type: String, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

export const Location = mongoose.model<ILocationModel>(
  "Location",
  locationSchema
);
