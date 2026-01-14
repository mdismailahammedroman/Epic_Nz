import mongoose, { model } from "mongoose";
import { CategoryEnum, ILocation } from "./location.interface";

const { Schema } = mongoose;

const locationSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    placeName: {
      type: String,
    },
    imageUrl: {
      type: [String],
      required: true,
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
      type: Object,
    },
    weatherInfo: {
      type: Object,
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
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.index({ coordinates: "2dsphere" });

const Location = model<ILocation>("Location", locationSchema);

export default Location;
