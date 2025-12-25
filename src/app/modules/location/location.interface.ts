export interface CreateLocationRequest {
  name: string;
  type: "Epic Spot" | "Hike" | "Campground" | "Freedom Camping";
  coordinates: { lat: number; lon: number };
  description?: string;
  images: string[];
}

export interface LocationResponse {
  name: string;
  type: "Epic Spot" | "Hike" | "Campground" | "Freedom Camping";
  coordinates: { lat: number; lon: number };
  description: string;
  images: string[];
}
