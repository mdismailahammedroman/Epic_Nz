import mongoose, { model } from "mongoose";
import { CategoryEnum, ILocation } from "./location.interface";

const { Schema } = mongoose;

const locationSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Referencing the User model
    },
    name: {
      type: String,
      require: true,
    },
    placeName: {
      type: String,
    },
    imageUrl: {
      type: String,
      required: true, // Assuming an image is uploaded
    },
    ratings: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: { type: Number, min: 1, max: 5 },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    category: {
      type: String,
      enum: Object.values(CategoryEnum),
      required: true,
    },
    // Create geospatial index for the coordinates field
    coordinates: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number] },
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    address: {
      type: String,
    },
    description: {
      type: String,
    },

    AI_Predictions: {
      type: Object, // Store AI-generated data like "Epic Rating" or forecasts
    },
    weatherInfo: {
      type: Object, // Store weather information
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    approvedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Referencing the Admin model (optional)
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

locationSchema.index({ coordinates: "2dsphere" });

const Location = model<ILocation>("Location", locationSchema);

export default Location;
