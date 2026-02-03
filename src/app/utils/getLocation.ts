/* eslint-disable @typescript-eslint/no-explicit-any */
import { envVar } from "../config/envVar";
import axios from "axios";

export const getPlaceName = async (
  lat: number,
  long: number,
): Promise<string> => {
  if (Number.isNaN(lat) || Number.isNaN(long)) {
    throw new Error("Invalid coordinates provided");
  }

  const token = envVar.MAP_BOX_ACCESS_TOKEN;

  // Mapbox expects: longitude,latitude
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
    `${encodeURIComponent(long)},${encodeURIComponent(lat)}.json` +
    `?access_token=${encodeURIComponent(token)}` +
    `&types=address,place,locality,neighborhood,poi` +
    `&limit=1`;

  try {
    const { data } = await axios.get(url);

    const feature = data?.features?.[0];
    if (!feature) return "Unknown Location";

    // Most useful ready-to-show string
    const placeName: string | undefined = feature.place_name;

    // Optional: build a shorter structured output
    const name = feature.text; // primary label
    const context = feature.context || [];

    const findCtx = (idPrefix: string) =>
      context.find(
        (c: any) => typeof c?.id === "string" && c.id.startsWith(idPrefix),
      )?.text;

    const city =
      findCtx("place.") || findCtx("locality.") || findCtx("region.");
    const country = findCtx("country.");

    // Prefer the official place_name if it exists
    if (placeName) return placeName;

    // Fallback if place_name missing
    return (
      [name, city, country].filter(Boolean).join(", ") || "Unknown Location"
    );
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error(
        "Invalid API key or unauthorized access. Check your key.",
      );
    }
    if (error.response?.status === 404) {
      return "No results found for the given coordinates.";
    }
    throw new Error(
      "Error in geocoding: " + (error.message ?? "Unknown error"),
    );
  }
};
