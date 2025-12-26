import { Document, Types } from "mongoose";

export interface ILocation {
  name: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  type: "Epic Spot" | "Hike" | "Campground" | "Freedom Camping";
  description: string;
  image: string; // URL to an image or image data
}

export interface ILocationModel extends ILocation, Document {}

export interface ILocationQuery {
  type?: "Epic Spot" | "Hike" | "Campground" | "Freedom Camping";
  page?: number;
  limit?: number;
}
